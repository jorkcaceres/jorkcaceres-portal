-- Configuración administrable de la imagen principal del Portal Jorkcáceres.
create table if not exists public.portal_settings (
  id text primary key check (id = 'principal'),
  hero_desktop_url text,
  hero_mobile_url text,
  updated_at timestamptz not null default now()
);

alter table public.portal_settings
  add column if not exists default_clients_filter text not null default 'todos'
    check (default_clients_filter in ('todos', 'activo', 'inactivo')),
  add column if not exists default_projects_filter text not null default 'todos'
    check (default_projects_filter in ('todos', 'planificado', 'en_curso', 'pausado', 'finalizado')),
  add column if not exists default_services_filter text not null default 'todos'
    check (default_services_filter in ('todos', 'activo', 'inactivo')),
  add column if not exists default_payments_filter text not null default 'todos'
    check (default_payments_filter in ('todos', 'pendiente', 'confirmado'));

insert into public.portal_settings (id)
values ('principal')
on conflict (id) do nothing;

alter table public.portal_settings enable row level security;

grant select, insert, update on public.portal_settings to authenticated;

drop policy if exists "Usuarios autenticados pueden ver configuración del portal" on public.portal_settings;
create policy "Usuarios autenticados pueden ver configuración del portal"
on public.portal_settings for select to authenticated
using (true);

drop policy if exists "Administradores pueden insertar configuración del portal" on public.portal_settings;
create policy "Administradores pueden insertar configuración del portal"
on public.portal_settings for insert to authenticated
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Administradores pueden actualizar configuración del portal" on public.portal_settings;
create policy "Administradores pueden actualizar configuración del portal"
on public.portal_settings for update to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portal-assets', 'portal-assets', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Administradores pueden subir imágenes del portal" on storage.objects;
create policy "Administradores pueden subir imágenes del portal"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'portal-assets'
  and exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

