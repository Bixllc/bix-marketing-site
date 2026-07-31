-- ============================================================
-- RX-06 again: the Edge Function could not read public.profiles.
--
-- Its diagnostic reported: permission denied for table profiles,
-- while holding a valid service-role key. RLS was never the problem —
-- the role simply had no GRANT on the table, so it was unreachable
-- regardless of policy.
--
-- portal-schema.sql granted to `authenticated` but never to
-- `service_role`, which is what Edge Functions run as.
--
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

grant usage on schema public to service_role;

grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- So tables added later are reachable without repeating this.
alter default privileges in schema public
  grant all privileges on tables to service_role;
alter default privileges in schema public
  grant all privileges on sequences to service_role;

-- Verify: should list profiles among others.
-- select table_name, privilege_type from information_schema.role_table_grants
-- where grantee = 'service_role' and table_schema = 'public' order by 1;
