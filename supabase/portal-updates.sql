-- ============================================================
-- Portal updates: client-editable requests + file storage
-- Run in Supabase → SQL Editor. Safe to re-run.
-- ============================================================

-- ---------- 1. clients may edit and delete their own requests ----------
-- Previously a client could only create and read them; editing and deleting
-- were admin-only, so the new Edit / Delete buttons would have failed
-- silently at the RLS layer.
drop policy if exists "client edits own requests" on public.requests;
create policy "client edits own requests" on public.requests
  for update using (client_id = auth.uid()) with check (client_id = auth.uid());

drop policy if exists "client deletes own requests" on public.requests;
create policy "client deletes own requests" on public.requests
  for delete using (client_id = auth.uid());

-- ---------- 2. storage bucket for client files ----------
insert into storage.buckets (id, name, public)
values ('client-files', 'client-files', false)
on conflict (id) do nothing;

-- Files are stored under <client_id>/<filename>, so the first path segment
-- is the owner. That is what these policies check.
drop policy if exists "read own files" on storage.objects;
create policy "read own files" on storage.objects for select using (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "upload own files" on storage.objects;
create policy "upload own files" on storage.objects for insert with check (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

drop policy if exists "delete own files" on storage.objects;
create policy "delete own files" on storage.objects for delete using (
  bucket_id = 'client-files'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- ---------- 3. note on admin uploads ----------
-- An admin uploading on a client's behalf writes to <client_id>/… , which the
-- policies above allow via public.is_admin(). The client can then read it,
-- because the first path segment is their own id.
