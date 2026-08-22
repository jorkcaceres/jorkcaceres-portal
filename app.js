import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const app = document.querySelector('#app');
const logo = 'assets/jorkcaceres-horizontal-negro.png';
const supabase = createClient('https://zfzsigdyycgaqvbauffk.supabase.co', 'sb_publishable_K5khETTDgbkAmAOeiDg2Tw_gKfdxBeq');
const state = { session: null, profile: null, clientPage: 1, projectPage: 1, paymentPage: 1, servicePage: 1, clients: new Map(), projects: new Map(), payments: new Map(), clientServices: new Map(), portalSettings: null, services: [], paymentTypes: [], recurrences: [] };
const privateRoutes = new Set(['inicio', 'proyectos', 'servicios', 'encuestas', 'admin', 'admin-clientes', 'admin-proyectos', 'admin-servicios', 'admin-pagos', 'admin-encuestas', 'admin-portal']);
const helpUrl = 'https://wa.me/573243062809?text=Hola%2C+necesito+ayuda.+Vengo+del+portal+de+Jorkc%C3%A1ceres';
const turnstileSiteKey = '0x4AAAAAAEWb66YwTWh3cmmT';
const turnstileScriptUrl = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const turnstileWidgets = new Map();
const footer = () => '<footer class="footer">© 2026 Jorkcáceres. Portal para clientes. V1.1</footer>';
let activityCount = 0;
const arrowIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
const backIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/><path d="M9 12h12"/></svg>';
const copyIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const cardIcons = {
  projects: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  surveys: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  services: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="8"/></svg>',
};
const btn = (label, action, classes = '', type = 'button') => `<button type="${type}" class="button ${classes}" onclick="${action}">${label}<span class="circle">${arrowIcon}</span></button>`;
const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const errorText = (error) => error?.message || 'No fue posible completar la acción.';

function header() {
  const name = state.session?.user?.email || 'Mi cuenta';
  return `<header class="header"><a class="brand" href="#inicio"><img src="${logo}" alt="Jorkcáceres" /></a><div class="header-actions"><span class="account-name">${esc(name)}</span><a class="help-link" href="${helpUrl}" target="_blank" rel="noreferrer">¿Necesitas ayuda?</a><button class="user-button" title="Cerrar sesión" aria-label="Cerrar sesión" onclick="signOut()"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></svg></button></div></header>`;
}

function publicHeader() {
  return `<header class="header"><a class="brand" href="#login"><img src="${logo}" alt="Jorkcáceres" /></a><div class="header-actions"><a class="help-link" href="${helpUrl}" target="_blank" rel="noreferrer">¿Necesitas ayuda?</a><button class="user-button" title="Volver atrás" aria-label="Volver atrás" onclick="location.hash='#login'">${backIcon}</button></div></header>`;
}

function breadcrumbs(items) {
  return `<nav class="breadcrumbs" aria-label="Ruta de navegación">${items.map((item, index) => index === items.length - 1 ? `<span aria-current="page">${esc(item.label)}</span>` : `<a href="${item.href}">${esc(item.label)}</a>`).join('<span class="breadcrumb-separator" aria-hidden="true">/</span>')}</nav>`;
}

function loginView(message = '') {
  app.innerHTML = `<section class="login"><div class="login-panel"><a class="brand" href="#login"><img src="${logo}" alt="Jorkcáceres" /></a><div class="login-content"><p class="eyebrow">Portal Jorkcáceres</p><h1>Todo lo importante, en un solo lugar.</h1><p class="lead">Consulta el estado de tus proyectos, entregables, pagos y encuestas.</p><form class="form" onsubmit="signIn(event)"><label class="field">Correo electrónico<input id="login-email" type="email" placeholder="nombre@empresa.com" autocomplete="email" required></label><label class="field">Contraseña<input id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" required></label><div id="login-turnstile" class="turnstile-widget"></div><div class="form-row"><span></span><button type="button" class="text-link" onclick="requestPasswordReset()">¿Olvidaste tu clave?</button></div>${message ? `<p class="form-message">${esc(message)}</p>` : ''}${btn('Iniciar sesión', '', 'primary', 'submit')}</form></div></div><aside class="login-aside"><article class="announcement"><span class="tag">Tu opinión cuenta</span><h2>¿Cómo fue tu experiencia?</h2><p>Tu respuesta me ayuda a mejorar la forma en que trabajo y las soluciones que construyo.</p>${btn('Responder encuesta', "location.hash='#satisfaccion'", 'secondary')}</article><article class="announcement coming"><span class="tag">Próximamente</span><h2>Diagnóstico digital</h2><p>Conoce el estado actual de tu empresa y encuentra oportunidades para avanzar.</p><button class="button secondary" disabled>Muy pronto</button></article></aside></section>${footer()}`;
  turnstileWidgets.delete('login');
  mountTurnstile('login-turnstile', 'login');
}

function recoveryView() {
  const mandatory = state.session?.user?.user_metadata?.force_password_change === true;
  const description = mandatory ? 'Por seguridad, debes crear una nueva contraseña antes de continuar.' : 'Elige una contraseña nueva para ingresar al portal.';
  app.innerHTML = `<section class="login"><div class="login-panel"><a class="brand" href="#login"><img src="${logo}" alt="Jorkcáceres" /></a><div class="login-content"><p class="eyebrow">Restablecer contraseña</p><h1>Crea una nueva clave.</h1><p class="lead">${description}</p><form class="form" onsubmit="updatePassword(event)"><label class="field">Nueva contraseña<input id="new-password" type="password" minlength="8" autocomplete="new-password" required></label><label class="field">Confirmar contraseña<input id="confirm-password" type="password" minlength="8" autocomplete="new-password" required></label>${btn('Guardar contraseña', '', 'primary', 'submit')}</form>${mandatory ? '<button class="text-link recovery-signout" onclick="signOut()">Cerrar sesión</button>' : ''}</div></div><aside class="login-aside"><article class="announcement"><span class="tag">Portal seguro</span><h2>Tu cuenta está protegida.</h2><p>Después de guardar tu nueva contraseña podrás ingresar con normalidad.</p></article></aside></section>${footer()}`;
}

async function homeView() {
  const email = state.session?.user?.email || 'bienvenido';
  const [settings, firstName, clientServices] = await Promise.all([loadPortalSettings(), loadClientFirstName(), loadClientServices()]);
  const heroImage = settings?.hero_desktop_url ? `<picture class="hero-image"><source media="(max-width: 760px)" srcset="${esc(settings.hero_mobile_url || settings.hero_desktop_url)}"><img src="${esc(settings.hero_desktop_url)}" alt="Imagen principal del Portal Jorkcáceres"></picture>` : '<div class="hero-mark" aria-hidden="true">J</div>';
  const greeting = firstName || email;
  const alertDays = Number(settings?.service_alert_days || 30);
  const alerts = clientServices.filter(service => service.active !== false && (() => {
    const renewal = openRenewal(service);
    return renewal && renewalRemainingDays(renewal.renewal_date) <= alertDays;
  })());
  const alertSection = alerts.length ? `<section class="section"><div class="section-heading"><div><p class="eyebrow">Atención</p><h2>Próximas renovaciones</h2><p>Tienes servicios que requieren renovación en los próximos ${alertDays} días.</p></div></div><div class="card-grid">${alerts.map(service => { const renewal = openRenewal(service); const days = renewalRemainingDays(renewal.renewal_date); return `<article class="card"><div class="card-top"><div><p class="eyebrow">Servicio</p><h3>${esc(service.name)}</h3></div><span class="status ${renewalStatusClass(renewal, alertDays)}">${renewalStatus(renewal, alertDays)}</span></div><p>Renovación: ${date(renewal.renewal_date)} · ${days < 0 ? `Venció hace ${Math.abs(days)} días` : days === 0 ? 'Vence hoy' : `${days} días restantes`}</p>${service.amount !== null ? `<p><strong>${money(service.amount)}</strong></p>` : ''}${btn('Ver servicio', "location.hash='#servicios'", 'small secondary')}</article>`; }).join('')}</div></section>` : '';
  app.innerHTML = `${header()}<main class="page"><section class="hero"><div><p class="eyebrow">Hola, ${esc(greeting)}</p><h1>Tu espacio de trabajo con Jorkcáceres.</h1><p class="lead">Aquí encontrarás información relevante de los proyectos que realizamos juntos, tus servicios y las encuestas que has respondido.</p></div>${heroImage}</section>${alertSection}<section class="section"><div class="section-heading"><div><p class="eyebrow">Accesos</p><h2>¿Qué quieres consultar?</h2></div></div><div class="card-grid"><article class="card"><div class="card-icon">${cardIcons.projects}</div><h3>Proyectos</h3><p>Revisa el estado de tus proyectos, sus entregables, observaciones y pagos.</p>${btn('Ver proyectos', "location.hash='#proyectos'")}</article><article class="card"><div class="card-icon">${cardIcons.services}</div><h3>Servicios</h3><p>Consulta tus renovaciones, estados y comprobantes disponibles.</p>${btn('Ver servicios', "location.hash='#servicios'")}</article><article class="card"><div class="card-icon">${cardIcons.surveys}</div><h3>Encuestas</h3><p>Consulta las encuestas que has realizado y los resultados disponibles.</p>${btn('Ver encuestas', "location.hash='#encuestas'")}</article></div></section></main>${footer()}`;
}

async function loadClientFirstName() {
  const clientId = state.profile?.client_id;
  if (!clientId) return '';
  const { data, error } = await supabase.from('clients').select('first_name').eq('id', clientId).maybeSingle();
  return error ? '' : (data?.first_name || '').trim();
}

async function loadPortalSettings(force = false) {
  if (state.portalSettings && !force) return state.portalSettings;
  const { data, error } = await supabase.from('portal_settings').select('hero_desktop_url, hero_mobile_url, service_alert_days').eq('id', 'principal').maybeSingle();
  if (!error) state.portalSettings = data;
  return state.portalSettings;
}

function loading(title) { app.innerHTML = `${header()}<main class="page"><p class="eyebrow">Portal</p><h1>${title}</h1><p class="lead">Cargando tu información…</p></main>${footer()}`; }
function dataError(title, error) { app.innerHTML = `${header()}<main class="page"><p class="eyebrow">Portal</p><h1>${title}</h1><div class="notice">No fue posible cargar la información: ${esc(errorText(error))}</div></main>${footer()}`; }
function startActivity(message = 'Cargando…') { activityCount += 1; let indicator = document.querySelector('#activity-indicator'); if (!indicator) { document.body.insertAdjacentHTML('beforeend', '<div id="activity-indicator" class="activity-indicator" role="status" aria-live="polite"><span></span><strong></strong></div>'); indicator = document.querySelector('#activity-indicator'); } indicator.querySelector('strong').textContent = message; }
function finishActivity() { activityCount = Math.max(0, activityCount - 1); if (activityCount === 0) document.querySelector('#activity-indicator')?.remove(); }
function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (window.__turnstileLoading) return window.__turnstileLoading;
  window.__turnstileLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = turnstileScriptUrl;
    script.async = true;
    script.onload = () => resolve(window.turnstile);
    script.onerror = () => reject(new Error('No fue posible cargar la verificación de seguridad.'));
    document.head.appendChild(script);
  });
  return window.__turnstileLoading;
}
async function mountTurnstile(elementId, key) {
  const element = document.getElementById(elementId);
  if (!element) return;
  try {
    const turnstile = await loadTurnstile();
    if (!document.getElementById(elementId) || turnstileWidgets.has(key)) return;
    let widgetId;
    widgetId = turnstile.render(`#${elementId}`, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      callback: token => turnstileWidgets.set(key, { widgetId, token }),
      'expired-callback': () => turnstileWidgets.set(key, { widgetId, token: null }),
      'error-callback': () => turnstileWidgets.set(key, { widgetId, token: null }),
    });
    turnstileWidgets.set(key, { widgetId, token: null });
  } catch (error) { element.innerHTML = '<p class="form-message">No fue posible cargar la verificación de seguridad. Recarga la página e inténtalo nuevamente.</p>'; }
}
function captchaToken(key) { return turnstileWidgets.get(key)?.token || null; }
function resetTurnstile(key) { const widget = turnstileWidgets.get(key); if (widget?.widgetId !== undefined && window.turnstile) window.turnstile.reset(widget.widgetId); if (widget) widget.token = null; }

async function projectsView() {
  loading('Proyectos');
  const { data, error } = await supabase.from('projects').select('*').order('project_date', { ascending: false });
  if (error) return dataError('Proyectos', error);
  const cards = data.length ? data.map(p => `<article class="card"><div class="card-top"><div><p class="eyebrow">${esc(p.code)}</p><h3>${esc(p.title)}</h3></div><span class="status ${p.status === 'en_curso' ? 'progress' : ''}">${status(p.status)}</span></div><p>${esc(p.service)}</p><div class="item-grid"><span>Fecha<strong>${date(p.project_date)}</strong></span><span>Servicio<strong>${esc(p.service)}</strong></span></div><div class="modal-actions">${btn('Información', `projectInfo('${p.id}')`, 'small secondary')}${btn('Pagos', `projectPayments('${p.id}')`, 'small')}</div></article>`).join('') : '<div class="empty">Aún no tienes proyectos registrados en el portal.</div>';
  app.innerHTML = `${header()}<main class="page">${breadcrumbs([{ label: 'Portal', href: '#inicio' }, { label: 'Proyectos' }])}<h1>Proyectos</h1><p class="lead">Consulta la información y trazabilidad de los proyectos que realizamos juntos.</p><div class="card-grid">${cards}</div></main>${footer()}`;
}

async function projectInfo(id) {
  const { data: p, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) return modal('No fue posible abrir el proyecto', `<p>${esc(errorText(error))}</p>`);
  const folder = p.shared_folder_url || '';
  modal(esc(p.title), `<p><strong>Carpeta compartida</strong></p>${folder ? `<p class="meta link-value"><a class="text-link" href="${esc(folder)}" target="_blank" rel="noreferrer">Abrir carpeta compartida</a></p>` : '<p class="meta">No hay una carpeta compartida registrada todavía.</p>'}<p><strong>Observaciones</strong></p><p>${esc(p.observations || 'No hay observaciones registradas.')}</p>`);
}

async function projectPayments(id) {
  await loadPortalPaymentTypes();
  const { data, error } = await supabase.from('project_payments').select('*').eq('project_id', id).order('payment_date', { ascending: true });
  if (error) return modal('No fue posible abrir los pagos', `<p>${esc(errorText(error))}</p>`);
  const cards = data.map(payment => `<article class="payment-detail-card"><span class="payment-code">${esc(payment.code)}</span><span class="status ${payment.status === 'pendiente' ? 'progress' : ''}">${payment.status === 'confirmado' ? 'Confirmado' : 'Pendiente'}</span><p class="payment-summary">${esc(paymentType(payment.payment_type))} · <strong>${payment.amount ? money(payment.amount) : 'Monto por definir'}</strong>${payment.status === 'confirmado' ? ` <small>· ${date(payment.payment_date)}</small>` : ''}</p>${payment.receipt_path ? btn('Ver comprobante', `openPaymentReceipt('${esc(payment.receipt_path)}')`, 'small secondary') : ''}</article>`).join('');
  modal('Pagos del proyecto', data.length ? `<div class="payment-detail-list">${cards}</div>` : '<p>No hay pagos registrados para este proyecto.</p>');
}

