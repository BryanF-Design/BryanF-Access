-- Cuentas automáticas: suscripciones y pagos ligados al cliente.
--
-- El sitio (bryanfdesign.com) crea/actualiza estas filas desde los webhooks de
-- Stripe y Mercado Pago con la service role. El cliente sólo lee lo suyo (RLS).
-- Pendiente de aplicar: el portal ya funciona sin ella (muestra vacío).

-- ——— Suscripciones ———
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan text not null default 'Suscripción Todo Digital',
  provider text not null check (provider in ('stripe', 'mercadopago', 'transfer')),
  provider_ref text unique,               -- sub_… (Stripe) / preapproval id (Mercado Pago)
  status text not null default 'activa'
    check (status in ('activa', 'pendiente_pago', 'pausada', 'cancelada')),
  amount numeric(12, 2) not null default 0,
  currency text not null default 'MXN',
  started_at timestamptz not null default now(),
  next_charge_at timestamptz,
  ends_at timestamptz,                    -- fin del periodo pagado tras cancelar
  manage_url text,                        -- portal de Stripe / Mercado Pago
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_client_idx on public.subscriptions (client_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_select_own" on public.subscriptions;
create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (client_id in (select id from public.clients where auth_user_id = auth.uid()));

drop policy if exists "subscriptions_admin_all" on public.subscriptions;
create policy "subscriptions_admin_all"
  on public.subscriptions for all
  using (exists (select 1 from public.admins where auth_user_id = auth.uid()))
  with check (exists (select 1 from public.admins where auth_user_id = auth.uid()));

-- ——— Pagos: también de suscripción y con datos del proveedor ———
alter table public.payments alter column project_id drop not null;

alter table public.payments
  add column if not exists client_id uuid references public.clients (id) on delete cascade,
  add column if not exists subscription_id uuid references public.subscriptions (id) on delete set null,
  add column if not exists concept text,
  add column if not exists currency text not null default 'MXN',
  add column if not exists provider text check (provider in ('stripe', 'mercadopago', 'transfer', 'manual')),
  add column if not exists provider_ref text,
  add column if not exists folio text,
  add column if not exists status text not null default 'aprobado'
    check (status in ('aprobado', 'pendiente', 'rechazado', 'reembolsado')),
  add column if not exists receipt_url text;

create unique index if not exists payments_provider_ref_idx
  on public.payments (provider, provider_ref) where provider_ref is not null;

-- Rellena client_id de los pagos que ya existen (por su proyecto).
update public.payments p
   set client_id = pr.client_id
  from public.projects pr
 where p.project_id = pr.id and p.client_id is null;

alter table public.payments
  drop constraint if exists payments_owner_check;
alter table public.payments
  add constraint payments_owner_check check (project_id is not null or client_id is not null);

-- El cliente lee sus pagos por proyecto o directamente por cliente.
drop policy if exists "payments_select_own" on public.payments;
create policy "payments_select_own"
  on public.payments for select
  using (
    client_id in (select id from public.clients where auth_user_id = auth.uid())
    or project_id in (
      select p.id from public.projects p
      join public.clients c on c.id = p.client_id
      where c.auth_user_id = auth.uid()
    )
  );
