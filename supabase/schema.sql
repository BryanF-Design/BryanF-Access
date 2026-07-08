-- Bitácora — schema + Row Level Security
-- Run this in the Supabase SQL editor of a fresh project (or via `supabase db push`).
-- Every table is scoped so a client can only ever read rows that belong to them,
-- enforced at the database layer — not just in application code.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- clients: one row per client company/contact, linked 1:1 to a Supabase Auth user
-- ---------------------------------------------------------------------------
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  full_name text not null,
  company text,
  email text not null,
  phone text,
  country text,
  industry text,
  drive_url text,
  notes text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_auth_user_id_idx on public.clients (auth_user_id);
create index if not exists clients_email_idx on public.clients (lower(email));

-- ---------------------------------------------------------------------------
-- client_credentials: sensitive host/provider credentials, encrypted by the
-- app before insert and readable only through admin Server Actions.
-- ---------------------------------------------------------------------------
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

create index if not exists client_credentials_client_id_idx on public.client_credentials (client_id);

-- ---------------------------------------------------------------------------
-- admins: BryanF Design staff who can access /admin. Same 1:1-with-auth-user
-- shape as clients, kept as a separate table so a compromised client session
-- can never be mistaken for staff.
-- ---------------------------------------------------------------------------
create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete cascade,
  full_name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists admins_auth_user_id_idx on public.admins (auth_user_id);

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  summary text,
  status text not null default 'en_progreso'
    check (status in ('planeacion', 'en_progreso', 'en_revision', 'pausado', 'completado')),
  total_price numeric(12, 2) not null default 0,
  currency text not null default 'MXN',
  start_date date,
  target_end_date date,
  created_at timestamptz not null default now()
);

create index if not exists projects_client_id_idx on public.projects (client_id);

-- ---------------------------------------------------------------------------
-- payments: each row is one abono/liquidación against a project's total_price
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  paid_at date not null default current_date,
  method text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists payments_project_id_idx on public.payments (project_id);

-- ---------------------------------------------------------------------------
-- milestones: the project timeline. `position` carries the real display order.
-- ---------------------------------------------------------------------------
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  due_date date,
  completed_at timestamptz,
  status text not null default 'pendiente'
    check (status in ('pendiente', 'en_progreso', 'completado')),
  created_at timestamptz not null default now()
);

create index if not exists milestones_project_id_idx on public.milestones (project_id);

-- ---------------------------------------------------------------------------
-- deliverables: files/artifacts handed to the client, optionally tied to a milestone
-- ---------------------------------------------------------------------------
create table if not exists public.deliverables (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  name text not null,
  description text,
  version text,
  storage_path text, -- path inside the private "deliverables" storage bucket
  status text not null default 'en_progreso'
    check (status in ('en_progreso', 'en_revision', 'aprobado', 'entregado')),
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists deliverables_project_id_idx on public.deliverables (project_id);
create index if not exists deliverables_milestone_id_idx on public.deliverables (milestone_id);

-- ---------------------------------------------------------------------------
-- project_resources: Drive folders, external links, credentials references, and
-- other project-specific resources shown in the client portal.
-- ---------------------------------------------------------------------------
create table if not exists public.project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  resource_type text not null default 'url'
    check (resource_type in ('drive', 'url', 'tutorial', 'credential', 'other')),
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists project_resources_project_id_idx on public.project_resources (project_id);

-- ---------------------------------------------------------------------------
-- project_events: shared content/change calendar. Client-visible rows are
-- shown in the portal; admin-only rows stay private to BryanF.
-- ---------------------------------------------------------------------------
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

create index if not exists project_events_project_id_date_idx on public.project_events (project_id, event_date desc);

-- ---------------------------------------------------------------------------
-- audit_log: written only by the server (service role); never exposed to clients
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_email text,
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  ip text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.clients enable row level security;
alter table public.client_credentials enable row level security;
alter table public.projects enable row level security;
alter table public.payments enable row level security;
alter table public.milestones enable row level security;
alter table public.deliverables enable row level security;
alter table public.project_resources enable row level security;
alter table public.project_events enable row level security;
alter table public.audit_log enable row level security;

-- admins: a signed-in user can only ever see their own admin record — this is
-- the check the app uses to decide whether someone gets into /admin at all
drop policy if exists "admins_select_own" on public.admins;
create policy "admins_select_own"
  on public.admins for select
  using (auth_user_id = auth.uid());

-- clients: a signed-in user can only ever see their own client record
drop policy if exists "clients_select_own" on public.clients;
create policy "clients_select_own"
  on public.clients for select
  using (auth_user_id = auth.uid());

-- projects: only projects owned by the caller's client record
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select
  using (
    client_id in (select id from public.clients where auth_user_id = auth.uid())
  );

-- payments / milestones / deliverables: scoped through their project's owner
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "milestones_select_own" on public.milestones;
create policy "milestones_select_own"
  on public.milestones for select
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );

drop policy if exists "deliverables_select_own" on public.deliverables;
create policy "deliverables_select_own"
  on public.deliverables for select
  using (
    project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );

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

-- audit_log: no policies defined on purpose — with RLS enabled and zero policies,
-- nobody using the anon/authenticated key can read or write it. Only the
-- server-side service-role key (which bypasses RLS) writes to this table.

-- ---------------------------------------------------------------------------
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

-- client_credentials: no policies on purpose. With RLS enabled, anon and
-- authenticated clients cannot read or write credentials. Admin operations use
-- the server-only service role and secrets are encrypted before storage.

-- Storage: private bucket for deliverable files
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('deliverables', 'deliverables', false)
on conflict (id) do nothing;

-- Files are stored under `${project_id}/...`.
-- This policy is defense-in-depth: the app always serves files through
-- short-lived signed URLs generated server-side, but this makes sure a
-- direct client-side storage query can never leak another client's files.
drop policy if exists "deliverables_storage_select_own" on storage.objects;
create policy "deliverables_storage_select_own"
  on storage.objects for select
  using (
    bucket_id = 'deliverables'
    and (storage.foldername(name))[1]::uuid in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );
