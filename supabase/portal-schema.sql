-- ============================================================
-- Bix Client Portal — schema for the full portal UI
-- Run in Supabase → SQL Editor. Safe to re-run.
--
-- Extends the original three tables and adds the ones the portal
-- reads. Every table follows the same access rule:
--   a client sees only rows tied to their own profile;
--   an admin sees everything.
-- RLS decides which rows; the grants at the bottom make the tables
-- reachable at all. Both are required.
-- ============================================================

-- ---------- 1. profiles: the fields the portal shows ----------
alter table public.profiles add column if not exists business      text;
alter table public.profiles add column if not exists email         text;
alter table public.profiles add column if not exists phone         text;
alter table public.profiles add column if not exists industry      text;
alter table public.profiles add column if not exists address       text;
alter table public.profiles add column if not exists timezone      text default 'America/Jamaica';
alter table public.profiles add column if not exists plan          text default 'Growth Care';
alter table public.profiles add column if not exists plan_price    numeric(10,2) default 340;
alter table public.profiles add column if not exists next_billing  date;
alter table public.profiles add column if not exists storage_used  numeric(6,2) default 0;

-- ---------- 2. projects: the fields the hero and phases need ----------
alter table public.projects add column if not exists phase          text default 'Discovery';
alter table public.projects add column if not exists progress       int  default 0;
alter table public.projects add column if not exists stack          text;
alter table public.projects add column if not exists launched       date;
alter table public.projects add column if not exists next_milestone text;
alter table public.projects add column if not exists summary        text;
alter table public.projects add column if not exists last_updated   date;
alter table public.projects add column if not exists health_score   int default 95;
alter table public.projects add column if not exists uptime         text default '99.9%';
alter table public.projects add column if not exists load_time      text default '1.0s';

-- ---------- 3. new tables ----------
create table if not exists public.phases (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name       text not null,
  note       text,
  state      text check (state in ('done','now','todo')) not null default 'todo',
  position   int  not null default 0
);

create table if not exists public.requests (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  ref        text,
  title      text not null,
  category   text check (category in ('Feature','Content','Bug','Question')) not null default 'Feature',
  priority   text check (priority in ('Low','Medium','High')) not null default 'Medium',
  status     text check (status in ('Open','In progress','Completed')) not null default 'Open',
  body       text,
  created_at timestamptz default now()
);

create table if not exists public.request_comments (
  id         uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete cascade,
  author     text not null,
  body       text not null,
  created_at timestamptz default now()
);

create table if not exists public.invoices (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  number     text not null,
  descr      text,
  issued     date,
  due        date,
  amount     numeric(10,2) not null default 0,
  status     text check (status in ('Paid','Outstanding','Overdue')) not null default 'Outstanding',
  created_at timestamptz default now()
);

create table if not exists public.payments (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  invoice_no text,
  method     text,
  amount     numeric(10,2) not null default 0,
  paid_on    date default current_date
);

create table if not exists public.files (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  name       text not null,
  kind       text default 'doc',
  size_label text,
  folder     text default 'General',
  url        text,
  created_at timestamptz default now()
);

create table if not exists public.meetings (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  title      text not null,
  meets_on   date,
  meets_at   text,
  duration   text default '30 min',
  upcoming   boolean default true,
  link       text,
  notes      text,
  attendees  text[]
);

create table if not exists public.activity (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  actor      text not null,
  action     text not null,
  created_at timestamptz default now()
);

create table if not exists public.tickets (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid references public.profiles(id) on delete cascade,
  ref        text,
  subject    text not null,
  status     text check (status in ('Open','In progress','Completed')) not null default 'Open',
  created_at timestamptz default now()
);

-- ---------- 4. RLS ----------
alter table public.phases           enable row level security;
alter table public.requests         enable row level security;
alter table public.request_comments enable row level security;
alter table public.invoices         enable row level security;
alter table public.payments         enable row level security;
alter table public.files            enable row level security;
alter table public.meetings         enable row level security;
alter table public.activity         enable row level security;
alter table public.tickets          enable row level security;

-- Client-owned tables: the client sees their own rows, admin sees all.
do $$
declare t text;
begin
  foreach t in array array['requests','invoices','payments','files','meetings','activity','tickets']
  loop
    execute format('drop policy if exists "own rows" on public.%I', t);
    execute format(
      'create policy "own rows" on public.%I for select using (client_id = auth.uid() or public.is_admin())', t);

    execute format('drop policy if exists "admin writes" on public.%I', t);
    execute format(
      'create policy "admin writes" on public.%I for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- A client may raise their own requests and tickets, but not edit them after.
drop policy if exists "client creates requests" on public.requests;
create policy "client creates requests" on public.requests
  for insert with check (client_id = auth.uid());

drop policy if exists "client creates tickets" on public.tickets;
create policy "client creates tickets" on public.tickets
  for insert with check (client_id = auth.uid());

-- Phases hang off a project, so ownership is checked through it.
drop policy if exists "phases follow project" on public.phases;
create policy "phases follow project" on public.phases for select using (
  exists (select 1 from public.projects p
          where p.id = project_id and (p.client_id = auth.uid() or public.is_admin()))
);
drop policy if exists "admin writes phases" on public.phases;
create policy "admin writes phases" on public.phases
  for all using (public.is_admin()) with check (public.is_admin());

-- Comments follow their request.
drop policy if exists "comments follow request" on public.request_comments;
create policy "comments follow request" on public.request_comments for select using (
  exists (select 1 from public.requests r
          where r.id = request_id and (r.client_id = auth.uid() or public.is_admin()))
);
drop policy if exists "admin writes comments" on public.request_comments;
create policy "admin writes comments" on public.request_comments
  for all using (public.is_admin()) with check (public.is_admin());

-- An admin needs to list every client to switch between them.
drop policy if exists "admin reads all profiles" on public.profiles;
create policy "admin reads all profiles" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

-- ---------- 5. Grants ----------
-- RLS limits which rows; without these the tables are unreachable entirely.
grant usage on schema public to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['phases','requests','request_comments','invoices','payments',
                           'files','meetings','activity','tickets']
  loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- ---------- 6. Helpful indexes ----------
create index if not exists idx_requests_client on public.requests(client_id, created_at desc);
create index if not exists idx_invoices_client on public.invoices(client_id, issued desc);
create index if not exists idx_files_client    on public.files(client_id, created_at desc);
create index if not exists idx_activity_client on public.activity(client_id, created_at desc);
create index if not exists idx_meetings_client on public.meetings(client_id, meets_on desc);
create index if not exists idx_phases_project  on public.phases(project_id, position);
