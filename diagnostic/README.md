# Diagnóstico digital V1

## Producto

Dos entradas: `#diagnostico` público con exactamente nombre, apellido, correo, teléfono y empresa; cliente autenticado con datos consultados en servidor, sin formulario repetido. Chat de texto, seis ejes, una aclaración por eje, revisión final y hasta dos correcciones de tema. Sin archivos ni voz.

`#diagnosticos` muestra historial privado. `#admin-diagnosticos` permite consulta administrativa. La comparación toma la evaluación anterior del mismo correo y solo calcula diferencias cuando coinciden negocio y versión. No equipara cambios declarados con mejoras verificadas.

La asociación por correo normaliza espacios y mayúsculas, ocurre al insertar el informe y cuando se crea o actualiza el cliente. Correos ambiguos no se asocian automáticamente. Escribir un correo conocido no permite leer el historial.

## Modelo y alcance

`model.js` contiene doce criterios y cinco afirmaciones incrementales por criterio; la ausencia explícita del primer nivel equivale a cero. La IA interpreta si cada afirmación está respaldada (sí/no/desconocido) y aporta citas literales. El servidor comprueba que las citas existen en los mensajes del usuario y solo admite evidencia afirmativa para aumentar niveles. El motor requiere niveles consecutivos; falta de información no equivale a cero.

La puntuación de cada eje es la media de sus dos criterios cuando están cubiertos. No se produce un promedio global. El radar incompleto conserva únicamente los puntos conocidos. Las recomendaciones son un catálogo versionado, independiente de la IA, ordenado por brechas y prioridad de continuidad. Para prácticas gestionadas se propone medir resultados, no volver a empezar.

Las reglas son reproducibles para la misma evidencia estructurada. La interpretación de lenguaje natural sigue siendo probabilística; requiere más validación con empresas reales. El usuario revisa las citas antes de confirmar. No es una auditoría ni certificación COBIT. Los 5–10 minutos son una meta de diseño, pendiente de validación con usuarios.

## Arquitectura y despliegue

- Frontend estático: `ui.js`, `report.js`, `styles.css`. Integrado en el router del portal.
- PDF local vectorial, sin enviar el informe a un servicio externo. `vendor/pdf-lib.js` es pdf-lib 1.17.1 con licencia incluida.
- Supabase: aplicar `supabase/diagnostics.sql` una vez (registrado como migración `digital_diagnostic_v1`). Tablas aditivas, sin cambios a datos de módulos existentes.
- Función `digital-diagnostic`: fuente en `supabase/functions/digital-diagnostic/index.ts`. El despliegue empaqueta ese archivo como `index.ts` y `diagnostic/model.js` como `model.js`, cambiando SOLO el import relativo a `./model.js`. Mantener ambos sincronizados.
- La función permite visitantes (`verify_jwt=false`); valida origen y Turnstile para inicio público. Para clientes valida el JWT con `auth.getUser`, la pertenencia y el acceso activo. Acciones posteriores requieren secreto aleatorio de sesión; las sesiones privadas exigen también el usuario original.
- Secretos: `OPENAI_API_KEY` obligatorio, `TURNSTILE_SECRET_KEY` ya utilizado por el portal. No guardar valores en Git ni en JavaScript público.
- Modelo predeterminado: `gpt-4.1-2025-04-14`. `DIAGNOSTIC_MODEL` permite cambiarlo solo después de verificar compatibilidad y pruebas. La API usa Responses, salida JSON estructurada y `store:false`.
- `DIAGNOSTIC_ORIGIN` opcional, predeterminado `https://portal.jorkcaceres.com`. El hostname de Turnstile debe coincidir.
- `DIAGNOSTIC_DAILY_LIMIT` opcional: 25 nuevos diagnósticos/día por defecto. Cinco por correo, 500 llamadas globales/día, 32 por sesión, máximo 18 respuestas. Son límites de actividad, no una garantía de coste monetario. Configurar también el control de gasto de la cuenta OpenAI.

No se registra el contenido de las respuestas del proveedor en errores o consola. Los errores incluyen únicamente un código operativo y un mensaje seguro. No se realizan envíos de correo ni WhatsApp: son enlaces voluntarios.

## Acceso y conservación

RLS: informes solo para el cliente asociado con acceso activo o administrador. Los navegadores no pueden crear/modificar informes ni leer tablas de sesiones/cuotas. El secreto de sesión se conserva solo en sessionStorage y su hash en servidor, nunca en URLs. Se valida una reserva atómica para evitar respuestas simultáneas y se deduplican solicitudes de reintento.

Las sesiones son accesibles durante 24 horas. Este vencimiento no borra automáticamente los datos. Se conservan informes para historial; falta definir con el propietario una política definitiva de retención/limpieza de conversaciones antes de escalar el uso. No se presume consentimiento de marketing.

## Verificación

Con Node 24: `node --test tests/diagnostic.test.js tests/endpoint.test.js` y `node --check app.js`.

`tests/browser.mjs`: navegador Edge sin ventana, datos ficticios, proveedor y Supabase simulados. Requiere Playwright; puede localizarse mediante `DIAGNOSTIC_PLAYWRIGHT`. Comprueba formulario de cinco campos, entrada autenticada sin formulario, conversación, reintento, revisión, radar, PDF y lista vacía en escritorio y móvil. Salidas en `output/qa/`, excluidas de Git.

`tests/access.sql`: pruebas transaccionales con ROLLBACK de asociación tardía, normalización de correo, RLS entre clientes, revocación, administrador y cuota. No genera correos ni deja clientes ficticios.

`tests/live.mjs`: prueba optativa que consume API usando una sesión QA temporal previamente creada desde servidor; no se ejecuta con `npm test`. Verifica conversación/interpretación/guardado reales, pero no sustituye la comprobación del formulario público con Turnstile. El fixture se debe borrar después de la prueba.

Antes de publicar: repetir pruebas tras cambios, comprobar migración y función, verificar móvil/PDF, hacer un diagnóstico público real y uno autenticado con cuentas autorizadas. Nunca presentar una simulación de navegador como prueba real del proveedor o del CAPTCHA.

## Referencias

- https://developers.openai.com/api/docs/guides/structured-outputs
- https://developers.openai.com/api/docs/models/gpt-4.1
- https://supabase.com/docs/guides/functions/auth
- https://supabase.com/docs/guides/functions/secrets
