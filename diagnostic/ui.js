import { countryOptions, normalizePhone } from './phone.js';
import { AXES, VERSION } from './model.js?v=1.1.0';
import { escape as esc, reportHTML, makePDF } from './report.js?v=1.1.0';

export function createDiagnostic(deps) {
  const { app, supabase, state, header, publicHeader, footer, mountTurnstile, captchaToken, resetTurnstile, helpUrl, adminNav } = deps;
  let feedbackDraft = '', feedbackId = null, feedbackBusy = false;
  let busy = false, current = null, pending = null, storageKey = '', credentials = null, historyPage = 1;
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
    app.querySelector('[data-diagnostic-finish]')?.addEventListener('click', () => mutate('finish'));
    app.querySelectorAll('[data-diagnostic-revise]').forEach(b => b.addEventListener('click', () => mutate('revise', { axis: Number(b.dataset.diagnosticRevise) })));
    app.querySelector('[data-diagnostic-new]')?.addEventListener('click', () => { current = null; credentials = null; pending = null; save(); view(); });
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
  async function mutate(action, extra = {}) {
    if (busy) return;
    busy = true; app.querySelectorAll('.diagnostic-compose button,[data-diagnostic-finish],[data-diagnostic-prepare],[data-diagnostic-revise]').forEach(b => b.disabled = true);
    const ownerKey = key(), route = location.hash;
    const signature = JSON.stringify({ action, ...extra });
    if (!pending || pending.signature !== signature) pending = { signature, requestId: crypto.randomUUID() };
    const status = app.querySelector('[data-diagnostic-status]'); if (status) status.textContent = action === 'prepare' || action === 'finish' ? 'Estoy organizando y comprobando tu informe. Puede tomar un momento…' : 'Estoy leyendo tu respuesta…';
    app.querySelector('.diagnostic-chat')?.setAttribute('aria-busy', 'true');
    try { const data = await invoke({ action, ...credentials, requestId: pending.requestId, ...extra }); if (ownerKey !== key()) return; current = data.state; pending = null; if (route === location.hash) view(); }
    catch (err) { error(err.message); }
    finally { busy = false; app.querySelector('.diagnostic-chat')?.setAttribute('aria-busy', 'false'); if (status?.isConnected) status.textContent = ''; app.querySelectorAll('.diagnostic-compose button,[data-diagnostic-finish],[data-diagnostic-prepare],[data-diagnostic-revise]').forEach(b => b.disabled = false); }
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
      shell(`<div class="diagnostic-intro"><p class="eyebrow">Diagnóstico digital · Versión Demo</p><h1>Descubre cómo puede avanzar tu negocio.</h1><p class="lead">Una conversación natural para entender tus capacidades digitales y elegir tus próximos pasos.</p><div class="diagnostic-tags"><span>6 Ejes</span><span>5–10 minutos estimados</span><span>Informe en PDF</span></div></div><div class="card diagnostic-entry"><h2>${state.session ? 'Comencemos con tu negocio' : 'Antes de conversar'}</h2><p>${state.session ? 'Usaremos los datos de tu cuenta. El resultado quedará en tu historial.' : 'Usaremos estos datos para identificar tu diagnóstico y asociarlo a tu historial por correo.'}</p><form class="form" data-diagnostic-start>${state.session ? '' : `<div class="form-columns"><label class="field">Nombre<input name="first_name" autocomplete="given-name" maxlength="150" required></label><label class="field">Apellido<input name="last_name" autocomplete="family-name" maxlength="150" required></label></div><label class="field">Correo electrónico<input type="email" name="email" autocomplete="email" maxlength="254" required></label><fieldset class="diagnostic-phone"><legend>Teléfono con WhatsApp</legend><div class="diagnostic-phone-row"><label class="field">País<select name="phone_country" autocomplete="tel-country-code" required>${countryOptions().map(c => `<option value="${c.iso}" ${c.iso === 'CO' ? 'selected' : ''}>${esc(c.flag)} ${esc(c.name)} (+${c.code})</option>`).join('')}</select></label><label class="field">Número<input type="tel" inputmode="tel" name="phone" autocomplete="tel-national" maxlength="30" aria-describedby="phone-hint" required></label></div><p class="field-note" id="phone-hint">Escribe tu número sin el código del país.</p></fieldset><label class="field">Empresa / negocio<input name="company_name" autocomplete="organization" maxlength="150" required></label><div id="diagnostic-turnstile"></div>`}<p class="field-note">Las respuestas se procesan con asistencia de IA para elaborar tu diagnóstico. Comparte prácticas generales; evita información confidencial. No se envían campañas comerciales desde este formulario.</p><p data-diagnostic-error hidden role="alert"></p><button class="button primary" type="submit">Comenzar conversación</button></form></div>${state.session ? '<p><a href="#diagnosticos">Consultar mi historial</a></p>' : '<p>¿Ya tienes acceso al portal? <a href="#login">Inicia sesión</a> para consultar tu historial.</p>'}`);
      bind(); if (!state.session) { deps.clearCaptcha(); await mountTurnstile('diagnostic-turnstile', 'diagnostic'); } return;
    }
    if (current.version && current.version !== VERSION && current.phase !== 'done') {
      shell('<h1>Tenemos una versión mejorada del diagnóstico</h1><p>Esta conversación comenzó con la versión anterior. Inicia una nueva para usar la evaluación actualizada.</p><button class="button primary" data-diagnostic-new>Iniciar nuevo diagnóstico</button>'); bind(); return;
    }
    if (current.phase === 'done') {
      shell(`${reportHTML(current.record || { context: current.context, contact: current.contact, result: current.result })}<p data-diagnostic-error hidden role="alert"></p><div class="diagnostic-actions"><button class="button primary" data-diagnostic-pdf>Descargar PDF</button><a class="button secondary" href="${helpUrl}" target="_blank" rel="noreferrer">Conversar por WhatsApp</a><a class="button secondary" href="mailto:ceo@jorkcaceres.com?subject=Mi%20diagn%C3%B3stico%20digital">Escribir por correo</a>${state.session && current.record ? '<button class="button secondary" data-diagnostic-compare>Comparar con el anterior</button>' : ''}<button class="button secondary" data-diagnostic-new>Nuevo diagnóstico</button>${state.session ? '<a href="#diagnosticos">Ver historial</a>' : ''}</div>`); bind(); return;
    }
    const covered = AXES.filter(a => a.criteria.every(c => current.facts[c.id])).length;
    shell(`<div class="${current.phase === 'review' ? '' : 'diagnostic-conversation'}"><p class="eyebrow">Diagnóstico digital · Conversación</p><h1>Conversemos sobre tu negocio.</h1>${current.phase !== 'review' ? `<div class="diagnostic-chat-heading"><span class="diagnostic-avatar" aria-hidden="true">J</span><div><strong>${esc(current.phase === 'context' ? 'Primero, conozcamos tu negocio' : AXES[current.axis]?.name || 'Tu negocio')}</strong><small>Una pregunta a la vez · A tu ritmo</small></div></div>` : ''}<p>${covered} de 6 Ejes conversados · Puedes decir «no sé» cuando lo necesites.</p><progress max="6" value="${covered}" aria-label="Ejes conversados"></progress><div class="diagnostic-chat" role="log" aria-label="Conversación">${current.messages.map(m => `<article class="diagnostic-message ${m.role === 'user' ? 'from-user' : ''}"><strong>${m.role === 'user' ? 'Tú' : 'Jorkcáceres'}</strong><p>${esc(m.content)}</p></article>`).join('')}</div>
      ${current.phase === 'review' ? `<section class="diagnostic-review"><h2>¿Esto refleja tu negocio?</h2><p>${esc(current.editorial?.summary || current.context)}</p>${AXES.map((a, index) => `<article class="card"><h3>${esc(a.name)}</h3>${a.criteria.map(c => `<p><strong>${esc(c.name)}${c.name.endsWith('?') ? '' : ':'}</strong> ${esc(current.editorial?.criteria?.[c.id] || current.facts[c.id]?.evidence || 'Información insuficiente.')}</p>`).join('')}${current.revisions < 2 ? `<button class="text-link" data-diagnostic-revise="${index}">Corregir este tema</button>` : ''}</article>`).join('')}${current.editorial ? '<button class="button primary" data-diagnostic-finish>Confirmar y generar diagnóstico</button>' : '<button class="button primary" data-diagnostic-prepare>Preparar explicación para revisar</button>'}</section>` : '<form data-diagnostic-message class="diagnostic-compose"><label class="field" for="diagnostic-answer">Tu respuesta<textarea id="diagnostic-answer" name="message" rows="3" maxlength="2000" required></textarea></label><button class="button primary" type="submit">Enviar respuesta</button></form>'}
      <p data-diagnostic-status role="status"></p><p data-diagnostic-error hidden role="alert"></p></div>`);
    bind(); const chat = app.querySelector('.diagnostic-chat'); chat.scrollTop = chat.scrollHeight;
    if (!wasConversation && current.phase !== 'review') window.scrollTo(0, 0);
    app.querySelector('#diagnostic-answer')?.focus({ preventScroll: true });
  }
  async function history(admin = false) {
    load();
    const ownerKey = key(), route = location.hash;
    shell(`${admin ? adminNav('diagnosticos') : '<a href="#inicio">Volver al inicio</a>'}<h1>${admin ? 'Diagnósticos digitales' : 'Mi historial digital'}</h1><p>Cargando evaluaciones…</p>`);
    const { data, count, error: failure } = await supabase.from('digital_diagnostics').select('id,contact,context,result,created_at,model_version,email', { count: 'exact' }).order('created_at', { ascending: false }).range((historyPage - 1) * 10, historyPage * 10 - 1);
    if (ownerKey !== key() || route !== location.hash) return;
    shell(`${admin ? adminNav('diagnosticos') : '<a href="#inicio">Volver al inicio</a>'}<h1>${admin ? 'Diagnósticos digitales' : 'Mi historial digital'}</h1><a class="button primary" href="#diagnostico">Hacer un diagnóstico</a><p data-diagnostic-error hidden role="alert"></p><div class="diagnostic-history">${failure ? '<p>No pudimos cargar el historial. Vuelve a intentarlo.</p>' : !data.length ? '<p>Aún no hay diagnósticos. Tu primera evaluación será el punto de partida.</p>' : data.map((r, i) => `<article class="card"><h2>${esc(r.contact.company_name)}</h2><p>${new Date(r.created_at).toLocaleDateString('es-CO')} · ${r.result.coverage}/6 ejes · Modelo ${esc(r.model_version)}</p>${admin ? `<p>${esc(r.email)}</p>` : ''}<button class="button secondary" data-report="${i}">Ver resultado</button></article>`).join('')}</div><div class="diagnostic-actions"><button class="button secondary" data-page="-1" ${historyPage <= 1 ? 'disabled' : ''}>Anterior</button><span>Página ${historyPage}</span><button class="button secondary" data-page="1" ${historyPage * 10 >= (count || 0) ? 'disabled' : ''}>Siguiente</button></div>${!admin && data?.length > 1 ? '<p>Para comparar, revisa los perfiles de dos fechas: deben corresponder al mismo negocio y versión. Una diferencia declarada no prueba por sí sola una mejora.</p>' : ''}`);
    app.querySelectorAll('[data-report]').forEach(b => b.addEventListener('click', () => { current = { phase: 'done', record: data[Number(b.dataset.report)] }; view(); }));
    app.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => { historyPage = Math.max(1, historyPage + Number(b.dataset.page)); history(admin); }));
  }
  async function suggestions() {
    shell(`${adminNav('sugerencias')}<h1>Sugerencias del diagnóstico</h1><p>Cargando…</p>`);
    const route = location.hash, ownerKey = key();
    const { data, error: failure } = await supabase.from('digital_diagnostic_feedback').select('id,contact,message,phase,created_at,status').order('created_at', { ascending: false }).limit(100);
    if (route !== location.hash || ownerKey !== key()) return;
    shell(`${adminNav('sugerencias')}<h1>Sugerencias del diagnóstico</h1><p>Últimas 100 sugerencias. Solo visibles para administración.</p>${failure ? '<p>No pudimos cargar las sugerencias.</p>' : (data || []).map(r => `<article class="card"><h2>${esc(r.contact?.company_name)}</h2><p>${esc(r.contact?.email)} · ${new Date(r.created_at).toLocaleString('es-CO')}</p><p>${esc(r.message)}</p><p>Etapa: ${esc(r.phase)}</p><label class="field">Estado<select data-feedback-state="${r.id}">${['Nuevo','En revisión','Resuelto'].map(v => `<option ${v === r.status ? 'selected' : ''}>${v}</option>`).join('')}</select></label></article>`).join('') || '<p>Aún no hay sugerencias.</p>'}<p data-diagnostic-error role="alert" hidden></p>`);
    app.querySelectorAll('[data-feedback-state]').forEach(select => select.onchange = async () => { select.disabled = true; const { error: failure } = await supabase.from('digital_diagnostic_feedback').update({ status: select.value }).eq('id', select.dataset.feedbackState); if (failure) error('No se pudo guardar el estado. Recarga para comprobarlo.'); select.disabled = false; });
  }
  function clear() { feedbackDraft = ''; feedbackId = null; current = null; credentials = null; pending = null; storageKey = ''; historyPage = 1; }
  return { view, history, suggestions, clear };
}