async function loadClientServices() {
  const { data, error } = await supabase.from('client_services').select('id,name,amount,observations,active,portal_service_recurrences(name),service_renewals(id,renewal_date,status,receipt_path,renewed_at)').order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

function openRenewal(service) {
  return (service.service_renewals || []).find(renewal => renewal.status === 'programado') || null;
}

function colombiaToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function renewalRemainingDays(value) {
  const milliseconds = 24 * 60 * 60 * 1000;
  return Math.round((Date.parse(`${value}T12:00:00Z`) - Date.parse(`${colombiaToday()}T12:00:00Z`)) / milliseconds);
}

function renewalStatus(renewal, alertDays = 30) {
  if (!renewal) return 'Sin programar';
  if (renewal.status === 'renovado') return 'Renovado';
  if (renewal.status === 'cancelado') return 'Cancelado';
  const days = renewalRemainingDays(renewal.renewal_date);
  if (days < 0) return 'Vencido';
  if (days <= alertDays) return 'Próximo a vencer';
  return 'Programado';
}

function renewalStatusClass(renewal, alertDays = 30) {
  return renewalStatus(renewal, alertDays) === 'Renovado' ? '' : 'progress';
}

async function servicesView() {
  loading('Servicios');
  try {
    const [services, settings] = await Promise.all([loadClientServices(), loadPortalSettings()]);
    const alertDays = Number(settings?.service_alert_days || 30);
    const cards = services.length ? services.map(service => {
      const renewal = openRenewal(service);
      const recurrence = service.portal_service_recurrences?.name || 'Sin recurrencia';
      const remaining = renewal ? renewalRemainingDays(renewal.renewal_date) : null;
      const statusLabel = service.active === false ? 'Inactivo' : (renewal ? renewalStatus(renewal, alertDays) : 'Sin programar');
      const renewalDescription = service.active === false
        ? 'Este servicio está inactivo. Conservas el historial de pagos realizados.'
        : renewal ? `Próxima renovación: ${date(renewal.renewal_date)}${remaining !== null ? ` · ${remaining < 0 ? `Venció hace ${Math.abs(remaining)} días` : remaining === 0 ? 'Vence hoy' : `${remaining} días restantes`}` : ''}` : 'No hay una renovación programada.';
      return `<article class="card"><div class="card-top"><div><p class="eyebrow">${esc(recurrence)}</p><h3>${esc(service.name)}</h3></div><span class="status ${service.active === false ? 'progress' : renewalStatusClass(renewal, alertDays)}">${statusLabel}</span></div><p>${renewalDescription}</p><div class="item-grid"><span>Valor<strong>${service.amount === null ? 'Por definir' : money(service.amount)}</strong></span><span>Recurrencia<strong>${esc(recurrence)}</strong></span></div>${btn('Ver detalles', `serviceInfo('${service.id}')`, 'small secondary')}</article>`;
    }).join('') : '<div class="empty">Aún no tienes servicios activos registrados en el portal.</div>';
    app.innerHTML = `${header()}<main class="page">${breadcrumbs([{ label: 'Portal', href: '#inicio' }, { label: 'Servicios' }])}<h1>Servicios</h1><p class="lead">Consulta las renovaciones de tus servicios, sus estados y comprobantes disponibles.</p><div class="card-grid">${cards}</div></main>${footer()}`;
  } catch (error) { dataError('Servicios', error); }
}

async function serviceInfo(id) {
  const { data: service, error } = await supabase.from('client_services').select('id,name,amount,observations,active,portal_service_recurrences(name),service_renewals(id,renewal_date,status,receipt_path,renewed_at)').eq('id', id).single();
  if (error) return modal('No fue posible abrir el servicio', `<p>${esc(errorText(error))}</p>`);
  const history = (service.service_renewals || [])
    .filter(renewal => service.active !== false || renewal.status !== 'cancelado')
    .filter(renewal => service.active !== false || renewal.status === 'renovado')
    .sort((a, b) => String(b.renewal_date).localeCompare(String(a.renewal_date)));
  const rows = history.map(renewal => `<article class="payment-detail-card"><span class="payment-code">${date(renewal.renewal_date)}</span><span class="status ${renewalStatusClass(renewal)}">${renewalStatus(renewal)}</span><p class="payment-summary">${renewal.status === 'renovado' ? `Renovado el ${date(renewal.renewed_at)}` : 'Renovación pendiente de confirmación'}</p>${renewal.receipt_path ? btn('Ver comprobante', `openServiceReceipt('${esc(renewal.receipt_path)}')`, 'small secondary') : ''}</article>`).join('');
  modal(esc(service.name), `<p><strong>Recurrencia:</strong> ${esc(service.portal_service_recurrences?.name || 'No registrada')}</p><p><strong>Valor:</strong> ${service.amount === null ? 'Por definir' : money(service.amount)}</p><p><strong>Observaciones:</strong><br>${esc(service.observations || 'No hay observaciones registradas.')}</p>${service.active === false ? '<p class="meta">Este servicio está inactivo. No tiene renovaciones ni cobros futuros programados.</p>' : ''}<p><strong>Renovaciones</strong></p><div class="payment-detail-list">${rows || (service.active === false ? '<p>No hay renovaciones confirmadas.</p>' : '<p>No hay renovaciones registradas.</p>')}</div>`);
}

async function surveysView() {
  loading('Encuestas');
  const { data, error } = await supabase.from('csat_responses').select('*').order('submitted_at', { ascending: false });
  if (error) return dataError('Encuestas', error);
  const cards = data.length ? data.map(r => `<article class="card"><div class="card-top"><div><p class="eyebrow">CSAT</p><h3>Encuesta de satisfacción</h3></div><span class="status">Respondida</span></div><p>Completada el ${date(r.submitted_at)}</p><div class="item-grid"><span>Satisfacción<strong>${r.satisfaction} / 5</strong></span><span>Intención<strong>${returnLabel(r.return_intent)}</strong></span></div>${btn('Ver respuesta', `surveyResponse('${r.id}')`, 'small')}</article>`).join('') : '<div class="empty">Aún no hay encuestas respondidas con esta cuenta.</div>';
  app.innerHTML = `${header()}<main class="page">${breadcrumbs([{ label: 'Portal', href: '#inicio' }, { label: 'Encuestas' }])}<h1>Encuestas</h1><p class="lead">Aquí se conserva la trazabilidad de las encuestas que has respondido.</p><section class="section"><div class="card-grid">${cards}</div></section></main>${footer()}`;
}

async function surveyResponse(id) {
  const { data, error } = await supabase.from('csat_responses').select('*').eq('id', id).single();
  if (error) return modal('No fue posible abrir la respuesta', `<p>${esc(errorText(error))}</p>`);
  modal('Encuesta de satisfacción', `<p><strong>Índice de satisfacción:</strong> ${data.satisfaction} de 5</p><p><strong>Cumplimiento de expectativas:</strong> ${expectation(data.expectation)}</p><p><strong>¿Volvería a trabajar contigo?:</strong> ${returnLabel(data.return_intent)}</p><p><strong>Comentario:</strong><br>${esc(data.improvement || 'No dejó comentarios.')}</p>`);
}

function csatView() {
  app.innerHTML = `${state.session ? header() : publicHeader()}<main class="page survey-wrap"><p class="eyebrow">Encuesta de satisfacción</p><h1>Tu opinión me ayuda a mejorar.</h1><p class="lead">Responder esta encuesta te tomará menos de un minuto.</p><form class="survey-card form" onsubmit="submitCsat(event)"><label class="field">Correo electrónico <small>Usa el correo con el que accedes al Portal Jorkcáceres o el que has utilizado para comunicarte conmigo.</small><input name="email" type="email" placeholder="nombre@empresa.com" autocomplete="email" required></label><fieldset class="survey-question"><legend>1. En general, ¿qué tan satisfecho estás con el trabajo realizado? *</legend><div class="scale">${[1,2,3,4,5].map(n => `<label><input type="radio" name="satisfaction" value="${n}" required><b>${n}</b>${['Muy insatisfecho','Insatisfecho','Neutral','Satisfecho','Muy satisfecho'][n - 1]}</label>`).join('')}</div></fieldset><fieldset class="survey-question"><legend>2. ¿El resultado cumplió con lo que esperabas? *</legend><div class="choice-list">${[['completamente','Sí, completamente'],['gran_parte','En gran parte'],['parcialmente','Parcialmente'],['no','No']].map(([v,l]) => `<label class="choice"><input type="radio" name="expectation" value="${v}" required> ${l}</label>`).join('')}</div></fieldset><fieldset class="survey-question"><legend>3. ¿Volverías a trabajar conmigo? *</legend><div class="choice-list">${[['si','Sí'],['tal_vez','Tal vez'],['no','No']].map(([v,l]) => `<label class="choice"><input type="radio" name="return" value="${v}" required> ${l}</label>`).join('')}</div></fieldset><label class="field survey-question">4. ¿Hay algo que debería mejorar? <small>Opcional</small><textarea name="improvement" placeholder="Comparte aquí cualquier comentario que consideres importante."></textarea></label><div id="csat-turnstile" class="turnstile-widget"></div>${btn('Enviar encuesta', '', 'primary', 'submit')}</form></main>${footer()}`;
  turnstileWidgets.delete('csat');
  mountTurnstile('csat-turnstile', 'csat');
}

const adminIcon = (type) => ({
  clients: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  projects: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
  payments: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
  services: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="8"/></svg>',
  surveys: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
}[type]);

const adminNav = (active) => `<nav class="admin-nav"><a class="${active === 'admin' ? 'active' : ''}" href="#admin">Panorama</a><a class="${active === 'clientes' ? 'active' : ''}" href="#admin-clientes">Clientes</a><a class="${active === 'proyectos' ? 'active' : ''}" href="#admin-proyectos">Proyectos</a><a class="${active === 'servicios' ? 'active' : ''}" href="#admin-servicios">Servicios</a><a class="${active === 'pagos' ? 'active' : ''}" href="#admin-pagos">Pagos</a><a class="${active === 'encuestas' ? 'active' : ''}" href="#admin-encuestas">Encuestas</a><a class="${active === 'portal' ? 'active' : ''}" href="#admin-portal">Portal</a></nav>`;

async function adminView() {
  loading('Panorama');
  try {
    const [settings, projectsResult, paymentsResult, servicesResult] = await Promise.all([
      loadPortalSettings(true),
      supabase.from('projects').select('id,status'),
      supabase.from('project_payments').select('id,status,amount'),
      supabase.from('client_services').select('id,active,amount,service_renewals(status,renewal_date)')
    ]);
    const error = [projectsResult, paymentsResult, servicesResult].find(result => result.error)?.error;
    if (error) return dataError('Panorama', error);

    const projects = projectsResult.data || [];
    const payments = paymentsResult.data || [];
    const services = servicesResult.data || [];
    const alertDays = Number(settings?.service_alert_days || 30);
    const projectCount = status => projects.filter(project => project.status === status).length;
    const pendingPayments = payments.filter(payment => payment.status === 'pendiente');
    const pendingAmount = pendingPayments.reduce((total, payment) => total + Number(payment.amount || 0), 0);
    const activeServices = services.filter(service => service.active !== false);
    const renewalItems = activeServices.flatMap(service => (service.service_renewals || [])
      .filter(renewal => renewal.status === 'programado')
      .map(renewal => ({ ...renewal, amount: service.amount })));
    const upcomingRenewals = renewalItems.filter(renewal => {
      const days = renewalRemainingDays(renewal.renewal_date);
      return days >= 0 && days <= alertDays;
    });
    const expiredRenewals = renewalItems.filter(renewal => renewalRemainingDays(renewal.renewal_date) < 0);
    const projectedRenewals = [...upcomingRenewals, ...expiredRenewals].reduce((total, renewal) => total + Number(renewal.amount || 0), 0);
    const confirmedPayments = payments.filter(payment => payment.status === 'confirmado').length
      + services.reduce((total, service) => total + (service.service_renewals || []).filter(renewal => renewal.status === 'renovado').length, 0);

    const attention = `<section class="section"><div class="section-heading"><div><p class="eyebrow">Atención</p><h2>Lo que requiere revisión</h2><p>Priorización basada en el estado actual del portal.</p></div></div><div class="admin-grid"><article class="admin-card"><div class="admin-card-top"><span class="admin-icon">${adminIcon('services')}</span><strong class="admin-count">${upcomingRenewals.length + expiredRenewals.length}</strong></div><h2>Renovaciones por atender</h2><p>${expiredRenewals.length ? `${expiredRenewals.length} vencida${expiredRenewals.length === 1 ? '' : 's'}` : 'Sin renovaciones vencidas'} · ${upcomingRenewals.length} próxima${upcomingRenewals.length === 1 ? '' : 's'} a vencer${projectedRenewals ? ` · ${money(projectedRenewals)} estimados` : ''}.</p>${btn('Ver servicios', "location.hash='#admin-servicios'", 'secondary')}</article><article class="admin-card"><div class="admin-card-top"><span class="admin-icon">${adminIcon('payments')}</span><strong class="admin-count">${pendingPayments.length}</strong></div><h2>Pagos pendientes</h2><p>${pendingPayments.length ? `${money(pendingAmount)} pendiente${pendingPayments.length === 1 ? '' : 's'} de confirmar.` : 'No hay pagos pendientes de confirmación.'}</p>${btn('Ver pagos', "location.hash='#admin-pagos'", 'secondary')}</article><article class="admin-card"><div class="admin-card-top"><span class="admin-icon">${adminIcon('projects')}</span><strong class="admin-count">${projectCount('pausado')}</strong></div><h2>Proyectos pausados</h2><p>${projectCount('pausado') ? 'Revisa si requieren una decisión o una nueva fecha de trabajo.' : 'No hay proyectos pausados.'}</p>${btn('Ver proyectos', "location.hash='#admin-proyectos'", 'secondary')}</article></div></section>`;
    const projectsSummary = `<section class="section"><div class="section-heading"><div><p class="eyebrow">Proyectos</p><h2>Estado general</h2></div>${btn('Gestionar proyectos', "location.hash='#admin-proyectos'", 'small secondary')}</div><div class="metric-grid"><article class="metric-card"><span>Planificados</span><strong>${projectCount('planificado')}</strong></article><article class="metric-card"><span>En curso</span><strong>${projectCount('en_curso')}</strong></article><article class="metric-card"><span>Pausados</span><strong>${projectCount('pausado')}</strong></article><article class="metric-card"><span>Finalizados</span><strong>${projectCount('finalizado')}</strong></article></div></section>`;
    const servicesSummary = `<section class="section"><div class="section-heading"><div><p class="eyebrow">Servicios</p><h2>Renovaciones y continuidad</h2></div>${btn('Gestionar servicios', "location.hash='#admin-servicios'", 'small secondary')}</div><div class="metric-grid"><article class="metric-card"><span>Activos</span><strong>${activeServices.length}</strong></article><article class="metric-card"><span>Inactivos</span><strong>${services.length - activeServices.length}</strong></article><article class="metric-card"><span>Próximos a vencer</span><strong>${upcomingRenewals.length}</strong></article><article class="metric-card"><span>Vencidos</span><strong>${expiredRenewals.length}</strong></article></div></section>`;
    const paymentsSummary = `<section class="section"><div class="section-heading"><div><p class="eyebrow">Pagos</p><h2>Cobros y confirmaciones</h2></div>${btn('Gestionar pagos', "location.hash='#admin-pagos'", 'small secondary')}</div><div class="metric-grid"><article class="metric-card"><span>Pendientes</span><strong>${pendingPayments.length}</strong></article><article class="metric-card"><span>Valor pendiente</span><strong>${money(pendingAmount)}</strong></article><article class="metric-card"><span>Confirmados</span><strong>${confirmedPayments}</strong></article></div></section>`;
    app.innerHTML = `${header()}<main class="page admin-page"><p class="eyebrow">Administración</p><h1>Panorama.</h1><p class="lead">Una visión general para identificar qué requiere atención y tomar decisiones.</p>${adminNav('admin')}${attention}${projectsSummary}${servicesSummary}${paymentsSummary}</main>${footer()}`;
  } catch (error) { dataError('Panorama', error); }
}

function adminModuleShell(section, title, description, body) {
  app.innerHTML = `${header()}<main class="page admin-page">${breadcrumbs([{ label: 'Administración', href: '#admin' }, { label: title }])}<h1>${title}</h1><p class="lead">${description}</p>${adminNav(section)}${body}</main>${footer()}`;
}

async function adminClientsView() {
  loading('Clientes');
  const pageSize = 10;
  const from = (state.clientPage - 1) * pageSize;
  const { data, error, count } = await supabase.from('clients').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + pageSize - 1);
  if (error) return dataError('Clientes', error);
  state.clients = new Map(data.map(client => [client.id, client]));
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  if (state.clientPage > totalPages) { state.clientPage = totalPages; return adminClientsView(); }
  const list = data.length ? `<section class="admin-list">${data.map(clientCard).join('')}</section>${pagination(totalPages)}` : '<div class="empty">Aún no hay clientes registrados.</div>';
  const body = `<div class="admin-module-actions">${btn('Crear cliente', 'showClientForm()', 'primary')}</div>${list}`;
  adminModuleShell('clientes', 'Clientes', 'Consulta los contactos y clientes con información registrada en el portal.', body);
}

function clientCard(client) {
  const hasAccess = client.portal_access === true;
  const isActive = client.status !== 'inactivo';
  const accessLabel = hasAccess ? (isActive ? 'Con acceso al portal' : 'Acceso inactivo') : 'Contacto';
  const accessAction = hasAccess
    ? (isActive ? btn('Inactivar usuario', `confirmClientAction('${client.id}', 'deactivate_access')`, 'small secondary') : btn('Reactivar usuario', `confirmClientAction('${client.id}', 'reactivate_access')`, 'small'))
    : btn('Conceder acceso', `confirmClientAction('${client.id}', 'grant_access')`, 'small');
  const passwordAction = hasAccess ? btn('Restablecer contraseña', `confirmClientAction('${client.id}', 'reset_password')`, 'small secondary') : '';
  return `<article class="admin-list-card client-list-card"><div><p class="eyebrow">${accessLabel}</p><h2>${esc(`${client.first_name} ${client.last_name}`)}</h2><p>${esc(client.company_name || 'Sin empresa registrada')} · ${esc(client.email)}${client.phone ? ` · ${esc(client.phone)}` : ''}</p><div class="client-actions">${btn('Modificar datos', `showClientEditForm('${client.id}')`, 'small secondary')}${accessAction}${passwordAction}</div></div><span class="status ${isActive ? '' : 'progress'}">${isActive ? 'Activo' : 'Inactivo'}</span></article>`;
}

function pagination(totalPages) {
  if (totalPages <= 1) return '';
  return `<nav class="pagination" aria-label="Paginación de clientes"><button class="button small secondary" onclick="changeClientPage(${state.clientPage - 1})" ${state.clientPage === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${state.clientPage} de ${totalPages}</span><button class="button small secondary" onclick="changeClientPage(${state.clientPage + 1})" ${state.clientPage === totalPages ? 'disabled' : ''}>Siguiente</button></nav>`;
}

function changeClientPage(page) {
  state.clientPage = Math.max(1, page);
  adminClientsView();
}

function showClientForm() {
  modal('Crear cliente', `<p class="modal-lead">Registra la información de contacto y decide si esta persona tendrá acceso al portal.</p><form class="form client-form" onsubmit="createPortalClient(event)"><div class="form-columns"><label class="field">Nombre<input name="first_name" autocomplete="given-name" required></label><label class="field">Apellido<input name="last_name" autocomplete="family-name" required></label></div><label class="field">Correo electrónico<input name="email" type="email" autocomplete="email" required></label><label class="field">Teléfono<input name="phone" type="tel" autocomplete="tel"></label><label class="field">Empresa<input name="company_name" autocomplete="organization"></label><label class="access-choice"><input id="client-portal-access" type="checkbox" name="portal_access" onchange="togglePortalAccess(this.checked)"><span><strong>Dar acceso al portal</strong><small id="portal-access-help">Se registrará como contacto; no podrá iniciar sesión.</small></span></label><div class="modal-actions"><button type="button" class="button secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>${btn('Crear cliente', '', 'primary', 'submit')}</div></form>`, false);
}

