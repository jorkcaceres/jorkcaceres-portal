-- Registro mínimo de uso del Portal Jorkcáceres.
-- La hora se guarda como fecha local de Colombia (UTC-5).

create table if not exists public.portal_usage_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  occurred_at timestamp without time zone not null default (now() at time zone 'America/Bogota'),
  constraint portal_usage_events_event_type_not_blank check (length(trim(event_type)) > 0)
);

create index if not exists portal_usage_events_user_occurred_at_idx
  on public.portal_usage_events (user_id, occurred_at desc);

create index if not exists portal_usage_events_occurred_at_idx
  on public.portal_usage_events (occurred_at desc);

alter table public.portal_usage_events enable row level security;

drop policy if exists "Administrators can read portal usage events" on public.portal_usage_events;
create policy "Administrators can read portal usage events"
on public.portal_usage_events
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

revoke all on table public.portal_usage_events from anon, authenticated;
grant select on table public.portal_usage_events to authenticated;

create or replace function public.record_portal_login()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required to record a portal event';
  end if;

  insert into public.portal_usage_events (user_id, event_type)
  values (auth.uid(), 'Inicio de sesión');
end;
$$;

revoke all on function public.record_portal_login() from public;
revoke all on function public.record_portal_login() from anon;
grant execute on function public.record_portal_login() to authenticated;

