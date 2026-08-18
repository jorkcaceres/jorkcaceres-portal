import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';

const app = document.querySelector('#app');
const logo = 'assets/jorkcaceres-horizontal-negro.png';
const supabase = createClient('https://zfzsigdyycgaqvbauffk.supabase.co', 'sb_publishable_K5khETTDgbkAmAOeiDg2Tw_gKfdxBeq');
const state = { session: null, profile: null };
const privateRoutes = new Set(['inicio', 'proyectos', 'encuestas', 'admin', 'admin-clientes', 'admin-proyectos', 'admin-pagos', 'admin-encuestas']);
const helpUrl = 'https://wa.me/573243062809?text=Hola%2C+necesito+ayuda.+Vengo+del+portal+de+Jorkc%C3%A1ceres';
const footer = () => '<footer class="footer">© 2026 Jorkcáceres. Portal para clientes. V1.0</footer>';
const arrowIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7"/><path d="M8 7h9v9"/></svg>';
const backIcon = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/><path d="M9 12h12"/></svg>';
const btn = (label, action, classes = '', type = 'button') => `<button type="${type}" class="button ${classes}" onclick="${action}">${label}<span class="circle">${arrowIcon}</span></button>`;
const esc = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
const errorText = (error) => error?.message || 'No fue posible completar la acción.';

function header() {
  const name = state.profile?.clients?.first_name || state.session?.user?.email || 'Mi cuenta';
  return `<header class="header"><a class="brand" href="#inicio"><img src="${logo}" alt="Jorkcáceres" /></a><div class="header-actions"><span class="account-name">${esc(name)}</span><a class="help-link" href="${helpUrl}" target="_blank" rel="noreferrer">¿Necesitas ayuda?</a><button class="user-button" title="Cerrar sesión" aria-label="Cerrar sesión" onclick="signOut()"><svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></svg></button></div></header>`;
}

function publicHeader() {
  return `<header class="header"><a class="brand" href="#login"><img src="${logo}" alt="Jorkcáceres" /></a><div class="header-actions"><a class="help-link" href="${helpUrl}" target="_blank" rel="noreferrer">¿Necesitas ayuda?</a><button class="user-button" title="Volver atrás" aria-label="Volver atrás" onclick="location.hash='#login'">${backIcon}</button></div></header>`;
}

function loginView(message = '') {
  app.innerHTML = `<section class="login"><div class="login-panel"><a class="brand" href="#login"><img src="${logo}" alt="Jorkcáceres" /></a><div class="login-content"><p class="eyebrow">Portal Jorkcáceres</p><h1>Todo lo importante, en un solo lugar.</h1><p class="lead">Consulta el estado de tus proyectos, entregables, pagos y encuestas.</p><form class="form" onsubmit="signIn(event)"><label class="field">Correo electrónico<input id="login-email" type="email" placeholder="nombre@empresa.com" autocomplete="email" required></label><label class="field">Contraseña<input id="login-password" type="password" placeholder="••••••••" autocomplete="current-password" required></label><div class="form-row"><span></span><button type="button" class="text-link" onclick="requestPasswordReset()">¿Olvidaste tu clave?</button></div>${message ? `<p class="form-message">${esc(message)}</p>` : ''}${btn('Iniciar sesión', '', 'primary', 'submit')}</form></div></div><aside class="login-aside"><article class="announcement"><span class="tag">Tu opinión cuenta</span><h2>¿Cómo fue tu experiencia?</h2><p>Tu respuesta me ayuda a mejorar la forma en que trabajo y las soluciones que construyo.</p>${btn('Responder encuesta', "location.hash='#satisfaccion'", 'secondary')}</article><article class="announcement coming"><span class="tag">Próximamente</span><h2>Diagnóstico digital</h2><p>Conoce el estado actual de tu empresa y encuentra oportunidades para avanzar.</p><button class="button secondary" disabled>Muy pronto</button></article></aside></section>${footer()}`;
}