function togglePortalAccess(enabled) {
  const help = document.querySelector('#portal-access-help');
  if (help) help.textContent = enabled ? 'Se generará una contraseña temporal única para compartirla con el cliente.' : 'Se registrará como contacto; no podrá iniciar sesión.';
}

async function adminPortalView() {
  loading('Portal');
  const [loadedSettings, services, paymentTypes, recurrences] = await Promise.all([loadPortalSettings(true), loadPortalServices(true), loadPortalPaymentTypes(true), loadServiceRecurrences(true)]);
  const settings = loadedSettings || {};
  const desktopPreview = settings.hero_desktop_url ? `<img class="portal-image-preview" src="${esc(settings.hero_desktop_url)}" alt="Vista previa para escritorio">` : '<div class="image-empty">Aún no hay imagen de escritorio.</div>';
  const mobilePreview = settings.hero_mobile_url ? `<img class="portal-image-preview" src="${esc(settings.hero_mobile_url)}" alt="Vista previa para móvil">` : '<div class="image-empty">Aún no hay imagen móvil.</div>';
  const serviceList = services.length ? `<div class="service-list">${services.map(service => `<article class="service-item"><div><strong>${esc(service.name)}</strong><span class="status ${service.active ? '' : 'progress'}">${service.active ? 'Activo' : 'Inactivo'}</span></div>${btn(service.active ? 'Inactivar' : 'Activar', `setPortalServiceStatus('${service.id}', ${!service.active})`, 'small secondary')}</article>`).join('')}</div>` : '<div class="empty">Aún no hay servicios configurados.</div>';
  const paymentTypeList = paymentTypes.length ? `<div class="service-list">${paymentTypes.map(type => `<article class="service-item"><div><strong>${esc(type.name)}</strong><span class="status ${type.active ? '' : 'progress'}">${type.active ? 'Activo' : 'Inactivo'}</span></div>${btn(type.active ? 'Inactivar' : 'Activar', `setPortalPaymentTypeStatus('${type.id}', ${!type.active})`, 'small secondary')}</article>`).join('')}</div>` : '<div class="empty">Aún no hay tipos de pago configurados.</div>';
  const recurrenceList = recurrences.length ? `<div class="service-list">${recurrences.map(recurrence => `<article class="service-item"><div><strong>${esc(recurrence.name)}</strong><small>Cada ${recurrence.interval_value} ${recurrence.interval_unit}</small><span class="status ${recurrence.active ? '' : 'progress'}">${recurrence.active ? 'Activa' : 'Inactiva'}</span></div>${btn(recurrence.active ? 'Inactivar' : 'Activar', `setServiceRecurrenceStatus('${recurrence.id}', ${!recurrence.active})`, 'small secondary')}</article>`).join('')}</div>` : '<div class="empty">Aún no hay recurrencias configuradas.</div>';
  const body = `<div class="settings-accordions"><details class="settings-card"><summary><span><strong>Imagen principal</strong><small>Personaliza la imagen de bienvenida del portal.</small></span></summary><div class="accordion-content"><form class="form portal-settings-form" onsubmit="savePortalAppearance(event)"><div class="image-settings-grid"><label class="field">Imagen escritorio <small>Proporción recomendada: 4:5 vertical (por ejemplo, 1600 × 2000 px) · JPG, PNG o WebP.</small><input name="hero_desktop" type="file" accept="image/jpeg,image/png,image/webp">${desktopPreview}</label><label class="field">Imagen móvil <small>Proporción recomendada: 4:5 vertical (por ejemplo, 1080 × 1350 px) · JPG, PNG o WebP.</small><input name="hero_mobile" type="file" accept="image/jpeg,image/png,image/webp">${mobilePreview}</label></div>${btn('Guardar imagen', '', 'primary', 'submit')}</form></div></details><details class="settings-card"><summary><span><strong>Servicios disponibles</strong><small>Define los servicios que podrás asociar a los proyectos.</small></span></summary><div class="accordion-content"><form class="service-form" onsubmit="addPortalService(event)"><label class="field">Nuevo servicio<input name="service_name" placeholder="Nombre del servicio" required></label>${btn('Agregar servicio', '', 'primary', 'submit')}</form>${serviceList}</div></details><details class="settings-card"><summary><span><strong>Tipos de pago</strong><small>Define los tipos de pago que podrás registrar en los proyectos.</small></span></summary><div class="accordion-content"><form class="service-form" onsubmit="addPortalPaymentType(event)"><label class="field">Nuevo tipo de pago<input name="payment_type_name" placeholder="Por ejemplo: Pago mensual" required></label>${btn('Agregar tipo', '', 'primary', 'submit')}</form>${paymentTypeList}</div></details><details class="settings-card"><summary><span><strong>Recurrencias de servicios</strong><small>Administra cómo se programa cada renovación.</small></span></summary><div class="accordion-content"><form class="service-form" onsubmit="addServiceRecurrence(event)"><label class="field">Nombre de la recurrencia<input name="recurrence_name" placeholder="Por ejemplo: Trimestral" required></label><div class="form-columns"><label class="field">Cada<input name="interval_value" type="number" min="1" max="120" value="1" required></label><label class="field">Unidad<select name="interval_unit" required><option value="meses">Meses</option><option value="anios">Años</option><option value="dias">Días</option></select></label></div>${btn('Agregar recurrencia', '', 'primary', 'submit')}</form>${recurrenceList}</div></details><details class="settings-card"><summary><span><strong>Alertas de renovación</strong><small>Define con cuánta anticipación el cliente verá la alerta.</small></span></summary><div class="accordion-content"><form class="service-form" onsubmit="saveServiceAlertSettings(event)"><label class="field">Días de anticipación<input name="service_alert_days" type="number" min="1" max="365" value="${esc(settings.service_alert_days || 30)}" required></label>${btn('Guardar alerta', '', 'primary', 'submit')}</form></div></details></div>`;
  adminModuleShell('portal', 'Personalizar portal', 'Administra la imagen principal que ven los clientes al ingresar.', body);
}

async function loadPortalServices(force = false) {
  if (state.services.length && !force) return state.services;
  const { data, error } = await supabase.from('portal_services').select('id,name,active').order('name', { ascending: true });
  if (error) throw error;
  state.services = data || [];
  return state.services;
}

async function addPortalService(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = String(form.get('service_name') || '').trim();
  const submit = event.target.querySelector('[type="submit"]');
  if (!name) return;
  submit.disabled = true; submit.textContent = 'Agregando…';
  try {
    const { error } = await supabase.from('portal_services').insert({ name });
    if (error) throw error;
    state.services = [];
    await adminPortalView();
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Agregar servicio';
    modal('No fue posible agregar el servicio', `<p>${esc(error.code === '23505' ? 'Ese servicio ya está registrado.' : errorText(error))}</p>`);
  }
}

async function setPortalServiceStatus(id, active) {
  const { error } = await supabase.from('portal_services').update({ active }).eq('id', id);
  if (error) return modal('No fue posible actualizar el servicio', `<p>${esc(errorText(error))}</p>`);
  state.services = [];
  await adminPortalView();
}

async function loadPortalPaymentTypes(force = false) {
  if (state.paymentTypes.length && !force) return state.paymentTypes;
  const { data, error } = await supabase.from('portal_payment_types').select('id,code,name,active').order('name', { ascending: true });
  if (error) throw error;
  state.paymentTypes = data || [];
  return state.paymentTypes;
}

