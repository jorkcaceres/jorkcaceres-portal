-- Additive module. Sessions are server-only; completed reports have read-only RLS.
create table if not exists public.digital_diagnostic_sessions (
  id uuid primary key default gen_random_uuid(),
  secret_hash text not null,
  owner_id uuid references auth.users(id) on delete set null,
  email text not null,
  contact jsonb not null,
  state jsonb not null,
  revision integer not null default 0,
  busy_until timestamptz,
  lock_id uuid,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours'
);
alter table public.digital_diagnostic_sessions enable row level security;
revoke all on public.digital_diagnostic_sessions from anon, authenticated;
grant all on public.digital_diagnostic_sessions to service_role;
create index if not exists diagnostic_session_email_date on public.digital_diagnostic_sessions(email, created_at);

create table if not exists public.digital_diagnostics (
  id uuid primary key references public.digital_diagnostic_sessions(id),
  client_id uuid references public.clients(id) on delete set null,
  email text not null,
  contact jsonb not null,
  result jsonb not null,
  model_version text not null,
  context text not null,
  created_at timestamptz not null default now()
);
alter table public.digital_diagnostics enable row level security;
revoke all on public.digital_diagnostics from anon, authenticated;
grant select on public.digital_diagnostics to authenticated;
grant all on public.digital_diagnostics to service_role;
create index if not exists digital_diagnostics_client_date on public.digital_diagnostics(client_id, created_at desc);
create index if not exists digital_diagnostics_email on public.digital_diagnostics(email);
drop policy if exists diagnostic_read on public.digital_diagnostics;
create policy diagnostic_read on public.digital_diagnostics for select to authenticated using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid())
    and (p.role = 'admin' or (p.client_id = digital_diagnostics.client_id and p.client_id is not null
      and exists (select 1 from public.clients c where c.id = p.client_id and c.portal_access = true and c.status = 'activo'))))
);

create schema if not exists private;
-- Trigger only: never callable from the browser. Ambiguous duplicate emails stay unlinked.
create or replace function private.link_digital_diagnostic() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  new.email := lower(trim(new.email));
  new.client_id := (select (array_agg(c.id))[1] from public.clients c
    where lower(trim(c.email)) = new.email having count(*) = 1);
  return new;
end; $$;
revoke all on function private.link_digital_diagnostic() from public, anon, authenticated;
drop trigger if exists link_digital_diagnostic on public.digital_diagnostics;
create trigger link_digital_diagnostic before insert on public.digital_diagnostics
for each row execute function private.link_digital_diagnostic();

create or replace function private.sync_digital_diagnostic_client() returns trigger
language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  update public.digital_diagnostics d set client_id = (
    select (array_agg(c.id))[1] from public.clients c
    where lower(trim(c.email)) = d.email having count(*) = 1
  ) where d.email = lower(trim(new.email))
    or (tg_op = 'UPDATE' and d.client_id = new.id);
  return null;
end; $$;
revoke all on function private.sync_digital_diagnostic_client() from public, anon, authenticated;
drop trigger if exists sync_digital_diagnostic_client on public.clients;
create trigger sync_digital_diagnostic_client after insert or update of email on public.clients
for each row execute function private.sync_digital_diagnostic_client();

-- Atomic daily quota for public and authenticated creation. Server role only.
create table if not exists public.digital_diagnostic_limits (
  key text primary key, window_start timestamptz not null default now(), used integer not null default 1
);
alter table public.digital_diagnostic_limits enable row level security;
revoke all on public.digital_diagnostic_limits from anon, authenticated;
grant all on public.digital_diagnostic_limits to service_role;
create or replace function public.diagnostic_consume_quota(bucket text, max_uses integer)
returns boolean language plpgsql security invoker set search_path = pg_catalog, public as $$
declare accepted integer;
begin
  insert into public.digital_diagnostic_limits as q(key) values(bucket)
  on conflict(key) do update set
    used = case when q.window_start < now() - interval '24 hours' then 1 else q.used + 1 end,
    window_start = case when q.window_start < now() - interval '24 hours' then now() else q.window_start end
  where q.window_start < now() - interval '24 hours' or q.used < max_uses
  returning used into accepted;
  return accepted is not null;
end; $$;
revoke all on function public.diagnostic_consume_quota(text, integer) from public, anon, authenticated;
grant execute on function public.diagnostic_consume_quota(text, integer) to service_role;
