-- Gestión y trazabilidad segura de pagos del Portal Jorkcáceres.
alter table public.project_payments add column if not exists payment_type text;

update public.project_payments
set payment_type = case
  when lower(coalesce(concept, '')) like '%final%' then 'final'
  else 'inicial'
end
where payment_type is null;

create sequence if not exists public.payment_code_sequence;
grant usage, select on sequence public.payment_code_sequence to service_role;
select setval(
  'public.payment_code_sequence',
  coalesce((select max((substring(code from '([0-9]+)$'))::bigint) from public.project_payments where code ~ '[0-9]+$'), 0) + 1,
  false
);
alter table public.project_payments alter column code set default ('PAY-' || lpad(nextval('public.payment_code_sequence')::text, 3, '0'));

grant select on public.project_payments to authenticated;
alter table public.project_payments enable row level security;

drop policy if exists "Administradores gestionan pagos" on public.project_payments;
create policy "Administradores gestionan pagos"
on public.project_payments for all to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Clientes consultan sus pagos" on public.project_payments;
create policy "Clientes consultan sus pagos"
on public.project_payments for select to authenticated
using (
  exists (
    select 1 from public.projects
    join public.profiles on profiles.client_id = projects.client_id
    where projects.id = project_payments.project_id
      and profiles.id = (select auth.uid())
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-receipts', 'payment-receipts', false, 5242880, array['image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Administradores leen comprobantes de pago" on storage.objects;
create policy "Administradores leen comprobantes de pago"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and name ~ '^[0-9a-f-]+/receipt\.png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores suben comprobantes de pago" on storage.objects;
create policy "Administradores suben comprobantes de pago"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-receipts'
  and name ~ '^[0-9a-f-]+/receipt\.png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores actualizan comprobantes de pago" on storage.objects;
create policy "Administradores actualizan comprobantes de pago"
on storage.objects for update to authenticated
using (
  bucket_id = 'payment-receipts'
  and name ~ '^[0-9a-f-]+/receipt\.png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  bucket_id = 'payment-receipts'
  and name ~ '^[0-9a-f-]+/receipt\.png$'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Clientes leen comprobantes de sus pagos" on storage.objects;
create policy "Clientes leen comprobantes de sus pagos"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-receipts'
  and exists (
    select 1 from public.project_payments
    join public.projects on projects.id = project_payments.project_id
    join public.profiles on profiles.client_id = projects.client_id
    where project_payments.id::text = (storage.foldername(name))[1]
      and profiles.id = (select auth.uid())
  )
);

