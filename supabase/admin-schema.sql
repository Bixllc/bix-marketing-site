-- ============================================================
-- Bix Agency Console — the agency-side tables.
--
-- The portal schema covers everything a *client* owns. These are the
-- tables only the agency sees: the lead pipeline, nurture content and
-- the internal activity feed.
--
-- Every table here is admin-only. There is no client-facing policy
-- because no client should ever read a row in any of them.
--
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

-- ---------- 0. columns the console reads that the portal never needed ----------
-- Account standing, so the console can show at-risk and paused clients.
alter table public.profiles add column if not exists status text default 'Active';

-- A real due date. The portal only ever showed `next_milestone` as prose, so
-- there was nothing to sort or flag overdue against.
alter table public.projects add column if not exists due date;

-- When an invoice actually settled. Collected-this-month and the revenue
-- chart both key off this rather than the issue date.
alter table public.invoices add column if not exists paid_on date;

-- Meeting type drives the calendar chip colour.
alter table public.meetings add column if not exists kind text default 'Check-in';

-- ---------- 1. lead pipeline ----------
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  business   text not null,
  contact    text,
  email      text,
  phone      text,
  industry   text,
  source     text,
  value      numeric(12,2) default 0,
  stage      text not null default 'new'
             check (stage in ('new','contacted','qualified','proposal','won','lost')),
  temp       text not null default 'warm'
             check (temp in ('hot','warm','cold')),
  -- Free text, not a FK to auth.users: teammates who own leads do not all
  -- have portal logins.
  owner      text,
  touched    date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references public.leads(id) on delete cascade,
  author     text,
  body       text,
  created_at timestamptz default now()
);

create table if not exists public.lead_events (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid references public.leads(id) on delete cascade,
  what       text,
  created_at timestamptz default now()
);

-- ---------- 2. nurture ----------
create table if not exists public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  channel    text not null default 'email',
  audience   text,
  size       int default 0,
  sent       int default 0,
  open_rate  numeric(5,2) default 0,
  click_rate numeric(5,2) default 0,
  replies    int default 0,
  status     text default 'Draft',
  subject    text,
  body       text,
  sent_on    date default current_date,
  created_at timestamptz default now()
);

create table if not exists public.sequences (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  status     text default 'Active',
  enrolled   int default 0,
  created_at timestamptz default now()
);

create table if not exists public.sequence_steps (
  id          uuid primary key default gen_random_uuid(),
  sequence_id uuid references public.sequences(id) on delete cascade,
  day         int default 0,
  channel     text default 'email',
  title       text,
  position    int default 0
);

create table if not exists public.templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  category   text,
  accent     text default 'purple',
  descr      text,
  subject    text,
  body       text,
  created_at timestamptz default now()
);

-- ---------- 3. team + internal feed ----------
-- Teammates are not necessarily auth users, so this is its own table
-- rather than a view over profiles.
create table if not exists public.team (
  id         text primary key,
  name       text not null,
  role       text,
  email      text,
  initials   text,
  created_at timestamptz default now()
);

-- public.activity is client-scoped. Agency events (a lead moved, a campaign
-- launched) belong to no client, so they live here.
create table if not exists public.agency_events (
  id         uuid primary key default gen_random_uuid(),
  actor      text,
  action     text,
  created_at timestamptz default now()
);

-- ---------- 4. internal meetings ----------
-- The calendar carries internal syncs that belong to no client.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'meetings'
      and column_name = 'client_id' and is_nullable = 'NO'
  ) then
    alter table public.meetings alter column client_id drop not null;
  end if;
end $$;

-- Meetings are read by clients, so a null client_id must stay invisible to
-- them. The portal policy already reads `client_id = auth.uid()`, which is
-- false for null — but state it explicitly so a future edit cannot leak them.
drop policy if exists "own rows" on public.meetings;
create policy "own rows" on public.meetings for select using (
  (client_id is not null and client_id = auth.uid()) or public.is_admin()
);

