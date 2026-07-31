-- ============================================================
-- Client detail + automated monthly billing
--
-- Billing rule: an invoice is raised on the 1st of each month and is
-- due by the 3rd. Unpaid after the 3rd is Overdue, and reminders go
-- out on a schedule until it is settled.
--
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

-- ---------- 1. client detail ----------
alter table public.profiles add column if not exists website text;

-- Internal notes are agency-only. There is deliberately no client-facing
-- policy: nothing written here should ever surface in the portal.
create table if not exists public.client_notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  author     text,
  body       text not null,
  created_at timestamptz default now()
);

alter table public.client_notes enable row level security;
drop policy if exists "admin only" on public.client_notes;
create policy "admin only" on public.client_notes
  for all using (public.is_admin()) with check (public.is_admin());
grant select, insert, update, delete on public.client_notes to authenticated;
grant all privileges on public.client_notes to service_role;

-- ---------- 2. billing bookkeeping ----------
-- Which cycle an invoice belongs to, so a re-run cannot bill twice.
alter table public.invoices add column if not exists period        date;
alter table public.invoices add column if not exists sent_at       timestamptz;
alter table public.invoices add column if not exists reminders     int default 0;
alter table public.invoices add column if not exists last_reminder timestamptz;

-- One invoice per client per month, enforced by the database rather than by
-- the job being careful. A retry, a double-fire or two overlapping runs all
-- collapse to the same row.
create unique index if not exists invoices_client_period_idx
  on public.invoices (client_id, period) where period is not null;

-- 'Draft' lets an invoice exist before it has been emailed.
alter table public.invoices drop constraint if exists invoices_status_check;
alter table public.invoices add constraint invoices_status_check
  check (status in ('Draft','Paid','Outstanding','Overdue'));

-- ---------- 3. raise this month's invoices ----------
-- Idempotent: the unique index above absorbs repeat calls.
create or replace function public.raise_monthly_invoices(p_period date default date_trunc('month', current_date)::date)
returns table (created int) language plpgsql security definer as $$
declare n int := 0;
begin
  insert into public.invoices (client_id, number, descr, issued, due, amount, status, period)
  select
    p.id,
    'INV-' || to_char(p_period, 'YYYYMM') || '-' || upper(left(regexp_replace(coalesce(p.business, 'CLIENT'), '[^a-zA-Z]', '', 'g'), 3)),
    coalesce(p.plan, 'Monthly retainer') || ' — ' || to_char(p_period, 'Month YYYY'),
    p_period,
    p_period + 2,          -- raised on the 1st, due by the 3rd
    p.plan_price,
    'Draft',
    p_period
  from public.profiles p
  where p.role = 'client'
    and coalesce(p.status, 'Active') = 'Active'
    and coalesce(p.plan_price, 0) > 0
  on conflict do nothing;

  get diagnostics n = row_count;
  return query select n;
end $$;

-- ---------- 4. age unpaid invoices ----------
-- Anything still outstanding after the due date is overdue.
create or replace function public.age_invoices()
returns table (marked int) language plpgsql security definer as $$
declare n int := 0;
begin
  update public.invoices
     set status = 'Overdue'
   where status = 'Outstanding'
     and due < current_date;
  get diagnostics n = row_count;
  return query select n;
end $$;

revoke all on function public.raise_monthly_invoices(date) from public, anon;
revoke all on function public.age_invoices() from public, anon;
grant execute on function public.raise_monthly_invoices(date) to service_role;
grant execute on function public.age_invoices() to service_role;

-- ---------- 5. daily schedule ----------
-- pg_cron fires a daily job; pg_net calls the Edge Function, which raises
-- invoices, ages them, and sends the emails through Resend.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- The function needs the service key to authenticate. Store it once in Vault
-- rather than pasting it into the schedule.
--
--   select vault.create_secret('<service-role-key>', 'service_key');
--
-- Then create the schedule (run this AFTER the secret exists):
--
--   select cron.schedule('bix-billing-daily', '0 13 * * *', $cron$
--     select net.http_post(
--       url     := 'https://mvgyjeocdsngldirehlv.supabase.co/functions/v1/run-billing',
--       headers := jsonb_build_object(
--                    'Content-Type',  'application/json',
--                    'Authorization', 'Bearer ' || (select decrypted_secret
--                                                     from vault.decrypted_secrets
--                                                    where name = 'service_key')),
--       body    := '{}'::jsonb
--     );
--   $cron$);
--
-- 13:00 UTC is 08:00 America/Chicago. cron.schedule is always UTC.
-- Inspect with:  select * from cron.job;
-- Remove with:   select cron.unschedule('bix-billing-daily');