function paymentTypeCode(name) {
  return String(name).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function addPortalPaymentType(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = String(form.get('payment_type_name') || '').trim();
  const code = paymentTypeCode(name);
  const submit = event.target.querySelector('[type="submit"]');
  if (!name || !code) return;
  submit.disabled = true; submit.textContent = 'Agregando…';
  try {
    const { error } = await supabase.from('portal_payment_types').insert({ code, name });
    if (error) throw error;
    state.paymentTypes = [];
    await adminPortalView();
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Agregar tipo';
    modal('No fue posible agregar el tipo de pago', `<p>${esc(error.code === '23505' ? 'Ese tipo de pago ya está registrado.' : errorText(error))}</p>`);
  }
}

async function setPortalPaymentTypeStatus(id, active) {
  const { error } = await supabase.from('portal_payment_types').update({ active }).eq('id', id);
  if (error) return modal('No fue posible actualizar el tipo de pago', `<p>${esc(errorText(error))}</p>`);
  state.paymentTypes = [];
  await adminPortalView();
}

async function addServiceRecurrence(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const name = String(form.get('recurrence_name') || '').trim();
  const intervalValue = Number(form.get('interval_value'));
  const intervalUnit = String(form.get('interval_unit') || '');
  const submit = event.target.querySelector('[type="submit"]');
  if (!name || !Number.isInteger(intervalValue) || intervalValue < 1 || intervalValue > 120 || !['dias', 'meses', 'anios'].includes(intervalUnit)) return;
  submit.disabled = true; submit.textContent = 'Agregando…';
  try {
    const { error } = await supabase.from('portal_service_recurrences').insert({ name, interval_value: intervalValue, interval_unit: intervalUnit });
    if (error) throw error;
    state.recurrences = [];
    await adminPortalView();
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Agregar recurrencia';
    modal('No fue posible agregar la recurrencia', `<p>${esc(error.code === '23505' ? 'Esa recurrencia ya está registrada.' : errorText(error))}</p>`);
  }
}

async function setServiceRecurrenceStatus(id, active) {
  const { error } = await supabase.from('portal_service_recurrences').update({ active }).eq('id', id);
  if (error) return modal('No fue posible actualizar la recurrencia', `<p>${esc(errorText(error))}</p>`);
  state.recurrences = [];
  await adminPortalView();
}

async function saveServiceAlertSettings(event) {
  event.preventDefault();
  const days = Number(new FormData(event.target).get('service_alert_days'));
  if (!Number.isInteger(days) || days < 1 || days > 365) return modal('Valor no válido', '<p>Indica entre 1 y 365 días de anticipación.</p>');
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Guardando…';
  try {
    const { error } = await supabase.from('portal_settings').upsert({ id: 'principal', service_alert_days: days }, { onConflict: 'id' });
    if (error) throw error;
    state.portalSettings = { ...(state.portalSettings || {}), service_alert_days: days };
    modal('Alertas actualizadas', `<p>Los clientes verán alertas de renovación ${days} días antes de la fecha programada.</p>`);
  } catch (error) { modal('No fue posible guardar la alerta', `<p>${esc(errorText(error))}</p>`); }
  finally { submit.disabled = false; submit.textContent = 'Guardar alerta'; }
}

async function uploadPortalImage(file, variant) {
  if (!file) return null;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Usa una imagen JPG, PNG o WebP.');
  if (file.size > 5 * 1024 * 1024) throw new Error('Cada imagen debe pesar máximo 5 MB.');
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `hero/${variant}-${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from('portal-assets').upload(path, file, { cacheControl: '3600', contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  return supabase.storage.from('portal-assets').getPublicUrl(path).data.publicUrl;
}

async function savePortalAppearance(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const desktopFile = form.get('hero_desktop');
  const mobileFile = form.get('hero_mobile');
  const hasDesktopFile = desktopFile instanceof File && desktopFile.size > 0;
  const hasMobileFile = mobileFile instanceof File && mobileFile.size > 0;
  if (!hasDesktopFile && !hasMobileFile) return modal('Selecciona una imagen', '<p>Elige al menos una imagen para actualizar la portada.</p>');
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Guardando…';
  try {
    const desktopUrl = hasDesktopFile ? await uploadPortalImage(desktopFile, 'desktop') : state.portalSettings?.hero_desktop_url || null;
    const mobileUrl = hasMobileFile ? await uploadPortalImage(mobileFile, 'mobile') : state.portalSettings?.hero_mobile_url || desktopUrl;
    const { error } = await supabase.from('portal_settings').upsert({ id: 'principal', hero_desktop_url: desktopUrl, hero_mobile_url: mobileUrl }, { onConflict: 'id' });
    if (error) throw error;
    state.portalSettings = { ...(state.portalSettings || {}), hero_desktop_url: desktopUrl, hero_mobile_url: mobileUrl };
    modal('Imagen actualizada', '<p>La nueva imagen quedará disponible para los clientes al ingresar al portal.</p>');
  } catch (error) {
    modal('No fue posible guardar la imagen', `<p>${esc(errorText(error))}</p>`);
  } finally {
    submit.disabled = false; submit.textContent = 'Guardar imagen';
  }
}

function showClientEditForm(id) {
  const client = state.clients.get(id);
  if (!client) return modal('No fue posible abrir el cliente', '<p>Actualiza la vista e inténtalo nuevamente.</p>');
  modal('Modificar datos', `<p class="modal-lead">Actualiza la información de contacto. Si cambias el correo de una cuenta con acceso, también se actualizará para iniciar sesión.</p><form class="form client-form" onsubmit="updatePortalClient(event, '${client.id}')"><div class="form-columns"><label class="field">Nombre<input name="first_name" value="${esc(client.first_name)}" autocomplete="given-name" required></label><label class="field">Apellido<input name="last_name" value="${esc(client.last_name)}" autocomplete="family-name" required></label></div><label class="field">Correo electrónico<input name="email" type="email" value="${esc(client.email)}" autocomplete="email" required></label><label class="field">Teléfono<input name="phone" type="tel" value="${esc(client.phone || '')}" autocomplete="tel"></label><label class="field">Empresa<input name="company_name" value="${esc(client.company_name || '')}" autocomplete="organization"></label><div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Guardar cambios', '', 'primary', 'submit')}</div></form>`, false);
}

function confirmClientAction(id, action) {
  const client = state.clients.get(id);
  if (!client) return modal('No fue posible abrir el cliente', '<p>Actualiza la vista e inténtalo nuevamente.</p>');
  const labels = {
    grant_access: ['Conceder acceso', 'Se creará una contraseña temporal para que puedas compartirla con el cliente.'],
    reset_password: ['Restablecer contraseña', 'Se reemplazará la contraseña actual por una temporal nueva.'],
    deactivate_access: ['Inactivar usuario', 'El cliente no podrá volver a iniciar sesión hasta que reactives su acceso.'],
    reactivate_access: ['Reactivar usuario', 'El cliente podrá volver a ingresar con su contraseña actual.'],
  };
  const [title, message] = labels[action];
  modal(title, `<p>${message}</p><div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn(title, `runClientAction('${id}', '${action}')`, 'primary')}</div>`, false);
}

async function adminProjectsView() {
  loading('Proyectos');
  const pageSize = 10;
  const from = (state.projectPage - 1) * pageSize;
  const { data, error, count } = await supabase.from('projects').select('*, clients(first_name,last_name,company_name)', { count: 'exact' }).order('project_date', { ascending: false }).range(from, from + pageSize - 1);
  if (error) return dataError('Proyectos', error);
  state.projects = new Map(data.map(project => [project.id, project]));
  const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
  if (state.projectPage > totalPages) { state.projectPage = totalPages; return adminProjectsView(); }
  const list = data.length ? `<section class="admin-list">${data.map(projectCard).join('')}</section>${projectPagination(totalPages)}` : '<div class="empty">Aún no hay proyectos registrados.</div>';
  const body = `<div class="admin-module-actions">${btn('Crear proyecto', 'showProjectForm()', 'primary')}</div>${list}`;
  adminModuleShell('proyectos', 'Proyectos', 'Revisa los servicios en curso y el historial de proyectos registrados.', body);
}

function projectCard(project) {
  const clientName = project.clients ? `${project.clients.first_name} ${project.clients.last_name}` : 'Cliente no disponible';
  const dates = project.end_date ? `${date(project.start_date || project.project_date)} · Finaliza ${date(project.end_date)}` : date(project.start_date || project.project_date);
  return `<article class="admin-list-card"><div><p class="eyebrow">${esc(project.code)}</p><h2>${esc(project.title)}</h2><p>${esc(clientName)} · ${esc(project.service)} · ${dates}</p><div class="client-actions">${btn('Modificar proyecto', `showProjectEditForm('${project.id}')`, 'small secondary')}</div></div><span class="status ${project.status === 'en_curso' ? 'progress' : ''}">${status(project.status)}</span></article>`;
}

function projectPagination(totalPages) {
  if (totalPages <= 1) return '';
  return `<nav class="pagination" aria-label="Paginación de proyectos"><button class="button small secondary" onclick="changeProjectPage(${state.projectPage - 1})" ${state.projectPage === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${state.projectPage} de ${totalPages}</span><button class="button small secondary" onclick="changeProjectPage(${state.projectPage + 1})" ${state.projectPage === totalPages ? 'disabled' : ''}>Siguiente</button></nav>`;
}

function changeProjectPage(page) {
  state.projectPage = Math.max(1, page);
  adminProjectsView();
}

async function projectClientOptions(selectedId = '') {
  const { data, error } = await supabase.from('clients').select('id,first_name,last_name,company_name').order('first_name', { ascending: true });
  if (error) throw error;
  if (!data.length) throw new Error('Primero registra al menos un cliente para asociar el proyecto.');
  return data.map(client => `<option value="${client.id}" ${client.id === selectedId ? 'selected' : ''}>${esc(`${client.first_name} ${client.last_name}${client.company_name ? ` · ${client.company_name}` : ''}`)}</option>`).join('');
}

async function projectServiceOptions(selectedName = '') {
  const services = await loadPortalServices(true);
  const available = services.filter(service => service.active || service.name === selectedName);
  if (!available.length) throw new Error('Primero configura al menos un servicio activo en Administración → Portal.');
  return available.map(service => `<option value="${esc(service.name)}" ${service.name === selectedName ? 'selected' : ''}>${esc(service.name)}${service.active ? '' : ' (inactivo)'}</option>`).join('');
}

async function showProjectForm() {
  try {
    const [clients, services] = await Promise.all([projectClientOptions(), projectServiceOptions()]);
    modal('Crear proyecto', `<p class="modal-lead">Registra el proyecto y relaciónalo con el cliente correspondiente.</p><form class="form client-form" onsubmit="createPortalProject(event)"><label class="field">Cliente<select name="client_id" required><option value="">Selecciona un cliente</option>${clients}</select></label><div class="form-columns"><div class="field"><span>Código</span><div class="readonly-field">Se asignará automáticamente al crear el proyecto.</div></div><label class="field">Estado<select name="status" required><option value="planificado">Planificado</option><option value="en_curso">En curso</option><option value="pausado">Pausado</option><option value="finalizado">Finalizado</option></select></label></div><label class="field">Título del proyecto<input name="title" required></label><label class="field">Servicio<select name="service" required><option value="">Selecciona un servicio</option>${services}</select></label><div class="form-columns"><label class="field">Fecha de inicio<input name="start_date" type="date" required></label><label class="field">Fecha de finalización<input name="end_date" type="date"></label></div><label class="field">Carpeta compartida<input name="shared_folder_url" type="url" placeholder="https://..."></label><label class="field">Observaciones<textarea name="observations" placeholder="Información relevante para el cliente."></textarea></label><div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Crear proyecto', '', 'primary', 'submit')}</div></form>`, false);
  } catch (error) { modal('No fue posible abrir el formulario', `<p>${esc(errorText(error))}</p>`); }
}

async function showProjectEditForm(id) {
  const project = state.projects.get(id);
  if (!project) return modal('No fue posible abrir el proyecto', '<p>Actualiza la vista e inténtalo nuevamente.</p>');
  try {
    const [clients, services] = await Promise.all([projectClientOptions(project.client_id), projectServiceOptions(project.service)]);
    const startDate = project.start_date || project.project_date || '';
    modal('Modificar proyecto', `<p class="modal-lead">Actualiza la información del proyecto. Los cambios se reflejarán en la vista del cliente.</p><form class="form client-form" onsubmit="updatePortalProject(event, '${project.id}')"><label class="field">Cliente<select name="client_id" required>${clients}</select></label><div class="form-columns"><div class="field"><span>Código</span><div class="readonly-field">${esc(project.code)}</div></div><label class="field">Estado<select name="status" required><option value="planificado" ${project.status === 'planificado' ? 'selected' : ''}>Planificado</option><option value="en_curso" ${project.status === 'en_curso' ? 'selected' : ''}>En curso</option><option value="pausado" ${project.status === 'pausado' ? 'selected' : ''}>Pausado</option><option value="finalizado" ${project.status === 'finalizado' ? 'selected' : ''}>Finalizado</option></select></label></div><label class="field">Título del proyecto<input name="title" value="${esc(project.title)}" required></label><label class="field">Servicio<select name="service" required>${services}</select></label><div class="form-columns"><label class="field">Fecha de inicio<input name="start_date" type="date" value="${esc(startDate)}" required></label><label class="field">Fecha de finalización<input name="end_date" type="date" value="${esc(project.end_date || '')}"></label></div><label class="field">Carpeta compartida<input name="shared_folder_url" type="url" value="${esc(project.shared_folder_url || '')}"></label><label class="field">Observaciones<textarea name="observations">${esc(project.observations || '')}</textarea></label><div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Guardar cambios', '', 'primary', 'submit')}</div></form>`, false);
  } catch (error) { modal('No fue posible abrir el formulario', `<p>${esc(errorText(error))}</p>`); }
}

async function adminServicesView() {
  loading('Servicios');
  try {
    const [settings, recurrences] = await Promise.all([loadPortalSettings(true), loadServiceRecurrences(true)]);
    const pageSize = 10;
    const from = (state.servicePage - 1) * pageSize;
    const { data, error, count } = await supabase.from('client_services').select('*, clients(first_name,last_name,company_name), portal_service_recurrences(name), service_renewals(id,renewal_date,status,receipt_path,renewed_at)', { count: 'exact' }).order('created_at', { ascending: false }).range(from, from + pageSize - 1);
    if (error) return dataError('Servicios', error);
    state.clientServices = new Map(data.map(service => [service.id, service]));
    const totalPages = Math.max(1, Math.ceil((count || 0) / pageSize));
    if (state.servicePage > totalPages) { state.servicePage = totalPages; return adminServicesView(); }
    const alertDays = Number(settings?.service_alert_days || 30);
    const list = data.length ? `<section class="admin-list">${data.map(service => adminServiceCard(service, alertDays)).join('')}</section>${servicePagination(totalPages)}` : '<div class="empty">Aún no hay servicios registrados.</div>';
    const body = `<div class="admin-module-actions">${btn('Crear servicio', 'showServiceForm()', 'primary')}</div>${list}`;
    adminModuleShell('servicios', 'Servicios', 'Gestiona renovaciones recurrentes, estados y comprobantes de cada cliente.', body);
  } catch (error) { dataError('Servicios', error); }
}

function adminServiceCard(service, alertDays) {
  const renewal = openRenewal(service);
  const clientName = service.clients ? `${service.clients.first_name} ${service.clients.last_name}${service.clients.company_name ? ` · ${service.clients.company_name}` : ''}` : 'Cliente no disponible';
  const active = service.active !== false;
  const renewalText = renewal ? `${date(renewal.renewal_date)} · ${renewalStatus(renewal, alertDays)}` : 'Sin renovación programada';
  const detailText = active
    ? `${esc(clientName)} · ${service.amount === null ? 'Valor por definir' : money(service.amount)} · ${renewalText}`
    : `${esc(clientName)} · Servicio inactivo. No tiene renovaciones ni cobros futuros programados.`;
  return `<article class="admin-list-card"><div><p class="eyebrow">${esc(service.portal_service_recurrences?.name || 'Sin recurrencia')}</p><h2>${esc(service.name)}</h2><p>${detailText}</p><div class="client-actions">${btn('Modificar servicio', `showServiceEditForm('${service.id}')`, 'small secondary')}${renewal && active ? btn('Confirmar renovación', `showRenewServiceForm('${renewal.id}')`, 'small') : ''}${btn(active ? 'Inactivar servicio' : 'Reactivar servicio', `setClientServiceActive('${service.id}', ${!active})`, 'small secondary')}</div></div><span class="status ${active ? (renewal ? renewalStatusClass(renewal, alertDays) : 'progress') : 'progress'}">${active ? (renewal ? renewalStatus(renewal, alertDays) : 'Sin programar') : 'Inactivo'}</span></article>`;
}

function servicePagination(totalPages) {
  if (totalPages <= 1) return '';
  return `<nav class="pagination" aria-label="Paginación de servicios"><button class="button small secondary" onclick="changeServicePage(${state.servicePage - 1})" ${state.servicePage === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${state.servicePage} de ${totalPages}</span><button class="button small secondary" onclick="changeServicePage(${state.servicePage + 1})" ${state.servicePage === totalPages ? 'disabled' : ''}>Siguiente</button></nav>`;
}

function changeServicePage(page) { state.servicePage = Math.max(1, page); adminServicesView(); }

async function loadServiceRecurrences(force = false) {
  if (state.recurrences.length && !force) return state.recurrences;
  const { data, error } = await supabase.from('portal_service_recurrences').select('id,name,interval_value,interval_unit,active').order('name', { ascending: true });
  if (error) throw error;
  state.recurrences = data || [];
  return state.recurrences;
}

async function serviceClientOptions(selectedId = '') {
  const { data, error } = await supabase.from('clients').select('id,first_name,last_name,company_name').order('first_name', { ascending: true });
  if (error) throw error;
  if (!data.length) throw new Error('Primero registra al menos un cliente para asociar el servicio.');
  return data.map(client => `<option value="${client.id}" ${client.id === selectedId ? 'selected' : ''}>${esc(`${client.first_name} ${client.last_name}${client.company_name ? ` · ${client.company_name}` : ''}`)}</option>`).join('');
}

async function serviceRecurrenceOptions(selectedId = '') {
  const recurrences = await loadServiceRecurrences(true);
  const available = recurrences.filter(recurrence => recurrence.active || recurrence.id === selectedId);
  if (!available.length) throw new Error('Primero configura al menos una recurrencia activa en Administración → Portal.');
  return available.map(recurrence => `<option value="${recurrence.id}" ${recurrence.id === selectedId ? 'selected' : ''}>${esc(recurrence.name)}${recurrence.active ? '' : ' (inactiva)'}</option>`).join('');
}

function serviceFields(service = {}) {
  const renewal = openRenewal(service);
  return `<label class="field">Cliente<select name="client_id" required data-service-client-options></select></label><label class="field">Servicio<input name="name" value="${esc(service.name || '')}" placeholder="Por ejemplo: Hosting, Dominio o SSL" required></label><div class="form-columns"><label class="field">Recurrencia<select name="recurrence_id" required data-service-recurrence-options></select></label><label class="field">Valor de renovación (COP)<input name="amount" type="number" min="0" step="1" value="${esc(service.amount ?? '')}" placeholder="Opcional"></label></div><label class="field">Fecha de renovación<input name="renewal_date" type="date" value="${esc(renewal?.renewal_date || '')}" required></label><label class="field">Observaciones<textarea name="observations" placeholder="Información relevante para el cliente.">${esc(service.observations || '')}</textarea></label>`;
}

async function showServiceForm() {
  try {
    const [clients, recurrences] = await Promise.all([serviceClientOptions(), serviceRecurrenceOptions()]);
    modal('Crear servicio', `<p class="modal-lead">Registra un servicio activo y programa su primera renovación.</p><form class="form client-form" onsubmit="createClientService(event)">${serviceFields()}<div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Crear servicio', '', 'primary', 'submit')}</div></form>`, false);
    document.querySelector('[data-service-client-options]').innerHTML = `<option value="">Selecciona un cliente</option>${clients}`;
    document.querySelector('[data-service-recurrence-options]').innerHTML = `<option value="">Selecciona una recurrencia</option>${recurrences}`;
  } catch (error) { modal('No fue posible abrir el formulario', `<p>${esc(errorText(error))}</p>`); }
}

async function showServiceEditForm(id) {
  const service = state.clientServices.get(id);
  if (!service) return modal('No fue posible abrir el servicio', '<p>Actualiza la vista e inténtalo nuevamente.</p>');
  try {
    const [clients, recurrences] = await Promise.all([serviceClientOptions(service.client_id), serviceRecurrenceOptions(service.recurrence_id)]);
    modal('Modificar servicio', `<p class="modal-lead">Actualiza el servicio y su próxima fecha de renovación.</p><form class="form client-form" onsubmit="updateClientService(event, '${service.id}')">${serviceFields(service)}<div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Guardar cambios', '', 'primary', 'submit')}</div></form>`, false);
    document.querySelector('[data-service-client-options]').innerHTML = clients;
    document.querySelector('[data-service-recurrence-options]').innerHTML = recurrences;
  } catch (error) { modal('No fue posible abrir el formulario', `<p>${esc(errorText(error))}</p>`); }
}

function showRenewServiceForm(renewalId) {
  modal('Confirmar renovación', `<p class="modal-lead">Adjunta el comprobante PNG. Al confirmar, el sistema conservará esta renovación y programará automáticamente la siguiente.</p><form class="form client-form" onsubmit="renewClientService(event, '${renewalId}')"><label class="field">Comprobante PNG <small>Obligatorio · máximo 5 MB.</small><input name="receipt" type="file" accept="image/png" required></label><div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Confirmar renovación', '', 'primary', 'submit')}</div></form>`, false);
}

async function adminPaymentsView() {
  loading('Pagos');
  try { await loadPortalPaymentTypes(true); } catch (error) { return dataError('Pagos', error); }
  const pageSize = 10;
  const [projectResult, serviceResult] = await Promise.all([
    supabase.from('project_payments').select('*, projects(code,title,clients(first_name,last_name))').order('payment_date', { ascending: false }),
    supabase.from('service_renewals').select('*, client_services(name,amount,clients(first_name,last_name))').order('renewed_at', { ascending: false })
  ]);
  if (projectResult.error || serviceResult.error) return dataError('Pagos', projectResult.error || serviceResult.error);
  const projectPayments = (projectResult.data || []).map(payment => ({ ...payment, source: 'project', sort_date: payment.payment_date || payment.created_at }));
  const servicePayments = (serviceResult.data || []).filter(renewal => renewal.status === 'renovado').map(renewal => ({ ...renewal, source: 'service', sort_date: renewal.renewed_at || renewal.created_at }));
  const allPayments = [...projectPayments, ...servicePayments].sort((a, b) => String(b.sort_date).localeCompare(String(a.sort_date)));
  const totalPages = Math.max(1, Math.ceil(allPayments.length / pageSize));
  if (state.paymentPage > totalPages) { state.paymentPage = totalPages; return adminPaymentsView(); }
  const from = (state.paymentPage - 1) * pageSize;
  const data = allPayments.slice(from, from + pageSize);
  state.payments = new Map(projectPayments.map(payment => [payment.id, payment]));
  const list = data.length ? `<section class="admin-list">${data.map(paymentCard).join('')}</section>${paymentPagination(totalPages)}` : '<div class="empty">Aún no hay pagos registrados.</div>';
  const body = `<div class="admin-module-actions">${btn('Registrar pago', 'showPaymentForm()', 'primary')}</div>${list}`;
  adminModuleShell('pagos', 'Pagos', 'Consulta pagos de proyectos y renovaciones de servicios en un mismo lugar.', body);
}

function paymentCard(payment) {
  if (payment.source === 'service') {
    const clientName = payment.client_services?.clients ? `${payment.client_services.clients.first_name} ${payment.client_services.clients.last_name}` : 'Cliente no disponible';
    return `<article class="admin-list-card"><div><p class="eyebrow">Renovación de servicio</p><h2>${esc(payment.client_services?.name || 'Servicio no disponible')}</h2><p>${esc(clientName)} · ${payment.client_services?.amount === null ? 'Valor por definir' : money(payment.client_services?.amount)} · Renovado el ${date(payment.renewed_at)}</p><div class="client-actions">${payment.receipt_path ? btn('Ver comprobante', `openServiceReceipt('${esc(payment.receipt_path)}')`, 'small secondary') : ''}${btn('Ver servicio', "location.hash='#admin-servicios'", 'small secondary')}</div></div><span class="status">Renovado</span></article>`;
  }
  const clientName = payment.projects?.clients ? `${payment.projects.clients.first_name} ${payment.projects.clients.last_name}` : 'Cliente no disponible';
  return `<article class="admin-list-card"><div><p class="eyebrow">${esc(payment.code)}</p><h2>${paymentType(payment.payment_type)}</h2><p>${esc(payment.projects?.title || 'Proyecto no disponible')} · ${esc(clientName)} · ${payment.amount ? money(payment.amount) : 'Sin monto registrado'} · ${payment.status === 'pendiente' ? 'Pendiente de pago' : date(payment.payment_date)}</p><div class="client-actions">${btn('Modificar pago', `showPaymentEditForm('${payment.id}')`, 'small secondary')}${payment.receipt_path ? btn('Ver comprobante', `openPaymentReceipt('${esc(payment.receipt_path)}')`, 'small secondary') : ''}</div></div><span class="status ${payment.status === 'pendiente' ? 'progress' : ''}">${payment.status === 'confirmado' ? 'Confirmado' : 'Pendiente'}</span></article>`;
}

function paymentPagination(totalPages) {
  if (totalPages <= 1) return '';
  return `<nav class="pagination" aria-label="Paginación de pagos"><button class="button small secondary" onclick="changePaymentPage(${state.paymentPage - 1})" ${state.paymentPage === 1 ? 'disabled' : ''}>Anterior</button><span>Página ${state.paymentPage} de ${totalPages}</span><button class="button small secondary" onclick="changePaymentPage(${state.paymentPage + 1})" ${state.paymentPage === totalPages ? 'disabled' : ''}>Siguiente</button></nav>`;
}

function changePaymentPage(page) {
  state.paymentPage = Math.max(1, page);
  adminPaymentsView();
}

async function paymentProjectOptions(selectedId = '') {
  const { data, error } = await supabase.from('projects').select('id,code,title,clients(first_name,last_name)').order('project_date', { ascending: false });
  if (error) throw error;
  if (!data.length) throw new Error('Primero registra al menos un proyecto para asociar el pago.');
  return data.map(project => `<option value="${project.id}" ${project.id === selectedId ? 'selected' : ''}>${esc(`${project.code} · ${project.title}${project.clients ? ` · ${project.clients.first_name} ${project.clients.last_name}` : ''}`)}</option>`).join('');
}

function paymentFields(payment = {}) {
  const type = payment.payment_type || 'inicial';
  const status = payment.status || '';
  const showPaymentDetails = status === 'confirmado';
  const availableTypes = state.paymentTypes.filter(item => item.active || item.code === type);
  const typeOptions = availableTypes.map(item => `<option value="${esc(item.code)}" ${item.code === type ? 'selected' : ''}>${esc(item.name)}${item.active ? '' : ' (inactivo)'}</option>`).join('');
  const pendingNote = status === 'pendiente' ? 'La fecha y el comprobante se registran cuando confirmes que el pago fue recibido.' : 'Selecciona el estado del pago para continuar.';
  return `<label class="field">Proyecto<select name="project_id" required data-project-options></select></label><div class="form-columns"><label class="field">Tipo de pago<select name="payment_type" required>${typeOptions || '<option value="">No hay tipos de pago activos</option>'}</select></label><label class="field">Estado<select name="status" required onchange="togglePaymentDetails(this.value)"><option value="" ${!status ? 'selected' : ''} disabled>Selecciona una opción</option><option value="pendiente" ${status === 'pendiente' ? 'selected' : ''}>Pendiente</option><option value="confirmado" ${status === 'confirmado' ? 'selected' : ''}>Confirmado</option></select></label></div><div class="form-columns"><label class="field">Monto (COP)<input name="amount" type="number" min="0" step="1" value="${esc(payment.amount ?? '')}" required></label><label class="field" data-payment-date ${showPaymentDetails ? '' : 'hidden'}>Fecha de pago<input name="payment_date" type="date" value="${esc(payment.payment_date || '')}" ${showPaymentDetails ? 'required' : 'disabled'}></label></div><label class="field" data-payment-receipt ${showPaymentDetails ? '' : 'hidden'}>Comprobante PNG <small>Opcional · máximo 5 MB.</small><input name="receipt" type="file" accept="image/png" ${showPaymentDetails ? '' : 'disabled'}></label><p class="field-note" data-payment-pending-note ${showPaymentDetails ? 'hidden' : ''}>${pendingNote}</p>`;
}

function togglePaymentDetails(status) {
  const form = document.querySelector('.modal form');
  if (!form) return;
  const showPaymentDetails = status === 'confirmado';
  const dateField = form.querySelector('[data-payment-date]');
  const dateInput = form.querySelector('[name="payment_date"]');
  const receiptField = form.querySelector('[data-payment-receipt]');
  const receiptInput = form.querySelector('[name="receipt"]');
  const note = form.querySelector('[data-payment-pending-note]');
  if (dateField) dateField.hidden = !showPaymentDetails;
  if (receiptField) receiptField.hidden = !showPaymentDetails;
  if (note) { note.hidden = showPaymentDetails; note.textContent = status === 'pendiente' ? 'La fecha y el comprobante se registran cuando confirmes que el pago fue recibido.' : 'Selecciona el estado del pago para continuar.'; }
  if (dateInput) { dateInput.disabled = !showPaymentDetails; dateInput.required = showPaymentDetails; if (!showPaymentDetails) dateInput.value = ''; }
  if (receiptInput) { receiptInput.disabled = !showPaymentDetails; if (!showPaymentDetails) receiptInput.value = ''; }
}

async function showPaymentForm() {
  try {
    await loadPortalPaymentTypes(true);
    if (!state.paymentTypes.some(item => item.active)) throw new Error('Primero configura al menos un tipo de pago activo en Administración → Personalizar portal.');
    modal('Registrar pago', `<p class="modal-lead">Registra el pago y conserva su comprobante de forma segura.</p><form class="form client-form" onsubmit="createPortalPayment(event)">${paymentFields()}<div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Registrar pago', '', 'primary', 'submit')}</div></form>`, false);
    document.querySelector('[data-project-options]').innerHTML = `<option value="">Selecciona un proyecto</option>${await paymentProjectOptions()}`;
  } catch (error) { modal('No fue posible abrir el formulario', `<p>${esc(errorText(error))}</p>`); }
}

async function showPaymentEditForm(id) {
  const payment = state.payments.get(id);
  if (!payment) return modal('No fue posible abrir el pago', '<p>Actualiza la vista e inténtalo nuevamente.</p>');
  try {
    await loadPortalPaymentTypes(true);
    modal('Modificar pago', `<p class="modal-lead">Actualiza el estado, los datos o el comprobante del pago.</p><form class="form client-form" onsubmit="updatePortalPayment(event, '${payment.id}')">${paymentFields(payment)}<div class="modal-actions"><button type="button" class="button secondary" onclick="closeTopModal()">Cancelar</button>${btn('Guardar cambios', '', 'primary', 'submit')}</div></form>`, false);
    document.querySelector('[data-project-options]').innerHTML = await paymentProjectOptions(payment.project_id);
  } catch (error) { modal('No fue posible abrir el formulario', `<p>${esc(errorText(error))}</p>`); }
}

async function adminSurveysView() {
  loading('Encuestas');
  const { data, error } = await supabase.from('csat_responses').select('*, clients(first_name,last_name,company_name)').order('submitted_at', { ascending: false });
  if (error) return dataError('Encuestas', error);
  const average = data.length ? (data.reduce((sum, item) => sum + item.satisfaction, 0) / data.length).toFixed(1) : '—';
  const csat = data.length ? Math.round((data.filter(item => item.satisfaction >= 4).length / data.length) * 100) : '—';
  const expectationFulfillment = data.length ? Math.round((data.filter(item => ['completamente', 'gran_parte'].includes(item.expectation)).length / data.length) * 100) : '—';
  const repurchaseIntent = data.length ? Math.round((data.filter(item => item.return_intent === 'si').length / data.length) * 100) : '—';
  const completeMetrics = `<section class="metric-grid"><article class="metric-card"><span>Respuestas</span><strong>${data.length}</strong></article><article class="metric-card"><span>Promedio</span><strong>${average}${data.length ? ' / 5' : ''}</strong></article><article class="metric-card"><span>CSAT</span><strong>${csat}${data.length ? '%' : ''}</strong></article><article class="metric-card"><span>Expectativas</span><strong>${expectationFulfillment}${data.length ? '%' : ''}</strong></article><article class="metric-card"><span>Recompra</span><strong>${repurchaseIntent}${data.length ? '%' : ''}</strong></article></section>`;
  const list = data.length ? `<section class="admin-list">${data.map(response => { const client = response.clients ? `${response.clients.first_name} ${response.clients.last_name}${response.clients.company_name ? ` · ${response.clients.company_name}` : ''}` : 'Sin cliente asociado'; return `<article class="admin-list-card"><div><p class="eyebrow">CSAT · ${date(response.submitted_at)}</p><h2>${response.satisfaction} / 5 · ${expectation(response.expectation)}</h2><p>${esc(response.email)}${response.improvement ? ` · ${esc(response.improvement)}` : ''}</p><p class="association ${response.client_id ? '' : 'unmatched'}">${response.client_id ? `Cliente asociado: ${esc(client)}` : 'Sin coincidencia de correo con un cliente'}</p></div><span class="status">Respondida</span></article>`; }).join('')}</section>` : '<div class="empty">Aún no hay respuestas de satisfacción.</div>';
  adminModuleShell('encuestas', 'Encuestas', 'Consulta las respuestas, métricas y asociaciones con clientes.', completeMetrics + list);
}

async function signIn(event) { event.preventDefault(); const email = document.querySelector('#login-email').value.trim(); const password = document.querySelector('#login-password').value; const token = captchaToken('login'); const submit = event.target.querySelector('[type="submit"]'); if (!token) return loginView('Completa la verificación de seguridad para continuar.'); startActivity('Ingresando…'); if (submit) { submit.disabled = true; submit.textContent = 'Ingresando…'; } try { const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: token } }); if (error) { resetTurnstile('login'); return loginView('Revisa tu correo, contraseña y verificación de seguridad e inténtalo nuevamente.'); } await hydrate(); const { error: usageError } = await supabase.rpc('record_portal_login'); if (usageError) console.warn('No fue posible registrar el evento de uso.', usageError.message); location.hash = state.session?.user?.user_metadata?.force_password_change ? '#actualizar-clave' : state.profile?.role === 'admin' ? '#admin' : '#inicio'; } finally { finishActivity(); } }
async function signOut() { await supabase.auth.signOut(); state.session = null; state.profile = null; location.hash = '#login'; }
async function requestPasswordReset() { const email = document.querySelector('#login-email')?.value.trim(); const token = captchaToken('login'); if (!email) return modal('Ingresa tu correo', '<p>Escribe primero tu correo electrónico en el inicio de sesión.</p>'); if (!token) return loginView('Completa la verificación de seguridad para solicitar el enlace.'); startActivity('Enviando enlace…'); try { const { error } = await supabase.auth.resetPasswordForEmail(email, { captchaToken: token }); resetTurnstile('login'); modal(error ? 'No fue posible enviar el enlace' : 'Revisa tu correo', error ? `<p>${esc(errorText(error))}</p>` : '<p>Si existe una cuenta con ese correo, recibirás un enlace seguro para crear una nueva contraseña.</p>'); } finally { finishActivity(); } }
async function updatePassword(event) { event.preventDefault(); const password = document.querySelector('#new-password').value; if (password !== document.querySelector('#confirm-password').value) return modal('Las contraseñas no coinciden', '<p>Verifica que ambas contraseñas sean iguales.</p>'); startActivity('Guardando contraseña…'); try { const { error } = await supabase.auth.updateUser({ password, data: { force_password_change: false } }); if (error) return modal('No fue posible guardar la contraseña', `<p>${esc(errorText(error))}</p>`); await hydrate(); location.hash = state.profile?.role === 'admin' ? '#admin' : '#inicio'; } finally { finishActivity(); } }
async function invokeClientAdmin(body) {
  startActivity('Guardando cambios…');
  try { const { data, error } = await supabase.functions.invoke('create-client-access', { body }); if (error || data?.error) throw new Error(data?.error || errorText(error)); return data; } finally { finishActivity(); }
}

