-- Esquema base del Portal Jorkcáceres.
-- Se aplica una única vez sobre un proyecto Supabase vacío.
-- Los ajustes posteriores están en los demás archivos de supabase/.

create extension if not exists pgcrypto;
create schema if not exists private;

do $$ begin create type public.client_status as enum ('activo', 'inactivo'); exception when duplicate_object then null; end $$;
do $$ begin create type public.portal_role as enum ('admin', 'cliente'); exception when duplicate_object then null; end $$;
do $$ begin create type public.project_status as enum ('planificado', 'en_curso', 'finalizado', 'pausado'); exception when duplicate_object then null; end $$;
do $$ begin create type public.payment_status as enum ('pendiente', 'confirmado'); exception when duplicate_object then null; end $$;
do $$ begin create type public.expectation_level as enum ('completamente', 'gran_parte', 'parcialmente', 'no'); exception when duplicate_object then null; end $$;
do $$ begin create type public.return_intent as enum ('si', 'tal_vez', 'no'); exception when duplicate_object then null; end $$;

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) > 0),
  last_name text not null check (char_length(trim(last_name)) > 0),
  email text not null unique check (email = lower(email)),
  phone text,
  company_name text,
  portal_access boolean not null default false,
  status public.client_status not null default 'activo',
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  client_id uuid unique references public.clients(id) on delete set null,
  role public.portal_role not null default 'cliente',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete restrict,
  code text not null unique,
  title text not null,
  service text not null,
  project_date date,
  status public.project_status not null default 'planificado',
  shared_folder_url text,
  observations text,
  created_at timestamptz not null default now()
);

create table if not exists public.project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  code text not null unique,
  concept text not null,
  payment_date date,
  amount numeric(14,2),
  status public.payment_status not null default 'pendiente',
  receipt_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.csat_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  email text not null check (email = lower(email)),
  satisfaction smallint not null check (satisfaction between 1 and 5),
  expectation public.expectation_level not null,
  return_intent public.return_intent not null,
  improvement text,
  submitted_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean language sql stable security definer
set search_path = public, auth, pg_temp
as $$ select coalesce((select role = 'admin' from public.profiles where id = (select auth.uid())), false) $$;

create or replace function private.current_client_id()
returns uuid language sql stable security definer
set search_path = public, auth, pg_temp
as $$ select client_id from public.profiles where id = (select auth.uid()) $$;

revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function private.current_client_id() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.current_client_id() to authenticated;

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.clients, public.profiles, public.projects, public.project_payments, public.csat_responses to authenticated;

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_payments enable row level security;
alter table public.csat_responses enable row level security;

create policy "admin manages clients" on public.clients for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "client reads own record" on public.clients for select to authenticated
using (id = (select private.current_client_id()));

create policy "admin manages portal profiles" on public.profiles for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "user reads own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()));

create policy "admin manages projects" on public.projects for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "client reads own projects" on public.projects for select to authenticated
using (client_id = (select private.current_client_id()));

create policy "admin manages payments" on public.project_payments for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "client reads own project payments" on public.project_payments for select to authenticated
using (exists (select 1 from public.projects where projects.id = project_payments.project_id and projects.client_id = (select private.current_client_id())));

create policy "admin manages csat responses" on public.csat_responses for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "client reads own csat responses" on public.csat_responses for select to authenticated
using (client_id = (select private.current_client_id()));
