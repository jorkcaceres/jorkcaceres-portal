import { countryOptions, normalizePhone } from './phone.js';
import { AXES, QUESTIONS, VERSION, scoreCriterion } from './model.js?v=1.3.2';
import { escape as esc, reportHTML, makePDF } from './report.js?v=1.3.4';

export function createDiagnostic(deps) {
  const { app, supabase, state, header, publicHeader, footer, mountTurnstile, captchaToken, resetTurnstile, helpUrl, adminNav, adminModuleShell, arrowIcon } = deps;
  let suggestionsPage = 1, historyAdmin = null;
  let feedbackDraft = '', feedbackId = null, feedbackBusy = false;
  let busy = false, generating = false, current = null, pending = null, storageKey = '', credentials = null, historyPage = 1;
  const key = () => `jc-diagnostic-v1:${state.session?.user?.id || 'guest'}`;
  const load = () => { if (storageKey !== key()) { current = null; pending = null; storageKey = key(); credentials = null; try { credentials = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch {} } };
  const save = () => { try { sessionStorage.setItem(storageKey, JSON.stringify(credentials)); } catch {} };
  const shell = html => { app.innerHTML = `${state.session ? header() : publicHeader()}<section class="page diagnostic-page">${html}</section>${footer()}${current && credentials && !current.record && !location.hash.startsWith('#admin') ? feedbackHTML() : ''}`; };
  const error = message => { const box = app.querySelector('[data-diagnostic-error]'); if (box) { box.textContent = message; box.hidden = false; } };
  const invoke = async body => {
    const { data, error: failure } = await supabase.functions.invoke('digital-diagnostic', { body });
    if (failure || data?.error) {
      let message = data?.error;
      if (!message && failure?.context instanceof Response) { try { message = (await failure.context.json()).error; } catch {} }
      throw new Error(message || 'No pudimos conectar con el diagnóstico. Conservamos tu mensaje; intenta nuevamente.');
    }
    return data;
  };
  function bind() {
    bindFeedback();
    app.querySelector('[data-diagnostic-prepare]')?.addEventListener('click', () => mutate('prepare'));
    app.querySelector('[data-diagnostic-start]')?.addEventListener('submit', start);
    app.querySelector('[data-diagnostic-message]')?.addEventListener('submit', send);
    app.querySelector('[data-diagnostic-finish]')?.addEventListener('click', generateDiagnostic);
    app.querySelector('[data-diagnostic-clarify]')?.addEventListener('click', event => mutate('clarify', { axisId: event.currentTarget.dataset.axisId, practiceId: event.currentTarget.dataset.practiceId }));
    app.querySelectorAll('[data-diagnostic-revise]').forEach(b => b.addEventListener('click', () => mutate('revise', { axis: Number(b.dataset.diagnosticRevise) })));
    app.querySelector('[data-diagnostic-new]')?.addEventListener('click', newDiagnostic);
    app.querySelector('[data-diagnostic-pdf]')?.addEventListener('click', download);
    app.querySelector('[data-diagnostic-compare]')?.addEventListener('click', compare);
    app.querySelector('[data-diagnostic-resume]')?.addEventListener('click', view);
  }
  function feedbackHTML() {
    return `<button class="diagnostic-feedback-button" data-feedback-open aria-label="Enviar una sugerencia">✎ <span>Sugerencias</span></button><dialog class="diagnostic-feedback-dialog" aria-labelledby="feedback-title"><form data-feedback-form><div class="diagnostic-feedback-heading"><h2 id="feedback-title">Tu experiencia nos ayuda</h2><button type="button" data-feedback-close aria-label="Cerrar sugerencias">×</button></div><p>Cuéntanos qué mejorarías del diagnóstico. Jorkcáceres podrá revisar tu comentario junto con los datos de contacto que ya compartiste.</p><label class="field">Tu sugerencia<textarea name="feedback" rows="5" minlength="5" maxlength="1500" required>${esc(feedbackDraft)}</textarea></label><p data-feedback-status role="status"></p><button class="button primary" type="submit">Enviar sugerencia</button></form></dialog>`;
  }
  function bindFeedback() {
    const dialog = app.querySelector('.diagnostic-feedback-dialog'); if (!dialog) return;
    app.querySelector('[data-feedback-open]').onclick = () => dialog.showModal();
    app.querySelector('[data-feedback-close]').onclick = () => dialog.close();
    dialog.querySelector('textarea').oninput = e => { feedbackDraft = e.target.value; feedbackId = null; };
    dialog.querySelector('form').onsubmit = async e => {
      e.preventDefault(); if (feedbackBusy) return;
      feedbackBusy = true; const button = e.submitter, status = dialog.querySelector('[data-feedback-status]'); button.disabled = true;
      feedbackId ||= crypto.randomUUID(); status.textContent = 'Guardando tu sugerencia…';
      try { await invoke({ action: 'feedback', ...credentials, requestId: feedbackId, message: feedbackDraft }); feedbackDraft = ''; feedbackId = null; dialog.querySelector('textarea').value = ''; status.textContent = 'Gracias. Tu sugerencia quedó guardada para revisión.'; }
      catch (err) { status.textContent = err.message; }
      finally { feedbackBusy = false; button.disabled = false; }
    };
  }
  async function start(e) {
    e.preventDefault(); if (busy) return;
    const form = new FormData(e.target), contact = Object.fromEntries(form);
    if (!state.session) {
      try { contact.phone = normalizePhone(contact.phone_country, contact.phone); delete contact.phone_country; }
      catch (err) { error(err.message); return; }
    }
    if (!credentials) { const secret = [...crypto.getRandomValues(new Uint8Array(32))].map(b => b.toString(16).padStart(2, '0')).join(''); credentials = { id: crypto.randomUUID(), secret }; save(); }
    busy = true; e.submitter.disabled = true;
    const ownerKey = key(), route = location.hash;
    try { const data = await invoke({ action: 'start', ...credentials, contact, authenticated: Boolean(state.session), token: captchaToken('diagnostic') }); if (ownerKey !== key()) return; current = data.state; if (route === location.hash) view(); }
    catch (err) { error(err.message); resetTurnstile('diagnostic'); }
    finally { busy = false; if (e.submitter?.isConnected) e.submitter.disabled = false; }
  }
  function progress(value, label) {
    const box = app.querySelector('[data-diagnostic-progress]');
    if (!box) return;
    box.hidden = false;
    box.querySelector('progress').value = value;
    box.querySelector('[data-diagnostic-progress-value]').textContent = `${value}%`;
    box.querySelector('[data-diagnostic-progress-label]').textContent = label;
  }
  async function mutate(action, extra = {}, options = {}) {
    if (busy) return false;
    busy = true; app.querySelectorAll('.diagnostic-compose button,[data-diagnostic-finish],[data-diagnostic-prepare],[data-diagnostic-revise],[data-diagnostic-clarify]').forEach(b => b.disabled = true);
    const ownerKey = key(), route = location.hash;
    const signature = JSON.stringify({ action, ...extra });
    if (!pending || pending.signature !== signature) pending = { signature, requestId: crypto.randomUUID() };
    const status = app.querySelector('[data-diagnostic-status]');
    if (!options.quiet && status) status.textContent = action === 'prepare' || action === 'finish' ? 'Estoy organizando y comprobando tu diagnóstico. Puede tomar unos segundos…' : 'Estoy leyendo tu respuesta y preparando la siguiente pregunta…';
    app.querySelector('.diagnostic-chat')?.setAttribute('aria-busy', 'true');
    try {
      const data = await invoke({ action, ...credentials, requestId: pending.requestId, ...extra });
      if (ownerKey !== key()) return false;
      current = data.state; pending = null;
      if (action === 'finish' && current?.phase === 'done' && credentials?.id && options.navigate !== false) { location.hash = `#diagnostico-${credentials.id}`; return true; }
      if (options.render !== false && route === location.hash) view();
      return true;
    } catch (err) { error(err.message); return false; }
    finally {
      busy = false; app.querySelector('.diagnostic-chat')?.setAttribute('aria-busy', 'false');
      if (!options.quiet && status?.isConnected) status.textContent = '';
      app.querySelectorAll('.diagnostic-compose button,[data-diagnostic-finish],[data-diagnostic-prepare],[data-diagnostic-revise],[data-diagnostic-clarify]').forEach(b => b.disabled = false);
    }
  }
  async function generateDiagnostic() {
    if (generating) return;
    generating = true;
    app.querySelectorAll('[data-diagnostic-finish],[data-diagnostic-clarify]').forEach(button => button.disabled = true);
    try {
      progress(20, 'Validando las respuestas compartidas…');
      if (!await mutate('prepare', {}, { render: false, quiet: true })) return;
      progress(50, 'Analizando la evidencia de cada eje…');
      if (!await mutate('verify', {}, { render: false, quiet: true })) return;
      progress(80, 'Verificando y organizando tu informe…');
      if (!await mutate('finish', {}, { render: false, quiet: true, navigate: false })) return;
      progress(100, 'Tu diagnóstico está listo.');
      await new Promise(resolve => setTimeout(resolve, 250));
      if (current?.phase === 'done' && credentials?.id) location.hash = `#diagnostico-${credentials.id}`;
    } finally { generating = false; }
  }
  async function send(e) { e.preventDefault(); const input = e.target.querySelector('textarea'); await mutate('message', { message: input.value }); }
  async function download() {
    const button = app.querySelector('[data-diagnostic-pdf]'); if (button) button.disabled = true;
    try { const bytes = await makePDF(current.record || { id: credentials?.id, created_at: current.completedAt, context: current.context, contact: current.contact, result: current.result });
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), a = document.createElement('a'); a.href = url; a.download = 'diagnostico-digital-jorkcaceres.pdf'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch { error('No pudimos generar el PDF. Inténtalo nuevamente.'); } finally { if (button) button.disabled = false; }
  }
  async function compare() {
    const record = current?.record; if (!record) return;
    const button = app.querySelector('[data-diagnostic-compare]'); button.disabled = true;
    const ownerKey = key();
    const { data, error: failure } = await supabase.from('digital_diagnostics').select('id,contact,context,result,created_at,model_version,email').eq('email', record.email).lt('created_at', record.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle();
    if (ownerKey !== key()) return;
    if (failure || !data) { error(failure ? 'No pudimos cargar la evaluación anterior.' : 'No hay una evaluación anterior asociada a este correo.'); button.disabled = false; return; }
    current = { phase: 'done', record: { ...record, previous: data } }; view();
  }
  async function view() {
    const wasConversation = Boolean(app.querySelector('.diagnostic-conversation'));
    load();
    if (!current && credentials) {
      shell('<h1>Retomando tu diagnóstico…</h1><p data-diagnostic-error hidden role="alert"></p><button class="button" data-diagnostic-resume>Reintentar</button><button class="button secondary" data-diagnostic-new>Iniciar uno nuevo</button>'); bind();
      try { const ownerKey = key(); const data = await invoke({ action: 'resume', ...credentials }); if (ownerKey !== key()) return; current = data.state; }
      catch (err) { error(err.message); return; }
    }
    if (!current) {
      shell(`<div class="diagnostic-intro"><p class="eyebrow">Diagnóstico digital · Versión Beta</p><h1>Descubre cómo puede avanzar tu negocio.</h1><p class="lead">Una conversación natural para entender tus capacidades digitales y elegir tus próximos pasos.</p><div class="diagnostic-tags"><span>6 Ejes</span><span>5–10 minutos estimados</span><span>Informe en PDF</span></div></div><div class="card diagnostic-entry"><h2>${state.session ? 'Comencemos con tu negocio' : 'Antes de conversar'}</h2><p>${state.session ? 'Usaremos los datos de tu cuenta. El resultado quedará en tu historial.' : 'Usaremos estos datos para identificar tu diagnóstico y asociarlo a tu historial por correo.'}</p><form class="form" data-diagnostic-start>${state.session ? '' : `<div class="form-columns"><label class="field">Nombre<input name="first_name" autocomplete="given-name" maxlength="150" required></label><label class="field">Apellido<input name="last_name" autocomplete="family-name" maxlength="150" required></label></div><label class="field">Correo electrónico<input type="email" name="email" autocomplete="email" maxlength="254" required></label><fieldset class="diagnostic-phone"><legend>Teléfono con WhatsApp</legend><div class="diagnostic-phone-row"><label class="field">País<select name="phone_country" autocomplete="tel-country-code" required>${countryOptions().map(c => `<option value="${c.iso}" ${c.iso === 'CO' ? 'selected' : ''}>${esc(c.flag)} ${esc(c.name)} (+${c.code})</option>`).join('')}</select></label><label class="field">Número<input type="tel" inputmode="tel" name="phone" autocomplete="tel-national" maxlength="30" aria-describedby="phone-hint" required></label></div><p class="field-note" id="phone-hint">Escribe tu número sin el código del país.</p></fieldset><label class="field">Empresa / negocio<input name="company_name" autocomplete="organization" maxlength="150" required></label><div id="diagnostic-turnstile"></div>`}<p class="field-note">Las respuestas se procesan con asistencia de IA para elaborar tu diagnóstico. Comparte prácticas generales; evita información confidencial. No se envían campañas comerciales desde este formulario.</p><p data-diagnostic-error hidden role="alert"></p><button class="button primary" type="submit">Comenzar conversación</button></form></div>${state.session ? '<div class="diagnostic-actions diagnostic-entry-actions"><a class="button secondary" href="#diagnosticos">Ver mi historial<span class="circle">'+arrowIcon+'</span></a></div>' : '<p>¿Ya tienes acceso al portal? <a href="#login">Inicia sesión</a> para consultar tu historial.</p>'}`);
      bind(); if (!state.session) { deps.clearCaptcha(); await mountTurnstile('diagnostic-turnstile', 'diagnostic'); } return;
    }
    if (current.version && current.version !== VERSION && current.phase !== 'done') {
      shell('<h1>Tenemos una versión mejorada del diagnóstico</h1><p>Esta conversación comenzó con la versión anterior. Inicia una nueva para usar la evaluación actualizada.</p><button class="button primary" data-diagnostic-new>Iniciar nuevo diagnóstico</button>'); bind(); return;
    }
    if (current.phase === 'done') {
      shell(`${reportHTML(current.record || { context: current.context, contact: current.contact, result: current.result })}<p data-diagnostic-error hidden role="alert"></p><div class="diagnostic-actions"><button class="button primary" data-diagnostic-pdf>Descargar PDF</button><a class="button secondary" href="${helpUrl}" target="_blank" rel="noreferrer">Conversar por WhatsApp</a><a class="button secondary" href="mailto:ceo@jorkcaceres.com?subject=Mi%20diagn%C3%B3stico%20digital">Escribir por correo</a>${state.session && current.record ? '<button class="button secondary" data-diagnostic-compare>Comparar con el anterior</button>' : ''}</div><div class="diagnostic-actions diagnostic-result-nav">${state.session ? '<a class="button secondary" href="#diagnosticos">Ver mi historial<span class="circle">'+arrowIcon+'</span></a>' : ''}<button class="button secondary" data-diagnostic-new>Nueva evaluación<span class="circle">${arrowIcon}</span></button></div>`); bind(); return;
    }
    const covered = AXES.filter(a => a.criteria.every(c => current.facts[c.id])).length;
    const answeredQuestions = current.answers?.length || 0;
    const initialAnswers = (current.answers || []).filter(answer => !String(answer.question_id).startsWith('clarify-')).length;
    const clarifications = Math.max(0, answeredQuestions - initialAnswers);
    const questionIndex = Number.isInteger(current.question) ? current.question : 0;
    const activeAxis = current.followup ? AXES.find(axis => axis.id === current.followup.axis_id) : AXES.find(axis => axis.id === QUESTIONS[questionIndex]?.axis_id);
    const missing = AXES.flatMap(axis => axis.criteria.map(criterion => ({ axis, criterion }))).filter(({ criterion }) => scoreCriterion(current.facts?.[criterion.id]) === null);
    const progressText = current.phase === 'review'
      ? `${initialAnswers} preguntas iniciales respondidas en ${covered} de 6 ejes${clarifications ? ` · ${clarifications} aclaración${clarifications === 1 ? '' : 'es'} adicional${clarifications === 1 ? '' : 'es'}` : ''}`
      : current.phase === 'context'
        ? 'Antes de empezar · 6 ejes por conocer'
        : current.followup
          ? `Aclaración para ${activeAxis?.name || 'tu negocio'}`
          : `Eje ${questionIndex + 1} de ${QUESTIONS.length} · Una pregunta por eje`;
    const missingHTML = missing.length
      ? `<h2>Información por completar</h2><p>Para cubrir todos los ejes, falta ${missing.length} aclaración${missing.length === 1 ? '' : 'es'}.</p><div class="notice"><ul>${missing.map(({ axis, criterion }) => `<li><strong>${esc(axis.name)}:</strong> ${esc(criterion.name)}</li>`).join('')}</ul></div><div class="diagnostic-actions"><button class="button primary" data-diagnostic-clarify data-axis-id="${esc(missing[0].axis.id)}" data-practice-id="${esc(missing[0].criterion.id)}">Completar información<span class="circle">${arrowIcon}</span></button><button class="button secondary" data-diagnostic-finish>Generar con la información actual</button></div>`
      : `<h2>Información lista para diagnosticar</h2><p>Tus respuestas permiten generar el diagnóstico de los seis ejes.</p><button class="button primary" data-diagnostic-finish>Generar mi diagnóstico<span class="circle">${arrowIcon}</span></button>`;
    shell(`<div class="${current.phase === 'review' ? '' : 'diagnostic-conversation'}"><p class="eyebrow">Diagnóstico digital · Conversación</p><h1>Conversemos sobre tu negocio.</h1>${current.phase !== 'review' ? `<div class="diagnostic-chat-heading"><span class="diagnostic-avatar" aria-hidden="true">J</span><div><strong>${esc(current.phase === 'context' ? 'Primero, conozcamos tu negocio' : activeAxis?.name || 'Tu negocio')}</strong><small>Una pregunta a la vez · A tu ritmo</small></div></div>` : ''}<p>${progressText} · Puedes decir «no sé» cuando lo necesites.</p><progress max="${QUESTIONS.length}" value="${Math.min(initialAnswers, QUESTIONS.length)}" aria-label="Ejes respondidos"></progress><div class="diagnostic-chat" role="log" aria-label="Conversación">${current.messages.map(m => `<article class="diagnostic-message ${m.role === 'user' ? 'from-user' : ''}"><strong>${m.role === 'user' ? 'Tú' : 'Jorkcáceres'}</strong><p>${esc(m.content)}</p></article>`).join('')}</div>
      ${current.phase === 'review' ? `<section class="diagnostic-review">${missingHTML}<section class="diagnostic-progress" data-diagnostic-progress hidden aria-live="polite"><div><span class="diagnostic-progress-spinner" aria-hidden="true"></span><strong data-diagnostic-progress-label>Preparando tu diagnóstico…</strong><span data-diagnostic-progress-value>0%</span></div><progress max="100" value="0" aria-label="Progreso de generación del diagnóstico"></progress></section></section>` : '<form data-diagnostic-message class="diagnostic-compose"><label class="field" for="diagnostic-answer">Tu respuesta<textarea id="diagnostic-answer" name="message" rows="3" maxlength="2000" required></textarea></label><button class="button primary" type="submit">Enviar respuesta</button></form>'}
      <p class="diagnostic-processing" data-diagnostic-status role="status"></p><p data-diagnostic-error hidden role="alert"></p></div>`);
    bind(); const chat = app.querySelector('.diagnostic-chat'); chat.scrollTop = chat.scrollHeight;
    app.querySelector('#diagnostic-answer')?.focus({ preventScroll: true });
  }
  function pager(page, count, attribute, label) {
    const total = Math.ceil((count || 0) / 10);
    if (total <= 1) return '';
    return `<nav class="pagination" aria-label="Paginación de ${label}"><button class="button small secondary" ${attribute}="-1" ${page <= 1 ? 'disabled' : ''}>Anterior</button><span>Página ${page} de ${total}</span><button class="button small secondary" ${attribute}="1" ${page >= total ? 'disabled' : ''}>Siguiente</button></nav>`;
  }
  async function history(admin = false) {
    load();
    if (!admin && !state.session) { location.hash = '#login'; return; }
    if (historyAdmin !== admin) { historyPage = 1; historyAdmin = admin; }
    const ownerKey = key(), route = location.hash;
    const renderHistory = body => admin
      ? adminModuleShell('diagnosticos', 'Diagnósticos', 'Consulta las evaluaciones digitales de tus clientes y sus resultados.', body)
      : shell(`<nav class="breadcrumbs" aria-label="Ruta de navegación"><a href="#inicio">Portal</a><span class="breadcrumb-separator" aria-hidden="true">/</span><span aria-current="page">Diagnósticos digitales</span></nav><h1>Mis diagnósticos digitales</h1><p class="lead">Consulta los resultados de tus evaluaciones y conserva el avance de tu negocio.</p><div class="admin-module-actions"><a class="button primary" href="#diagnostico-nuevo">Hacer nueva evaluación<span class="circle">${arrowIcon}</span></a></div>${body}`);
    renderHistory('<p>Cargando evaluaciones…</p>');
    const { data, count, error: failure } = await supabase.from('digital_diagnostics').select('id,contact,context,result,created_at,model_version,email', { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false }).range((historyPage - 1) * 10, historyPage * 10 - 1);
    if (ownerKey !== key() || route !== location.hash) return;
    if (!failure && historyPage > Math.max(1, Math.ceil((count || 0) / 10))) { historyPage = Math.max(1, Math.ceil((count || 0) / 10)); return history(admin); }
    const cards = (data || []).map((r, i) => `<article class="${admin ? 'admin-list-card' : 'card'}"><div><p class="eyebrow">${new Date(r.created_at).toLocaleDateString('es-CO')} · ${r.result.coverage}/6 ejes · Modelo ${esc(r.model_version)}</p><h2>${esc(r.contact?.company_name || 'Negocio')}</h2>${admin ? `<p>${esc(r.email)}</p>` : ''}<div class="client-actions"><a class="button small secondary" href="#diagnostico-${r.id}">Ver resultado<span class="circle">${arrowIcon}</span></a></div></div></article>`).join('');
    renderHistory(`<p data-diagnostic-error hidden role="alert"></p>${failure ? '<div class="empty">No pudimos cargar el historial. Vuelve a intentarlo.</div>' : !data?.length ? `<div class="empty">${admin ? 'Aún no hay diagnósticos registrados.' : 'Aún no hay diagnósticos. Tu primera evaluación será el punto de partida.'}</div>` : `<section class="${admin ? 'admin-list' : 'diagnostic-history'}">${cards}</section>${pager(historyPage, count, 'data-page', 'diagnósticos')}`}${!admin && data?.length > 1 ? '<p>Para comparar, revisa los perfiles de dos fechas: deben corresponder al mismo negocio y versión. Una diferencia declarada no prueba por sí sola una mejora.</p>' : ''}`);
    app.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { historyPage += Number(b.dataset.page); history(admin); }));
  }
  async function record(id) {
    load();
    const route = location.hash, ownerKey = key();
    shell('<p>Cargando diagnóstico…</p>');
    const { data, error: failure } = await supabase.from('digital_diagnostics').select('id,contact,context,result,created_at,model_version,email').eq('id', id).maybeSingle();
    if (route !== location.hash || ownerKey !== key()) return;
    if (failure || !data) {
      shell('<div class="empty"><p>No fue posible abrir este diagnóstico.</p><a class="button secondary" href="#diagnosticos">Volver a mis diagnósticos</a></div>');
      return;
    }
    current = { phase: 'done', record: data };
    view();
  }
  async function suggestions() {
    const renderSuggestions = body => adminModuleShell('sugerencias', 'Sugerencias', 'Revisa los comentarios sobre el diagnóstico y da seguimiento a las mejoras propuestas.', body);
    renderSuggestions('<p>Cargando sugerencias…</p>');
    const route = location.hash, ownerKey = key();
    const { data, count, error: failure } = await supabase.from('digital_diagnostic_feedback').select('id,contact,message,phase,created_at,status', { count: 'exact' }).order('created_at', { ascending: false }).order('id', { ascending: false }).range((suggestionsPage - 1) * 10, suggestionsPage * 10 - 1);
    if (route !== location.hash || ownerKey !== key()) return;
    if (!failure && suggestionsPage > Math.max(1, Math.ceil((count || 0) / 10))) { suggestionsPage = Math.max(1, Math.ceil((count || 0) / 10)); return suggestions(); }
    const phases = { context: 'Contexto del negocio', axis: 'Conversación', review: 'Revisión del diagnóstico', done: 'Resultado' };
    renderSuggestions(`${failure ? '<div class="empty">No pudimos cargar las sugerencias.</div>' : !data?.length ? '<div class="empty">Aún no hay sugerencias.</div>' : `<section class="admin-list">${data.map(r => `<article class="admin-list-card"><div><p class="eyebrow">${new Date(r.created_at).toLocaleString('es-CO')} · ${esc(phases[r.phase] || 'Diagnóstico')}</p><h2>${esc(r.contact?.company_name || 'Negocio')}</h2><p>${esc(r.contact?.email)}</p><div class="form"><p>${esc(r.message)}</p><label class="field">Estado<select data-feedback-state="${r.id}">${['Nuevo','En revisión','Resuelto'].map(v => `<option ${v === r.status ? 'selected' : ''}>${v}</option>`).join('')}</select></label></div></div></article>`).join('')}</section>${pager(suggestionsPage, count, 'data-suggestion-page', 'sugerencias')}`}<p data-diagnostic-error role="alert" hidden></p>`);
    app.querySelectorAll('[data-suggestion-page]').forEach(b => b.onclick = () => { suggestionsPage += Number(b.dataset.suggestionPage); suggestions(); });
    app.querySelectorAll('[data-feedback-state]').forEach(select => select.onchange = async () => { select.disabled = true; const { error: failure } = await supabase.from('digital_diagnostic_feedback').update({ status: select.value }).eq('id', select.dataset.feedbackState); if (failure) error('No se pudo guardar el estado. Recarga para comprobarlo.'); select.disabled = false; });
  }
  function newDiagnostic() { current = null; credentials = null; pending = null; save(); if (location.hash !== '#diagnostico-nuevo') { location.hash = '#diagnostico-nuevo'; return; } view(); }
  function clear() { suggestionsPage = 1; historyAdmin = null; feedbackDraft = ''; feedbackId = null; current = null; credentials = null; pending = null; storageKey = ''; historyPage = 1; }
  return { view, newDiagnostic, history, record, suggestions, clear };
}