function recoveryView() {
  app.innerHTML = `<section class="login"><div class="login-panel"><a class="brand" href="#login"><img src="${logo}" alt="Jorkcáceres" /></a><div class="login-content"><p class="eyebrow">Restablecer contraseña</p><h1>Crea una nueva clave.</h1><p class="lead">Elige una contraseña nueva para ingresar al portal.</p><form class="form" onsubmit="updatePassword(event)"><label class="field">Nueva contraseña<input id="new-password" type="password" minlength="8" autocomplete="new-password" required></label><label class="field">Confirmar contraseña<input id="confirm-password" type="password" minlength="8" autocomplete="new-password" required></label>${btn('Guardar contraseña', '', 'primary', 'submit')}</form></div></div><aside class="login-aside"><article class="announcement"><span class="tag">Portal seguro</span><h2>Tu cuenta está protegida.</h2><p>Después de guardar tu nueva contraseña podrás ingresar con normalidad.</p></article></aside></section>${footer()}`;
}

function homeView() {
  const firstName = state.profile?.clients?.first_name || 'bienvenido';
  app.innerHTML = `${header()}<main class="page"><section class="hero"><div><p class="eyebrow">Hola, ${esc(firstName)}</p><h1>Tu espacio de trabajo con Jorkcáceres.</h1><p class="lead">Aquí encontrarás información relevante de los proyectos que realizamos juntos y las encuestas que has respondido.</p></div><div class="hero-mark" aria-hidden="true">J</div></section><section class="section"><div class="section-heading"><div><p class="eyebrow">Accesos</p><h2>¿Qué quieres consultar?</h2></div></div><div class="card-grid"><article class="card"><div class="card-icon">▣</div><h3>Proyectos</h3><p>Revisa el estado de tus proyectos, sus entregables, observaciones y pagos.</p>${btn('Ver proyectos', "location.hash='#proyectos'")}</article><article class="card"><div class="card-icon">✓</div><h3>Encuestas</h3><p>Consulta las encuestas que has realizado y los resultados disponibles.</p>${btn('Ver encuestas', "location.hash='#encuestas'")}</article></div></section></main>${footer()}`;
}

function loading(title) { app.innerHTML = `${header()}<main class="page"><p class="eyebrow">Portal</p><h1>${title}</h1><p class="lead">Cargando tu información…</p></main>${footer()}`; }
function dataError(title, error) { app.innerHTML = `${header()}<main class="page"><p class="eyebrow">Portal</p><h1>${title}</h1><div class="notice">No fue posible cargar la información: ${esc(errorText(error))}</div></main>${footer()}`; }

async function projectsView() {
  loading('Proyectos');
  const { data, error } = await supabase.from('projects').select('*').order('project_date', { ascending: false });
  if (error) return dataError('Proyectos', error);
  const cards = data.length ? data.map(p => `<article class="card"><div class="card-top"><div><p class="eyebrow">${esc(p.code)}</p><h3>${esc(p.title)}</h3></div><span class="status ${p.status === 'en_curso' ? 'progress' : ''}">${status(p.status)}</span></div><p>${esc(p.service)}</p><div class="item-grid"><span>Fecha<strong>${date(p.project_date)}</strong></span><span>Servicio<strong>${esc(p.service)}</strong></span></div><div class="modal-actions">${btn('Información', `projectInfo('${p.id}')`, 'small secondary')}${btn('Pagos', `projectPayments('${p.id}')`, 'small')}</div></article>`).join('') : '<div class="empty">Aún no tienes proyectos registrados en el portal.</div>';
  app.innerHTML = `${header()}<main class="page"><p class="eyebrow">Portal / Proyectos</p><h1>Proyectos</h1><p class="lead">Consulta la información y trazabilidad de los proyectos que realizamos juntos.</p><div class="card-grid">${cards}</div></main>${footer()}`;
}

