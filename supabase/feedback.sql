create table public.digital_diagnostic_feedback (
  id uuid primary key,
  session_id uuid references public.digital_diagnostic_sessions(id) on delete set null,
  email text not null,
  contact jsonb not null,
  message text not null check (char_length(message) between 5 and 1500),
  phase text not null,
  axis integer,
  status text not null default 'Nuevo' check (status in ('Nuevo','En revisión','Resuelto')),
  created_at timestamptz not null default now()
);
create index diagnostic_feedback_date on public.digital_diagnostic_feedback(created_at desc);
create index diagnostic_feedback_session on public.digital_diagnostic_feedback(session_id);
alter table public.digital_diagnostic_feedback enable row level security;
revoke all on public.digital_diagnostic_feedback from anon, authenticated;
grant select, update(status) on public.digital_diagnostic_feedback to authenticated;
grant all on public.digital_diagnostic_feedback to service_role;
create policy feedback_admin_read on public.digital_diagnostic_feedback for select to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));
create policy feedback_admin_update on public.digital_diagnostic_feedback for update to authenticated
using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin'));