async function invokeProjectAdmin(body) {
  startActivity('Guardando cambios…');
  try { const { data, error } = await supabase.functions.invoke('manage-projects', { body }); if (error || data?.error) throw new Error(data?.error || errorText(error)); return data; } finally { finishActivity(); }
}

async function invokeServiceAdmin(body) {
  startActivity('Guardando cambios…');
  try { const { data, error } = await supabase.functions.invoke('manage-services', { body }); if (error || data?.error) throw new Error(data?.error || errorText(error)); return data; } finally { finishActivity(); }
}

async function uploadServiceReceipt(renewalId, file) {
  if (!(file instanceof File) || file.size === 0) throw new Error('Adjunta el comprobante PNG de la renovación.');
  if (file.type !== 'image/png') throw new Error('El comprobante debe estar en formato PNG.');
  if (file.size > 5 * 1024 * 1024) throw new Error('El comprobante debe pesar máximo 5 MB.');
  const path = `${renewalId}/receipt.png`;
  const { error } = await supabase.storage.from('service-renewal-receipts').upload(path, file, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
  if (error) throw error;
  return path;
}

async function createClientService(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Creando…';
  try {
    await invokeServiceAdmin({ action: 'create', client_id: form.get('client_id'), name: form.get('name'), recurrence_id: form.get('recurrence_id'), amount: form.get('amount'), renewal_date: form.get('renewal_date'), observations: form.get('observations') });
    closeTopModal(); state.servicePage = 1; await adminServicesView();
    modal('Servicio creado', '<p>El servicio quedó registrado y su primera renovación fue programada.</p>');
  } catch (error) { submit.disabled = false; submit.textContent = 'Crear servicio'; modal('No fue posible crear el servicio', `<p>${esc(errorText(error))}</p>`); }
}

async function updateClientService(event, id) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Guardando…';
  try {
    await invokeServiceAdmin({ action: 'update', service_id: id, client_id: form.get('client_id'), name: form.get('name'), recurrence_id: form.get('recurrence_id'), amount: form.get('amount'), renewal_date: form.get('renewal_date'), observations: form.get('observations') });
    closeTopModal(); await adminServicesView();
  } catch (error) { submit.disabled = false; submit.textContent = 'Guardar cambios'; modal('No fue posible actualizar el servicio', `<p>${esc(errorText(error))}</p>`); }
}