async function projectInfo(id) {
  const { data: p, error } = await supabase.from('projects').select('*').eq('id', id).single();
  if (error) return modal('No fue posible abrir el proyecto', `<p>${esc(errorText(error))}</p>`);
  const folder = p.shared_folder_url || '';
  modal(esc(p.title), `<p><strong>Carpeta compartida</strong></p>${folder ? `<p class="meta link-value">${esc(folder)}</p><button class="button small" onclick="copyProjectLink('${encodeURIComponent(folder)}', this)">Copiar enlace <span class="circle">${arrowIcon}</span></button>` : '<p class="meta">No hay una carpeta compartida registrada todavía.</p>'}<p><strong>Observaciones</strong></p><p>${esc(p.observations || 'No hay observaciones registradas.')}</p>`);
}

async function projectPayments(id) {
  const { data, error } = await supabase.from('project_payments').select('*').eq('project_id', id).order('payment_date', { ascending: true });
  if (error) return modal('No fue posible abrir los pagos', `<p>${esc(errorText(error))}</p>`);
  modal('Pagos del proyecto', data.length ? data.map(p => `<div class="notice"><strong>${esc(p.code)}</strong><br>${esc(p.concept)}${p.amount ? `<br>${money(p.amount)}` : ''}<br><span class="status ${p.status === 'pendiente' ? 'progress' : ''}">${p.status === 'confirmado' ? 'Confirmado' : 'Pendiente'}</span>${p.receipt_path ? `<br><a class="text-link" href="${esc(p.receipt_path)}" target="_blank" rel="noreferrer">Ver comprobante</a>` : ''}</div>`).join('') : '<p>No hay pagos registrados para este proyecto.</p>');
}

async function surveysView() {
  loading('Encuestas');
  const { data, error } = await supabase.from('csat_responses').select('*').order('submitted_at', { ascending: false });
  if (error) return dataError('Encuestas', error);
  const cards = data.length ? data.map(r => `<article class="card"><div class="card-top"><div><p class="eyebrow">CSAT</p><h3>Encuesta de satisfacción</h3></div><span class="status">Respondida</span></div><p>Completada el ${date(r.submitted_at)}</p><div class="item-grid"><span>Satisfacción<strong>${r.satisfaction} / 5</strong></span><span>Intención<strong>${returnLabel(r.return_intent)}</strong></span></div>${btn('Ver respuesta', `surveyResponse('${r.id}')`, 'small')}</article>`).join('') : '<div class="empty">Aún no hay encuestas respondidas con esta cuenta.</div>';
  app.innerHTML = `${header()}<main class="page"><p class="eyebrow">Portal / Encuestas</p><h1>Encuestas</h1><p class="lead">Aquí se conserva la trazabilidad de las encuestas que has respondido.</p><section class="section"><div class="card-grid">${cards}</div></section></main>${footer()}`;
}

async function surveyResponse(id) {
  const { data, error } = await supabase.from('csat_responses').select('*').eq('id', id).single();
  if (error) return modal('No fue posible abrir la respuesta', `<p>${esc(errorText(error))}</p>`);
  modal('Encuesta de satisfacción', `<p><strong>Índice de satisfacción:</strong> ${data.satisfaction} de 5</p><p><strong>Cumplimiento de expectativas:</strong> ${expectation(data.expectation)}</p><p><strong>¿Volvería a trabajar contigo?:</strong> ${returnLabel(data.return_intent)}</p><p><strong>Comentario:</strong><br>${esc(data.improvement || 'No dejó comentarios.')}</p>`);
}

