# Portal Jorkcáceres — instrucciones para Claude

Fuente oficial de criterio: Jorkcáceres OS (https://github.com/jorkcaceres/jorkcaceres-OS), en especial `docs/activos/Portal_Jorkcaceres.md` y `docs/estandares/Mantenimiento_de_Activos.md`.

## Infraestructura

- Frontend estático de una sola página. Hostinger publica `main` en `public_html/portal` (portal.jorkcaceres.com).
- Supabase `zfzsigdyycgaqvbauffk`: Auth, base de datos, Storage privado y Edge Functions (`supabase/functions/`). Usar solo el conector.
- Cloudflare Turnstile protege formularios públicos y acceso; `submit-csat` valida token, origen, dominio y campos.
- El despliegue de GitHub no aplica SQL ni publica Edge Functions: coordinar base de datos → funciones → frontend.
- Hostinger copia el repositorio completo al sitio: todo archivo en `main` queda accesible públicamente en el dominio. Nunca incluir secretos, datos personales ni información confidencial.
- El diagnóstico digital (`supabase/functions/digital-diagnostic`) usa la API de OpenAI en producción con el secreto `OPENAI_API_KEY`. No cambiar el proveedor del modelo sin aprobación explícita y pruebas del recorrido completo.

## Flujo

- Trabajar en ramas de tarea creadas desde `main` (`feat/`, `fix/`, `docs/`). `main` es producción.
- Antes de proponer una entrega: `npm test` y `npm run check`.
- Incrementar la versión de los recursos estáticos cuando un cambio relevante pueda quedar en caché.
- Integrar en `main`, aplicar SQL o publicar Edge Functions solo con aprobación explícita.
- Un cambio no está disponible hasta probar el flujo afectado en producción.

## Seguridad e interfaz

- Mantener RLS y validar sesión, rol y reglas de negocio en el servidor. No usar metadatos editables por el usuario para autorizar.
- No exponer claves privilegiadas ni secretos en el navegador, el repositorio o conversaciones. Solo claves publishable y la site key de Turnstile pueden estar en el código.
- Comprobantes en Storage privado, entregados con enlaces firmados de duración limitada.
- Mobile first, tarjetas en lugar de tablas anchas, iconos SVG, estados de carga visibles y paginación de 10 registros.
- Identidad: azul marino `#0D378C`, azul cielo `#6BA5F2`, gris `#F2F2F0`, tarjetas blancas, Inter Tight.
- No inventar datos de negocio ni afirmar pruebas que no se ejecutaron. Responder en español.
