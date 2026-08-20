-- Campos y permisos del módulo de proyectos del Portal Jorkcáceres.
alter table public.projects add column if not exists start_date date;
alter table public.projects add column if not exists end_date date;

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

