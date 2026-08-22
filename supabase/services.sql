-- V1.1 · Servicios recurrentes y renovaciones del Portal Jorkcáceres.
-- Un servicio identifica la relación activa con el cliente; cada renovación conserva su propio historial.

alter table public.portal_settings
  add column if not exists service_alert_days integer not null default 30
  check (service_alert_days between 1 and 365);

create table if not exists public.portal_service_recurrences (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  interval_value integer not null default 1 check (interval_value > 0 and interval_value <= 120),
  interval_unit text not null check (interval_unit in ('dias', 'meses', 'anios')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.portal_service_recurrences (name, interval_value, interval_unit)
values ('Mensual', 1, 'meses'), ('Anual', 1, 'anios')
on conflict (name) do nothing;

create table if not exists public.client_services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 120),
  recurrence_id uuid not null references public.portal_service_recurrences(id) on delete restrict,
  amount numeric(14,2) check (amount is null or amount >= 0),
  observations text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.service_renewals (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.client_services(id) on delete cascade,
  renewal_date date not null,
  status text not null default 'programado' check (status in ('programado', 'renovado', 'cancelado')),
  receipt_path text,
  renewed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status in ('programado', 'cancelado') and receipt_path is null and renewed_at is null)
    or (status = 'renovado' and receipt_path is not null and renewed_at is not null)
  )
);

-- Un servicio inactivo conserva su historial, pero no mantiene cobros futuros.
alter table public.service_renewals drop constraint if exists service_renewals_status_check;
alter table public.service_renewals drop constraint if exists service_renewals_check;
alter table public.service_renewals add constraint service_renewals_status_check
  check (status in ('programado', 'renovado', 'cancelado'));
alter table public.service_renewals add constraint service_renewals_receipt_state_check
  check (
    (status in ('programado', 'cancelado') and receipt_path is null and renewed_at is null)
    or (status = 'renovado' and receipt_path is not null and renewed_at is not null)
  );

update public.service_renewals as renewal
set status = 'cancelado', updated_at = now()
from public.client_services as service
where service.id = renewal.service_id
  and service.active = false
  and renewal.status = 'programado';

create unique index if not exists service_renewals_one_open_cycle
  on public.service_renewals(service_id)
  where status = 'programado';

create index if not exists client_services_client_id_idx on public.client_services(client_id);
create index if not exists client_services_recurrence_id_idx on public.client_services(recurrence_id);
create index if not exists service_renewals_service_id_idx on public.service_renewals(service_id);
create index if not exists service_renewals_open_date_idx on public.service_renewals(renewal_date) where status = 'programado';

grant select on public.portal_service_recurrences, public.client_services, public.service_renewals to authenticated;
grant insert, update on public.portal_service_recurrences to authenticated;

alter table public.portal_service_recurrences enable row level security;
alter table public.client_services enable row level security;
alter table public.service_renewals enable row level security;

drop policy if exists "Usuarios autenticados consultan recurrencias" on public.portal_service_recurrences;
create policy "Usuarios autenticados consultan recurrencias"
on public.portal_service_recurrences for select to authenticated
using (true);

drop policy if exists "Administradores gestionan recurrencias" on public.portal_service_recurrences;
create policy "Administradores gestionan recurrencias"
on public.portal_service_recurrences for all to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores gestionan servicios de clientes" on public.client_services;
create policy "Administradores gestionan servicios de clientes"
on public.client_services for all to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Clientes consultan sus servicios" on public.client_services;
create policy "Clientes consultan sus servicios"
on public.client_services for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.client_id = client_services.client_id
  )
);

drop policy if exists "Administradores gestionan renovaciones" on public.service_renewals;
create policy "Administradores gestionan renovaciones"
on public.service_renewals for all to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Clientes consultan sus renovaciones" on public.service_renewals;
create policy "Clientes consultan sus renovaciones"
on public.service_renewals for select to authenticated
using (
  exists (
    select 1
    from public.client_services
    join public.profiles on profiles.client_id = client_services.client_id
    where client_services.id = service_renewals.service_id
      and profiles.id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('service-renewal-receipts', 'service-renewal-receipts', false, 5242880, array['image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Administradores leen comprobantes de renovaciones" on storage.objects;
create policy "Administradores leen comprobantes de renovaciones"
on storage.objects for select to authenticated
using (
  bucket_id = 'service-renewal-receipts'
  and name ~ '^[0-9a-f-]+/receipt[.]png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores suben comprobantes de renovaciones" on storage.objects;
create policy "Administradores suben comprobantes de renovaciones"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'service-renewal-receipts'
  and name ~ '^[0-9a-f-]+/receipt[.]png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores actualizan comprobantes de renovaciones" on storage.objects;
create policy "Administradores actualizan comprobantes de renovaciones"
on storage.objects for update to authenticated
using (
  bucket_id = 'service-renewal-receipts'
  and name ~ '^[0-9a-f-]+/receipt[.]png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  bucket_id = 'service-renewal-receipts'
  and name ~ '^[0-9a-f-]+/receipt[.]png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Clientes leen comprobantes de sus renovaciones" on storage.objects;
create policy "Clientes leen comprobantes de sus renovaciones"
on storage.objects for select to authenticated
using (
  bucket_id = 'service-renewal-receipts'
  and exists (
    select 1
    from public.service_renewals
    join public.client_services on client_services.id = service_renewals.service_id
    join public.profiles on profiles.client_id = client_services.client_id
    where service_renewals.id::text = (storage.foldername(storage.objects.name))[1]
      and profiles.id = (select auth.uid())
  )
);