function csatView() {
  app.innerHTML = `${state.session ? header() : publicHeader()}<main class="page survey-wrap"><p class="eyebrow">Encuesta de satisfacción</p><h1>Tu opinión me ayuda a mejorar.</h1><p class="lead">Responder esta encuesta te tomará menos de un minuto.</p><form class="survey-card form" onsubmit="submitCsat(event)"><label class="field">Correo electrónico <small>Usa el correo con el que accedes al Portal Jorkcáceres o el que has utilizado para comunicarte conmigo.</small><input name="email" type="email" placeholder="nombre@empresa.com" autocomplete="email" required></label><fieldset class="survey-question"><legend>1. En general, ¿qué tan satisfecho estás con el trabajo realizado? *</legend><div class="scale">${[1,2,3,4,5].map(n => `<label><input type="radio" name="satisfaction" value="${n}" required><b>${n}</b>${['Muy insatisfecho','Insatisfecho','Neutral','Satisfecho','Muy satisfecho'][n - 1]}</label>`).join('')}</div></fieldset><fieldset class="survey-question"><legend>2. ¿El resultado cumplió con lo que esperabas? *</legend><div class="choice-list">${[['completamente','Sí, completamente'],['gran_parte','En gran parte'],['parcialmente','Parcialmente'],['no','No']].map(([v,l]) => `<label class="choice"><input type="radio" name="expectation" value="${v}" required> ${l}</label>`).join('')}</div></fieldset><fieldset class="survey-question"><legend>3. ¿Volverías a trabajar conmigo? *</legend><div class="choice-list">${[['si','Sí'],['tal_vez','Tal vez'],['no','No']].map(([v,l]) => `<label class="choice"><input type="radio" name="return" value="${v}" required> ${l}</label>`).join('')}</div></fieldset><label class="field survey-question">4. ¿Hay algo que debería mejorar? <small>Opcional</small><textarea name="improvement" placeholder="Comparte aquí cualquier comentario que consideres importante."></textarea></label>${btn('Enviar encuesta', '', 'primary', 'submit')}</form></main>${footer()}`;
}

const adminIcon = (type) => ({
  clients: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  projects: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>',
  payments: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h3"/></svg>',
  surveys: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
}[type]);

const adminNav = (active) => `<nav class="admin-nav"><a class="${active === 'admin' ? 'active' : ''}" href="#admin">Resumen</a><a class="${active === 'clientes' ? 'active' : ''}" href="#admin-clientes">Clientes</a><a class="${active === 'proyectos' ? 'active' : ''}" href="#admin-proyectos">Proyectos</a><a class="${active === 'pagos' ? 'active' : ''}" href="#admin-pagos">Pagos</a><a class="${active === 'encuestas' ? 'active' : ''}" href="#admin-encuestas">Encuestas</a></nav>`;

async function adminView() {
  loading('Administración');
  const queries = ['clients', 'projects', 'project_payments', 'csat_responses'].map(table => supabase.from(table).select('*', { count: 'exact', head: true }));
  const [clients, projects, payments, surveys] = await Promise.all(queries);
  const error = [clients, projects, payments, surveys].find(result => result.error)?.error;
  if (error) return dataError('Administración', error);
  const entries = [
    ['clients', 'Clientes', 'Organiza la información y el acceso de cada cliente.', clients.count || 0, '#admin-clientes'],
    ['projects', 'Proyectos', 'Consulta los proyectos, estados y entregables registrados.', projects.count || 0, '#admin-proyectos'],
    ['payments', 'Pagos', 'Mantén la trazabilidad de pagos y comprobantes.', payments.count || 0, '#admin-pagos'],
    ['surveys', 'Encuestas', 'Revisa respuestas y métricas de satisfacción.', surveys.count || 0, '#admin-encuestas']
  ];
  app.innerHTML = `${header()}<main class="page admin-page"><p class="eyebrow">Administración</p><h1>Gestión del portal.</h1><p class="lead">Centraliza la relación con tus clientes y la información de cada servicio.</p>${adminNav('admin')}<section class="admin-grid">${entries.map(([type, title, description, total, target]) => `<article class="admin-card"><div class="admin-card-top"><span class="admin-icon">${adminIcon(type)}</span><strong class="admin-count">${total}</strong></div><h2>${title}</h2><p>${description}</p>${btn(`Gestionar ${title.toLowerCase()}`, `location.hash='${target}'`, 'secondary')}</article>`).join('')}</section></main>${footer()}`;
}

function adminModuleShell(section, title, description, body) {
  app.innerHTML = `${header()}<main class="page admin-page"><p class="eyebrow">Administración</p><h1>${title}</h1><p class="lead">${description}</p>${adminNav(section)}${body}</main>${footer()}`;
}

