# Portal Jorkcáceres — reglas de trabajo

Instrucciones obligatorias para Claude en este repositorio. El estándar común está en [Jorkcáceres OS](https://github.com/jorkcaceres/jorkcaceres-OS): `docs/estandares/Mantenimiento_de_Activos.md` (flujo, aprobaciones, seguridad y reversión) y `docs/activos/Portal_Jorkcaceres.md` (alcance del activo). Este archivo solo contiene lo propio del Portal. Responder en español.

## Aprobación explícita

- Integrar en `main` (publica en producción).
- Aplicar SQL o migraciones y publicar Edge Functions en Supabase (`zfzsigdyycgaqvbauffk`).
- Cambiar configuración de Auth, Storage, secretos, captcha o Hostinger.
- Eliminar datos o archivos.

## Infraestructura

- Frontend estático de una sola página con rutas por `#`. Hostinger publica `main` en portal.jorkcaceres.com.
- Hostinger copia el repositorio completo al sitio. `.htaccess` bloquea carpetas de desarrollo (`supabase/`, `tests/`), documentación, configuración y archivos ocultos, y define las cabeceras de seguridad. Al agregar archivos o carpetas que no use el navegador, comprobar que queden bloqueados. Nunca incluir secretos ni datos personales.
- Supabase: Auth, base de datos, Storage privado y Edge Functions (`supabase/functions/`). Usar solo el conector. El despliegue de GitHub no aplica SQL ni publica funciones: coordinar base de datos → funciones → frontend.
- Cloudflare Turnstile protege formularios públicos y acceso; `submit-csat` valida token, origen, dominio y campos.
- El diagnóstico digital (`supabase/functions/digital-diagnostic`) usa la API de OpenAI en producción con el secreto `OPENAI_API_KEY`. No cambiar el proveedor del modelo sin aprobación explícita y pruebas del recorrido completo.

## Ramas y publicación

- `develop`: trabajo habitual. Ramas de tarea (`feat/`, `fix/`, `docs/`) se crean desde `develop`.
- `main`: solo entregas completas y aprobadas; cada actualización publica en producción.
- Antes de proponer una entrega: `npm test` y `npm run check`. Si cambia `.htaccess`, probar que los recursos del navegador respondan 200 y lo bloqueado 403/404.
- Incrementar `?v=` de los recursos estáticos cuando un cambio pueda quedar en caché.
- Un cambio no está disponible hasta probar el flujo afectado en producción.

## Seguridad e interfaz

- Mantener RLS y validar sesión, rol y reglas de negocio en el servidor. No usar metadatos editables por el usuario para autorizar.
- En el código solo pueden estar la clave publishable de Supabase y la site key de Turnstile.
- Comprobantes en Storage privado, entregados con enlaces firmados de duración limitada.
- Mobile first, tarjetas en lugar de tablas anchas, iconos SVG, estados de carga visibles y paginación de 10 registros.
- Identidad: azul marino `#0D378C`, azul cielo `#6BA5F2`, gris `#F2F2F0`, tarjetas blancas, Inter Tight.
- No inventar datos de negocio ni afirmar pruebas que no se ejecutaron.

## Pendiente conocido

- `tests/editorial.test.js` y `tests/endpoint.test.js` tienen 3 pruebas desactualizadas frente al diagnóstico vigente (pruebas de septiembre, código de octubre). Actualizarlas antes del próximo cambio del diagnóstico.
