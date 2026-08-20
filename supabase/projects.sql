-- Campos y permisos del módulo de proyectos del Portal Jorkcáceres.
alter table public.projects add column if not exists start_date date;
alter table public.projects add column if not exists end_date date;

-- Cada proyecto recibe un código inmutable y consecutivo al crearse.
create sequence if not exists public.project_code_sequence;
grant usage, select on sequence public.project_code_sequence to service_role;
select setval(
  'public.project_code_sequence',
  coalesce((select max((substring(code from '([0-9]+)$'))::bigint) from public.projects where code ~ '[0-9]+$'), 0) + 1,
  false
);
alter table public.projects alter column code set default ('PRJ-' || lpad(nextval('public.project_code_sequence')::text, 3, '0'));

-- Conserva la fecha ya registrada en proyectos creados antes de este módulo.
update public.projects
set start_date = project_date
where start_date is null and project_date is not null;

grant select on public.projects to authenticated;
alter table public.projects enable row level security;

drop policy if exists "Administradores gestionan proyectos" on public.projects;
create policy "Administradores gestionan proyectos"
on public.projects for all to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

drop policy if exists "Clientes consultan sus proyectos" on public.projects;
create policy "Clientes consultan sus proyectos"
on public.projects for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and client_id = projects.client_id
  )
);

-- Servicios disponibles para asociar a los proyectos desde Administración → Portal.
create table if not exists public.portal_services (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.portal_services (name)
values ('Presencia Digital'), ('Inteligencia de Negocio'), ('Soluciones Digitales')
on conflict (name) do nothing;

grant select, insert, update on public.portal_services to authenticated;
alter table public.portal_services enable row level security;

drop policy if exists "Usuarios autenticados consultan servicios" on public.portal_services;
create policy "Usuarios autenticados consultan servicios"
on public.portal_services for select to authenticated
using (true);

drop policy if exists "Administradores gestionan servicios" on public.portal_services;
create policy "Administradores gestionan servicios"
on public.portal_services for all to authenticated
using (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
)
with check (
  exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'admin')
);