-- ---------- 5. RLS: admin only ----------
do $$
declare t text;
begin
  foreach t in array array['leads','lead_notes','lead_events','campaigns','sequences',
                           'sequence_steps','templates','team','agency_events']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "admin only" on public.%I', t);
    execute format(
      'create policy "admin only" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------- 6. admin may write client profiles ----------
-- Admin could already read every profile, but not create or edit one, so
-- onboarding a client from the console would have failed at the RLS layer.
drop policy if exists "admin writes profiles" on public.profiles;
create policy "admin writes profiles" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- A client keeps the right to edit their own row.
drop policy if exists "own profile update" on public.profiles;
create policy "own profile update" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------- 7. starter content ----------
-- Message templates are reusable agency assets, not sample customers, so
-- they ship with the schema. Idempotent on name.
insert into public.templates (name, category, accent, descr, subject, body) values
  ('Discovery call follow-up', 'Sales', 'purple',
   'Recap what they said, restate the problem in their words, propose next step.',
   'Recap — what I heard on our call',
   E'Hi {{first_name}},\n\nGood speaking with you. Here is what I heard:\n\n• The problem\n• What it is costing {{business}}\n• What we would build first\n\nIf that lands right, I will put a scope together.\n\n— Sheneska'),
  ('Proposal delivery', 'Sales', 'blue',
   'Send the scope with a clear price, timeline and single decision point.',
   'Your build scope — {{business}}',
   E'Hi {{first_name}},\n\nScope attached. Three things to look at: what is included, what it costs, when it ships.\n\nOne decision from you and we start.\n\n— Sheneska'),
  ('Invoice reminder', 'Billing', 'amber',
   'Firm, friendly, no apology. Links straight to payment.',
   'Invoice for {{business}} is due',
   E'Hi {{first_name}},\n\nQuick reminder that the current invoice for {{business}} is due.\n\nYou can settle it from the portal any time.\n\n— Bix LLC'),
  ('Overdue escalation', 'Billing', 'red',
   'Second notice. States the pause policy without threatening.',
   'Second notice — {{business}}',
   E'Hi {{first_name}},\n\nThis one is past due. We pause active work at 30 days, so I would rather sort it now.\n\nAnything blocking payment on your side?\n\n— Sheneska'),
  ('Welcome & onboarding', 'Delivery', 'green',
   'Sets expectations for week one and points at the portal.',
   'Welcome to Bix, {{first_name}}',
   E'Hi {{first_name}},\n\nYour portal is live. Everything about {{business}} — progress, files, invoices — lives there.\n\nWeek one is discovery. I will send times shortly.\n\n— Sheneska'),
  ('Monthly progress note', 'Delivery', 'purple',
   'What shipped, what is next, what you need from them.',
   '{{business}} — this month',
   E'Hi {{first_name}},\n\nShipped this month:\n•\n\nNext up:\n•\n\nNeed from you:\n•\n\n— Sheneska'),
  ('Referral ask', 'Growth', 'blue',
   'Ask once, make it specific, make it easy to forward.',
   'A small favour',
   E'Hi {{first_name}},\n\n{{business}} has been a good one to build. If you know someone in the same spot you were in six months ago, forward this along.\n\n— Sheneska'),
  ('Re-engagement', 'Growth', 'amber',
   'For leads that went quiet after a proposal.',
   'Closing the file on this?',
   E'Hi {{first_name}},\n\nHaven''t heard back on the {{business}} scope — happy to close the file, no hard feelings.\n\nJust say the word either way.\n\n— Sheneska')
on conflict (name) do nothing;

-- The founder, so lead ownership has someone to point at from day one.
insert into public.team (id, name, role, email, initials)
values ('sw', 'Sheneska Williams', 'Founder · Principal', 'admin@bixllc.net', 'SW')
on conflict (id) do nothing;
