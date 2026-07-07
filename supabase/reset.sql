-- BryanF Access destructive reset.
-- Use this only when you want to erase the old portal data in this Supabase
-- project and start again with the current schema.
--
-- This deletes portal tables and storage object metadata for the deliverables
-- bucket. It does NOT delete auth.users, so your existing login user stays.

begin;

drop policy if exists "deliverables_storage_select_own" on storage.objects;
delete from storage.objects where bucket_id = 'deliverables';
delete from storage.buckets where id = 'deliverables';

drop table if exists public.audit_log cascade;
drop table if exists public.project_resources cascade;
drop table if exists public.deliverables cascade;
drop table if exists public.milestones cascade;
drop table if exists public.payments cascade;
drop table if exists public.projects cascade;
drop table if exists public.admins cascade;
drop table if exists public.clients cascade;

commit;
