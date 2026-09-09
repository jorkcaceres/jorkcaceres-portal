-- Estados Cancelado para proyectos y pagos del Portal Jorkcáceres.
-- No modifica registros existentes.
alter type public.project_status add value if not exists 'cancelado';
alter type public.payment_status add value if not exists 'cancelado';
