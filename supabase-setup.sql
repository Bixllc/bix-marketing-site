-- ============================================================
-- Bix Portal — Supabase Setup
-- Run this in Supabase → SQL Editor → New Query
-- ============================================================

-- 1. Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text check (role in ('admin', 'client')) not null default 'client',
  full_name text,
  company text,
  created_at timestamptz default now()
);

-- 2. Projects
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  status text check (status in ('discovery','design','development','review','launched')) not null default 'discovery',
  start_date date,
  due_date date,
  live_url text,
  created_at timestamptz default now()
);

-- 3. Project updates (messages from Bix to client)
create table public.project_updates (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  message text not null,
  created_at timestamptz default now()
);

-- 4. Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_updates enable row level security;

-- 5. Helper: check if current user is admin
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- 6. RLS Policies

-- profiles: read own; admin reads/writes all
create policy "read own profile"     on public.profiles for select using (auth.uid() = id);
create policy "admin all profiles"   on public.profiles for all    using (public.is_admin());

-- projects: client reads own; admin manages all
create policy "client own projects"  on public.projects for select using (client_id = auth.uid());
create policy "admin all projects"   on public.projects for all    using (public.is_admin());

-- updates: client reads updates for their projects; admin manages all
create policy "client own updates"   on public.project_updates for select using (
  exists (select 1 from public.projects where id = project_id and client_id = auth.uid())
);
create policy "admin all updates"    on public.project_updates for all using (public.is_admin());

-- 7. Trigger: auto-create profile row when user signs up / uses magic link
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- After running: go to Supabase → Authentication → Users
-- Create your admin account (admin@bixllc.net) manually,
-- then run this to promote it to admin:
--
--   update public.profiles
--   set role = 'admin'
--   where id = (select id from auth.users where email = 'admin@bixllc.net');
--
-- ============================================================

-- ============================================================
-- AUTH FLOW CONFIG (dashboard, not SQL)
--
-- The invite and password-reset emails both land on set-password.html.
-- Supabase will only redirect to origins on the allow-list, so add every
-- origin you use under:
--
--   Authentication → URL Configuration → Redirect URLs
--     https://<your-production-domain>/**
--     http://localhost:8899/**          (local testing)
--
-- A link to an origin that is not listed comes back as
-- #error=access_denied — set-password.html renders that as
-- "This link isn't valid" rather than showing a broken form.
--
-- The invite Edge Function builds its redirect from the SITE_URL secret,
-- falling back to the vercel.app domain:
--
--   supabase secrets set SITE_URL=https://<your-production-domain>
--
-- Flow:
--   1. Admin invites a client   → invite email  → set-password.html (type=invite)
--   2. Client forgets password  → reset email   → set-password.html (type=recovery)
--   3. Password saved           → role looked up in profiles
--                               → admin-portal.html or client-portal.html
-- ============================================================

-- ============================================================
-- KEEPALIVE
--
-- Free-tier projects pause after ~7 days with no requests, which breaks
-- invite and reset links. .github/workflows/supabase-keepalive.yml pings
-- this table every 3 days. It holds no application data — it exists purely
-- so an anonymous read returns 200 instead of a permission error.
-- ============================================================

create table if not exists public.heartbeat (
  id smallint primary key default 1,
  checked_at timestamptz default now(),
  constraint heartbeat_single_row check (id = 1)
);

insert into public.heartbeat (id) values (1) on conflict (id) do nothing;

alter table public.heartbeat enable row level security;

drop policy if exists "anyone may read heartbeat" on public.heartbeat;
create policy "anyone may read heartbeat" on public.heartbeat for select using (true);

grant select on public.heartbeat to anon, authenticated;

-- ------------------------------------------------------------
-- WORTH CHECKING: table grants for logged-in users
--
-- A ping as `anon` came back 42501 "permission denied for table profiles".
-- That is correct for anonymous callers, but it means table-level grants
-- are not what Supabase's defaults would normally leave in place — so it is
-- worth confirming the `authenticated` role can still read. RLS restricts
-- which ROWS a user sees; it cannot grant access to the table itself.
--
-- Check what authenticated currently holds:
--
--   select table_name, privilege_type
--   from information_schema.role_table_grants
--   where grantee = 'authenticated' and table_schema = 'public';
--
-- If profiles / projects / project_updates are missing, restore them —
-- the RLS policies above still decide which rows each user actually gets:
--
--   grant select on public.profiles, public.projects, public.project_updates
--     to authenticated;
--   grant insert, update, delete on public.profiles, public.projects,
--     public.project_updates to authenticated;
-- ------------------------------------------------------------