async function setClientServiceActive(id, active) {
  try { await invokeServiceAdmin({ action: 'set_active', service_id: id, active }); await adminServicesView(); }
  catch (error) { modal('No fue posible actualizar el servicio', `<p>${esc(errorText(error))}</p>`); }
}

async function renewClientService(event, renewalId) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Confirmando…';
  try {
    const receiptPath = await uploadServiceReceipt(renewalId, form.get('receipt'));
    const result = await invokeServiceAdmin({ action: 'renew', renewal_id: renewalId, receipt_path: receiptPath });
    closeTopModal(); await adminServicesView();
    modal('Renovación confirmada', `<p>El comprobante fue guardado y la siguiente renovación quedó programada para ${date(result.next_renewal?.renewal_date)}.</p>`);
  } catch (error) { submit.disabled = false; submit.textContent = 'Confirmar renovación'; modal('No fue posible confirmar la renovación', `<p>${esc(errorText(error))}</p>`); }
}

async function openServiceReceipt(path) {
  const viewer = window.open('', '_blank');
  if (!viewer) return modal('No fue posible abrir el comprobante', '<p>Permite las ventanas emergentes para este portal e inténtalo nuevamente.</p>');
  viewer.opener = null;
  viewer.document.title = 'Comprobante de renovación';
  viewer.document.body.innerHTML = '<p style="font-family:Inter,Arial,sans-serif;padding:24px">Abriendo comprobante…</p>';
  const { data, error } = await supabase.storage.from('service-renewal-receipts').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) { viewer.close(); return modal('No fue posible abrir el comprobante', `<p>${esc(errorText(error))}</p>`); }
  viewer.location.replace(data.signedUrl);
}

