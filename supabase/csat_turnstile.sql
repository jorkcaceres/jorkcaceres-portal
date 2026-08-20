-- La encuesta pública se recibe exclusivamente mediante la Edge Function submit-csat.
-- Turnstile se valida en el servidor antes de crear una respuesta.
drop policy if exists "public submits" on public.csat_responses;
revoke insert on table public.csat_responses from anon, authenticated;