async function adminClientsView() {
  loading('Clientes');
  const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  if (error) return dataError('Clientes', error);
  const body = `<div class="admin-module-actions">${btn('Crear cliente', 'showClientForm()', 'primary')}</div>${data.length ? `<section class="admin-list">${data.map(client => `<article class="admin-list-card"><div><p class="eyebrow">${client.portal_access ? 'Con acceso al portal' : 'Contacto'}</p><h2>${esc(`${client.first_name} ${client.last_name}`)}</h2><p>${esc(client.company_name || 'Sin empresa registrada')} · ${esc(client.email)}</p></div><span class="status ${client.status === 'inactivo' ? 'progress' : ''}">${client.status === 'activo' ? 'Activo' : 'Inactivo'}</span></article>`).join('')}</section>` : '<div class="empty">Aún no hay clientes registrados.</div>'}`;
  adminModuleShell('clientes', 'Clientes', 'Consulta los contactos y clientes con información registrada en el portal.', body);
}

function showClientForm() {
  modal('Crear cliente', `<p class="modal-lead">Registra la información de contacto y decide si esta persona tendrá acceso al portal.</p><form class="form client-form" onsubmit="createPortalClient(event)"><div class="form-columns"><label class="field">Nombre<input name="first_name" autocomplete="given-name" required></label><label class="field">Apellido<input name="last_name" autocomplete="family-name" required></label></div><label class="field">Correo electrónico<input name="email" type="email" autocomplete="email" required></label><label class="field">Teléfono<input name="phone" type="tel" autocomplete="tel"></label><label class="field">Empresa<input name="company_name" autocomplete="organization"></label><label class="access-choice"><input id="client-portal-access" type="checkbox" name="portal_access" onchange="togglePortalAccess(this.checked)"><span><strong>Dar acceso al portal</strong><small id="portal-access-help">Se registrará como contacto; no podrá iniciar sesión.</small></span></label><div class="modal-actions"><button type="button" class="button secondary" onclick="this.closest('.modal-backdrop').remove()">Cancelar</button>${btn('Crear cliente', '', 'primary', 'submit')}</div></form>`);
}

function togglePortalAccess(enabled) {
  const help = document.querySelector('#portal-access-help');
  if (help) help.textContent = enabled ? 'Se generará una contraseña temporal única para compartirla con el cliente.' : 'Se registrará como contacto; no podrá iniciar sesión.';
}

async function adminProjectsView() {
  loading('Proyectos');
  const { data, error } = await supabase.from('projects').select('*, clients(first_name,last_name,company_name)').order('project_date', { ascending: false });
  if (error) return dataError('Proyectos', error);
  const body = data.length ? `<section class="admin-list">${data.map(project => `<article class="admin-list-card"><div><p class="eyebrow">${esc(project.code)}</p><h2>${esc(project.title)}</h2><p>${esc(project.clients ? `${project.clients.first_name} ${project.clients.last_name}` : 'Cliente no disponible')} · ${esc(project.service)}</p></div><span class="status ${project.status === 'en_curso' ? 'progress' : ''}">${status(project.status)}</span></article>`).join('')}</section>` : '<div class="empty">Aún no hay proyectos registrados.</div>';
  adminModuleShell('proyectos', 'Proyectos', 'Revisa los servicios en curso y el historial de proyectos registrados.', body);
}

async function adminPaymentsView() {
  loading('Pagos');
  const { data, error } = await supabase.from('project_payments').select('*, projects(code,title)').order('payment_date', { ascending: false });
  if (error) return dataError('Pagos', error);
  const body = data.length ? `<section class="admin-list">${data.map(payment => `<article class="admin-list-card"><div><p class="eyebrow">${esc(payment.code)}</p><h2>${esc(payment.concept)}</h2><p>${esc(payment.projects?.title || 'Proyecto no disponible')} · ${payment.amount ? money(payment.amount) : 'Sin monto registrado'}</p></div><span class="status ${payment.status === 'pendiente' ? 'progress' : ''}">${payment.status === 'confirmado' ? 'Confirmado' : 'Pendiente'}</span></article>`).join('')}</section>` : '<div class="empty">Aún no hay pagos registrados.</div>';
  adminModuleShell('pagos', 'Pagos', 'Consulta el estado y la trazabilidad de los pagos de cada proyecto.', body);
}

