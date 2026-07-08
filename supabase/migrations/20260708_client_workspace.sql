-- BryanF Access client workspace upgrade.
-- Run this once on an existing Supabase project before deploying this version.

begin;

create extension if not exists "pgcrypto";

alter table public.clients
  add column if not exists phone text,
  add column if not exists country text,
  add column if not exists industry text,
  add column if not exists drive_url text,
  add column if not exists notes text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists clients_email_idx on public.clients (lower(email));

create table if not exists public.client_credentials (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  label text not null,
  provider text,
  login_url text,
  username text,
  secret_encrypted text,
  secret_iv text,
  secret_tag text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists client_credentials_client_id_idx
  on public.client_credentials (client_id);

create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  event_type text not null default 'other'
    check (event_type in ('project', 'payment', 'milestone', 'deliverable', 'resource', 'content', 'meeting', 'review', 'other')),
  event_date date not null default current_date,
  visibility text not null default 'client'
    check (visibility in ('client', 'admin')),
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists project_events_project_id_date_idx
  on public.project_events (project_id, event_date desc);

alter table public.client_credentials enable row level security;
alter table public.project_events enable row level security;

drop policy if exists "project_resources_select_own" on public.project_resources;
create policy "project_resources_select_own"
  on public.project_resources for select
  using (
    resource_type <> 'credential'
    and project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "project_events_select_own_visible" on public.project_events;
create policy "project_events_select_own_visible"
  on public.project_events for select
  using (
    visibility = 'client'
    and project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );

commit;