async function invokePaymentAdmin(body) {
  startActivity('Guardando cambios…');
  try { const { data, error } = await supabase.functions.invoke('manage-payments', { body }); if (error || data?.error) throw new Error(data?.error || errorText(error)); return data; } finally { finishActivity(); }
}

async function uploadPaymentReceipt(paymentId, file) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.type !== 'image/png') throw new Error('El comprobante debe estar en formato PNG.');
  if (file.size > 5 * 1024 * 1024) throw new Error('El comprobante debe pesar máximo 5 MB.');
  const path = `${paymentId}/receipt.png`;
  const { error } = await supabase.storage.from('payment-receipts').upload(path, file, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
  if (error) throw error;
  await invokePaymentAdmin({ action: 'set_receipt', payment_id: paymentId, receipt_path: path });
  return path;
}

async function createPortalPayment(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Registrando…';
  try {
    const data = await invokePaymentAdmin({ action: 'create', project_id: form.get('project_id'), payment_type: form.get('payment_type'), amount: form.get('amount'), payment_date: form.get('payment_date'), status: form.get('status') });
    await uploadPaymentReceipt(data.payment.id, form.get('receipt'));
    closeTopModal();
    state.paymentPage = 1;
    await adminPaymentsView();
    modal('Pago registrado', `<p>El pago quedó registrado con el código ${esc(data.payment.code)}.</p>`);
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Registrar pago';
    modal('No fue posible registrar el pago', `<p>${esc(errorText(error))}</p>`);
  }
}

async function updatePortalPayment(event, id) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Guardando…';
  try {
    await invokePaymentAdmin({ action: 'update', payment_id: id, project_id: form.get('project_id'), payment_type: form.get('payment_type'), amount: form.get('amount'), payment_date: form.get('payment_date'), status: form.get('status') });
    await uploadPaymentReceipt(id, form.get('receipt'));
    closeTopModal();
    await adminPaymentsView();
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Guardar cambios';
    modal('No fue posible actualizar el pago', `<p>${esc(errorText(error))}</p>`);
  }
}

async function openPaymentReceipt(path) {
  const viewer = window.open('', '_blank');
  if (!viewer) return modal('No fue posible abrir el comprobante', '<p>Permite las ventanas emergentes para este portal e inténtalo nuevamente.</p>');
  viewer.opener = null;
  viewer.document.title = 'Comprobante de pago';
  viewer.document.body.innerHTML = '<p style="font-family:Inter,Arial,sans-serif;padding:24px">Abriendo comprobante…</p>';
  if (/^https?:\/\//i.test(path)) return viewer.location.replace(path);
  const { data, error } = await supabase.storage.from('payment-receipts').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) { viewer.close(); return modal('No fue posible abrir el comprobante', `<p>${esc(errorText(error))}</p>`); }
  viewer.location.replace(data.signedUrl);
}

async function createPortalProject(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Creando…';
  try {
    await invokeProjectAdmin({ action: 'create', client_id: form.get('client_id'), title: form.get('title'), service: form.get('service'), status: form.get('status'), start_date: form.get('start_date'), end_date: form.get('end_date'), shared_folder_url: form.get('shared_folder_url'), observations: form.get('observations') });
    closeTopModal();
    state.projectPage = 1;
    await adminProjectsView();
    modal('Proyecto creado', '<p>El proyecto quedó asociado al cliente y disponible en su portal.</p>');
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Crear proyecto';
    modal('No fue posible crear el proyecto', `<p>${esc(errorText(error))}</p>`);
  }
}

async function updatePortalProject(event, id) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Guardando…';
  try {
    await invokeProjectAdmin({ action: 'update', project_id: id, client_id: form.get('client_id'), title: form.get('title'), service: form.get('service'), status: form.get('status'), start_date: form.get('start_date'), end_date: form.get('end_date'), shared_folder_url: form.get('shared_folder_url'), observations: form.get('observations') });
    closeTopModal();
    await adminProjectsView();
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Guardar cambios';
    modal('No fue posible actualizar el proyecto', `<p>${esc(errorText(error))}</p>`);
  }
}

async function createPortalClient(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Creando…';
  try {
    const data = await invokeClientAdmin({ action: 'create', first_name: form.get('first_name'), last_name: form.get('last_name'), email: form.get('email'), phone: form.get('phone'), company_name: form.get('company_name'), portal_access: form.get('portal_access') === 'on' });
    closeTopModal();
    await adminClientsView();
    if (data.temporaryPassword) showTemporaryPassword(data.temporaryPassword, 'Acceso creado', 'El cliente ya puede ingresar al portal. Comparte esta contraseña temporal por el canal que prefieras.');
    else modal('Cliente creado', '<p>El contacto fue registrado sin acceso al portal.</p>');
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Crear cliente';
    modal('No fue posible crear el cliente', `<p>${esc(errorText(error))}</p>`);
  }
}

async function updatePortalClient(event, id) {
  event.preventDefault();
  const form = new FormData(event.target);
  const submit = event.target.querySelector('[type="submit"]');
  submit.disabled = true; submit.textContent = 'Guardando…';
  try {
    await invokeClientAdmin({ action: 'update', client_id: id, first_name: form.get('first_name'), last_name: form.get('last_name'), email: form.get('email'), phone: form.get('phone'), company_name: form.get('company_name') });
    closeTopModal();
    await adminClientsView();
  } catch (error) {
    submit.disabled = false; submit.textContent = 'Guardar cambios';
    modal('No fue posible actualizar el cliente', `<p>${esc(errorText(error))}</p>`);
  }
}

async function runClientAction(id, action) {
  const button = document.querySelector('.modal .button.primary');
  if (button) { button.disabled = true; button.textContent = 'Procesando…'; }
  try {
    const data = await invokeClientAdmin({ action, client_id: id });
    closeTopModal();
    await adminClientsView();
    if (data.temporaryPassword) showTemporaryPassword(data.temporaryPassword, action === 'reset_password' ? 'Contraseña restablecida' : 'Acceso creado', 'Comparte esta contraseña temporal por el canal que prefieras.');
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Intentar nuevamente'; }
    modal('No fue posible completar la acción', `<p>${esc(errorText(error))}</p>`);
  }
}

function showTemporaryPassword(password, title, message) {
  const encodedPassword = encodeURIComponent(String(password));
  modal(title, `<p>${esc(message)}</p><div class="credential"><span>Contraseña temporal</span><strong>${esc(password)}</strong></div><p class="credential-note">Guárdala o compártela ahora: no se volverá a mostrar.</p><div class="modal-actions"><button class="button primary" onclick="copyTemporaryPassword('${encodedPassword}', this)">Copiar contraseña <span class="circle">${copyIcon}</span></button><button class="button secondary" onclick="closeTopModal()">Listo</button></div>`, false);
}
async function submitCsat(event) { event.preventDefault(); const form = new FormData(event.target); const token = captchaToken('csat'); if (!token) return modal('Verificación requerida', '<p>Completa la verificación de seguridad antes de enviar la encuesta.</p>'); startActivity('Enviando encuesta…'); try { const { data, error } = await supabase.functions.invoke('submit-csat', { body: { token, email: form.get('email').trim().toLowerCase(), satisfaction: Number(form.get('satisfaction')), expectation: form.get('expectation'), return_intent: form.get('return'), improvement: form.get('improvement').trim() || null } }); if (error || data?.error) { resetTurnstile('csat'); return modal('No fue posible enviar la encuesta', `<p>${esc(data?.error || errorText(error))}</p>`); } event.target.reset(); resetTurnstile('csat'); modal('¡Gracias por tu tiempo!', '<p>Tu respuesta ha sido registrada. Tu opinión es importante para seguir mejorando.</p>'); } finally { finishActivity(); } }
async function hydrate() { const { data: { session } } = await supabase.auth.getSession(); state.session = session; state.profile = null; if (session) { const { data } = await supabase.from('profiles').select('role, client_id').eq('id', session.user.id).maybeSingle(); state.profile = data; } }
async function render() { const route = location.hash.replace('#', '').split('?')[0] || 'login'; if (route === 'actualizar-clave') return recoveryView(); if (state.session?.user?.user_metadata?.force_password_change) { location.hash = '#actualizar-clave'; return; } if (privateRoutes.has(route)) { if (!state.session) { location.hash = '#login'; return; } if (route.startsWith('admin') && state.profile?.role !== 'admin') { location.hash = '#inicio'; return; } } const view = { login: loginView, inicio: homeView, proyectos: projectsView, servicios: servicesView, encuestas: surveysView, satisfaccion: csatView, admin: adminView, 'admin-clientes': adminClientsView, 'admin-proyectos': adminProjectsView, 'admin-servicios': adminServicesView, 'admin-pagos': adminPaymentsView, 'admin-encuestas': adminSurveysView, 'admin-portal': adminPortalView }[route] || loginView; await view(); window.scrollTo(0, 0); }
function modal(title, content, showClose = true) { document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" onclick="if(event.target===this)this.remove()"><section class="modal"><h2>${title}</h2><div>${content}</div>${showClose ? '<div class="modal-actions"><button class="button" onclick="this.closest(\'.modal-backdrop\').remove()">Cerrar <span class="circle">×</span></button></div>' : ''}</section></div>`); }
function closeTopModal() { document.querySelector('.modal-backdrop:last-of-type')?.remove(); }
function copyProjectLink(value, element) { navigator.clipboard?.writeText(decodeURIComponent(value)); element.innerHTML = 'Enlace copiado <span class="circle">✓</span>'; }
function copyTemporaryPassword(value, element) { navigator.clipboard?.writeText(decodeURIComponent(value)); element.innerHTML = 'Contraseña copiada <span class="circle">✓</span>'; }
function status(v) { return ({ planificado: 'Planificado', en_curso: 'En curso', finalizado: 'Finalizado', pausado: 'Pausado' })[v] || v; }
function paymentType(v) { return state.paymentTypes.find(type => type.code === v)?.name || ({ inicial: 'Pago inicial', final: 'Pago final', total: 'Pago total' })[v] || 'Pago'; }
function expectation(v) { return ({ completamente: 'Sí, completamente', gran_parte: 'En gran parte', parcialmente: 'Parcialmente', no: 'No' })[v] || v; }
function returnLabel(v) { return ({ si: 'Sí', tal_vez: 'Tal vez', no: 'No' })[v] || v; }
function date(v) { return v ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${v.slice(0, 10)}T12:00:00`)) : 'Sin fecha'; }
function money(v) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v); }

Object.assign(window, { signIn, signOut, requestPasswordReset, updatePassword, submitCsat, projectInfo, projectPayments, surveyResponse, serviceInfo, openServiceReceipt, copyProjectLink, showClientForm, togglePortalAccess, createPortalClient, updatePortalClient, showClientEditForm, confirmClientAction, runClientAction, changeClientPage, showProjectForm, showProjectEditForm, createPortalProject, updatePortalProject, changeProjectPage, showServiceForm, showServiceEditForm, createClientService, updateClientService, setClientServiceActive, showRenewServiceForm, renewClientService, changeServicePage, showPaymentForm, showPaymentEditForm, createPortalPayment, updatePortalPayment, changePaymentPage, openPaymentReceipt, closeTopModal, copyTemporaryPassword, savePortalAppearance, addPortalService, setPortalServiceStatus, addPortalPaymentType, setPortalPaymentTypeStatus, addServiceRecurrence, setServiceRecurrenceStatus, saveServiceAlertSettings, togglePaymentDetails });
supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') location.hash = '#actualizar-clave'; if (event === 'SIGNED_OUT') { state.session = null; state.profile = null; } });
window.addEventListener('hashchange', render);
await hydrate();
render();