async function adminSurveysView() {
  loading('Encuestas');
  const { data, error } = await supabase.from('csat_responses').select('*').order('submitted_at', { ascending: false });
  if (error) return dataError('Encuestas', error);
  const average = data.length ? (data.reduce((sum, item) => sum + item.satisfaction, 0) / data.length).toFixed(1) : '—';
  const csat = data.length ? Math.round((data.filter(item => item.satisfaction >= 4).length / data.length) * 100) : '—';
  const metrics = `<section class="metric-grid"><article class="metric-card"><span>Respuestas</span><strong>${data.length}</strong></article><article class="metric-card"><span>Promedio</span><strong>${average}${data.length ? ' / 5' : ''}</strong></article><article class="metric-card"><span>CSAT</span><strong>${csat}${data.length ? '%' : ''}</strong></article></section>`;
  const list = data.length ? `<section class="admin-list">${data.map(response => `<article class="admin-list-card"><div><p class="eyebrow">CSAT · ${date(response.submitted_at)}</p><h2>${response.satisfaction} / 5 · ${expectation(response.expectation)}</h2><p>${esc(response.email)}${response.improvement ? ` · ${esc(response.improvement)}` : ''}</p></div><span class="status">Respondida</span></article>`).join('')}</section>` : '<div class="empty">Aún no hay respuestas de satisfacción.</div>';
  adminModuleShell('encuestas', 'Encuestas', 'Consulta los resultados de satisfacción y su evolución.', metrics + list);
}

