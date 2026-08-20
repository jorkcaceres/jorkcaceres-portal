-- Asociación segura de respuestas públicas de satisfacción con clientes existentes.
-- El navegador nunca envía client_id: la base de datos lo determina por correo.
create schema if not exists private;

create or replace function private.associate_csat_response()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  update public.csat_responses as response
  set client_id = (
    select client.id
    from public.clients as client
    where lower(trim(client.email)) = lower(trim(new.email))
    order by client.id
    limit 1
  )
  where response.id = new.id
    and response.client_id is null;

  return null;
end;
$$;

revoke all on function private.associate_csat_response() from public, anon, authenticated;

drop trigger if exists associate_csat_response_after_insert on public.csat_responses;
create trigger associate_csat_response_after_insert
after insert on public.csat_responses
for each row execute function private.associate_csat_response();

-- Vincula también las respuestas registradas antes de esta mejora.
update public.csat_responses as response
set client_id = (
  select client.id
  from public.clients as client
  where lower(trim(client.email)) = lower(trim(response.email))
  order by client.id
  limit 1
)
where response.client_id is null;

create index if not exists csat_responses_client_id_idx on public.csat_responses (client_id);
create index if not exists clients_email_lower_idx on public.clients (lower(email));