async function signIn(event) { event.preventDefault(); const email = document.querySelector('#login-email').value.trim(); const password = document.querySelector('#login-password').value; const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) return loginView('Revisa tu correo y contraseña e inténtalo nuevamente.'); await hydrate(); location.hash = state.profile?.role === 'admin' ? '#admin' : '#inicio'; }
async function signOut() { await supabase.auth.signOut(); state.session = null; state.profile = null; location.hash = '#login'; }
async function requestPasswordReset() { const email = document.querySelector('#login-email')?.value.trim(); if (!email) return modal('Ingresa tu correo', '<p>Escribe primero tu correo electrónico en el inicio de sesión.</p>'); const { error } = await supabase.auth.resetPasswordForEmail(email); modal(error ? 'No fue posible enviar el enlace' : 'Revisa tu correo', error ? `<p>${esc(errorText(error))}</p>` : '<p>Si existe una cuenta con ese correo, recibirás un enlace seguro para crear una nueva contraseña.</p>'); }
async function updatePassword(event) { event.preventDefault(); const password = document.querySelector('#new-password').value; if (password !== document.querySelector('#confirm-password').value) return modal('Las contraseñas no coinciden', '<p>Verifica que ambas contraseñas sean iguales.</p>'); const { error } = await supabase.auth.updateUser({ password }); if (error) return modal('No fue posible guardar la contraseña', `<p>${esc(errorText(error))}</p>`); await hydrate(); location.hash = state.profile?.role === 'admin' ? '#admin' : '#inicio'; }
async function createPortalClient(event) { event.preventDefault(); const form = new FormData(event.target); const submit = event.target.querySelector('[type="submit"]'); submit.disabled = true; submit.textContent = 'Creando…'; const { data, error } = await supabase.functions.invoke('create-client-access', { body: { first_name: form.get('first_name'), last_name: form.get('last_name'), email: form.get('email'), phone: form.get('phone'), company_name: form.get('company_name'), portal_access: form.get('portal_access') === 'on' } }); if (error || data?.error) { submit.disabled = false; submit.textContent = 'Crear cliente'; return modal('No fue posible crear el cliente', `<p>${esc(data?.error || errorText(error))}</p>`); } event.target.closest('.modal-backdrop')?.remove(); await adminClientsView(); if (data.temporaryPassword) { const password = String(data.temporaryPassword); modal('Acceso creado', `<p>El cliente ya puede ingresar al portal. Comparte esta contraseña temporal por el canal que prefieras.</p><div class="credential"><span>Contraseña temporal</span><strong>${esc(password)}</strong></div><p class="credential-note">Guárdala o compártela ahora: no se volverá a mostrar.</p><div class="modal-actions"><button class="button primary" onclick="copyTemporaryPassword('${encodeURIComponent(password)}', this)">Copiar contraseña <span class="circle">${arrowIcon}</span></button><button class="button secondary" onclick="this.closest('.modal-backdrop').remove()">Listo</button></div>`); } else { modal('Cliente creado', '<p>El contacto fue registrado sin acceso al portal.</p>'); } }
async function submitCsat(event) { event.preventDefault(); const form = new FormData(event.target); const { error } = await supabase.from('csat_responses').insert({ email: form.get('email').trim().toLowerCase(), satisfaction: Number(form.get('satisfaction')), expectation: form.get('expectation'), return_intent: form.get('return'), improvement: form.get('improvement').trim() || null }); if (error) return modal('No fue posible enviar la encuesta', `<p>${esc(errorText(error))}</p>`); event.target.reset(); modal('¡Gracias por tu tiempo!', '<p>Tu respuesta ha sido registrada. Tu opinión es importante para seguir mejorando.</p>'); }
async function hydrate() { const { data: { session } } = await supabase.auth.getSession(); state.session = session; state.profile = null; if (session) { const { data } = await supabase.from('profiles').select('role, client_id, clients(first_name)').eq('id', session.user.id).maybeSingle(); state.profile = data; } }
async function render() { const route = location.hash.replace('#', '').split('?')[0] || 'login'; if (route === 'actualizar-clave') return recoveryView(); if (privateRoutes.has(route)) { if (!state.session) { location.hash = '#login'; return; } if (route.startsWith('admin') && state.profile?.role !== 'admin') { location.hash = '#inicio'; return; } } const view = { login: loginView, inicio: homeView, proyectos: projectsView, encuestas: surveysView, satisfaccion: csatView, admin: adminView, 'admin-clientes': adminClientsView, 'admin-proyectos': adminProjectsView, 'admin-pagos': adminPaymentsView, 'admin-encuestas': adminSurveysView }[route] || loginView; await view(); window.scrollTo(0, 0); }
function modal(title, content) { document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" onclick="if(event.target===this)this.remove()"><section class="modal"><h2>${title}</h2><div>${content}</div><div class="modal-actions"><button class="button" onclick="this.closest('.modal-backdrop').remove()">Cerrar <span class="circle">×</span></button></div></section></div>`); }
function copyProjectLink(value, element) { navigator.clipboard?.writeText(decodeURIComponent(value)); element.innerHTML = 'Enlace copiado <span class="circle">✓</span>'; }
function copyTemporaryPassword(value, element) { navigator.clipboard?.writeText(decodeURIComponent(value)); element.innerHTML = 'Contraseña copiada <span class="circle">✓</span>'; }
function status(v) { return ({ planificado: 'Planificado', en_curso: 'En curso', finalizado: 'Finalizado', pausado: 'Pausado' })[v] || v; }
function expectation(v) { return ({ completamente: 'Sí, completamente', gran_parte: 'En gran parte', parcialmente: 'Parcialmente', no: 'No' })[v] || v; }
function returnLabel(v) { return ({ si: 'Sí', tal_vez: 'Tal vez', no: 'No' })[v] || v; }
function date(v) { return v ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(`${v.slice(0, 10)}T12:00:00`)) : 'Sin fecha'; }
function money(v) { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v); }

Object.assign(window, { signIn, signOut, requestPasswordReset, updatePassword, submitCsat, projectInfo, projectPayments, surveyResponse, copyProjectLink, showClientForm, togglePortalAccess, createPortalClient, copyTemporaryPassword });
supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') location.hash = '#actualizar-clave'; if (event === 'SIGNED_OUT') { state.session = null; state.profile = null; } });
window.addEventListener('hashchange', render);
await hydrate();
render();
