import { LEVELS } from './model.js?v=1.4.1';
export const escape = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const scoreLabel = score => score === null ? 'Información insuficiente' : `${score.toFixed(1)} / 5 · ${LEVELS[Math.floor(score)]}`;
export function comparison(record) {
  const previous = record.previous;
  if (!previous) return null;
  const sameBusiness = String(previous.contact?.company_name || '').trim().toLocaleLowerCase() === String(record.contact?.company_name || '').trim().toLocaleLowerCase();
  const sameGuidance = String(previous.result.guidance_version || 'base') === String(record.result.guidance_version || 'base');
  if (previous.result.version !== record.result.version || !sameBusiness || !sameGuidance) return { compatible: false, rows: [] };
  return { compatible: true, rows: record.result.axes.map(a => {
    const before = previous.result.axes.find(b => b.id === a.id)?.score ?? null;
    return { name: a.name, before, now: a.score, delta: before === null || a.score === null ? null : a.score - before };
  }) };
}
function comparisonHTML(record) {
  const c = comparison(record); if (!c) return '';
  return `<section class="card"><h2>Respecto a tu evaluación anterior</h2><p>${new Date(record.previous.created_at).toLocaleDateString('es-CO')} → ${new Date(record.created_at).toLocaleDateString('es-CO')}</p>${c.compatible ? c.rows.map(r => `<p><strong>${escape(r.name)}</strong><br>${r.before === null ? 'Pendiente' : r.before.toFixed(1)} → ${r.now === null ? 'Pendiente' : r.now.toFixed(1)} · ${r.delta === null ? 'Sin comparación suficiente' : `${r.delta > 0 ? '+' : ''}${r.delta.toFixed(1)} puntos`}</p>`).join('') : '<p>El nombre del negocio, la versión del modelo o la guía de decisión cambió. No calculamos diferencias automáticamente.</p>'}<p>Las diferencias reflejan respuestas declaradas. Comprueba que el contexto del negocio siga siendo comparable.</p></section>`;
}
export function radar(result) {
  const point = (i, r) => [220 + Math.cos(-Math.PI / 2 + i * Math.PI / 3) * r, 180 + Math.sin(-Math.PI / 2 + i * Math.PI / 3) * r];
  const polygon = r => Array.from({ length: 6 }, (_, i) => point(i, r).join(',')).join(' ');
  const values = result.axes.map((a, i) => a.score === null ? null : point(i, a.score / 5 * 120));
  const names = ['Dirección', 'Presencia', 'Clientes', 'Operación', 'Datos', 'Personas'];
  return `<svg class="diagnostic-radar" viewBox="0 0 440 360" role="img" aria-label="Perfil de seis ejes. Escala de cero a cinco; valores detallados debajo.">
    ${[1, 2, 3, 4, 5].map(n => `<polygon points="${polygon(n * 24)}" fill="none" stroke="#d9e0ed"/><text x="225" y="${180 - n * 24 + 12}" font-size="10" fill="#536078">${n}</text>`).join('')}
    ${names.map((name, i) => { const p = point(i, 150), q = point(i, 120); return `<line x1="220" y1="180" x2="${q[0]}" y2="${q[1]}" stroke="#d9e0ed"/><text x="${p[0]}" y="${p[1] + 4}" text-anchor="middle" font-size="13" fill="#172a47">${name}</text>`; }).join('')}
    ${values.every(Boolean) ? `<polygon points="${values.map(p => p.join(',')).join(' ')}" fill="#6ba5f244" stroke="#0d378c" stroke-width="3"/>` : ''}
    ${values.map(p => p ? `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="#0d378c"/>` : '').join('')}
    <text x="213" y="195" font-size="10">0</text></svg>`;
}
export function reportHTML(record) {
  const r = record.result;
  return `<section class="diagnostic-result"><h1>Diagnóstico de madurez digital</h1><p class="lead">${escape(record.contact?.company_name || 'Tu negocio')}</p><p>${escape(r.editorial?.summary || record.context || '')}</p>
    <p>Este resultado se basa en la información que compartiste y orienta tus próximos pasos.</p><p class="field-note">Es una autoevaluación orientativa, no una auditoría. La escala va de 0 (No establecido) a 5 (Optimizado). Cada eje puede tener decimales porque promedia sus dos prácticas.</p>
    <div class="diagnostic-result-grid"><div class="card">${radar(r)}<p>${r.coverage} de 6 ejes con información suficiente.${r.coverage < 6 ? ' Los puntos sin datos no se dibujan ni se convierten en cero.' : ''}</p></div>
    <div class="card"><h2>Tu perfil digital</h2>${r.axes.map(a => `<div class="diagnostic-score"><strong>${escape(a.name)}</strong><span>${escape(scoreLabel(a.score))}</span></div>`).join('')}<p>Avanzar significa mejorar prácticas útiles para tu negocio, no comprar más herramientas.</p></div></div>
    ${comparisonHTML(record)}<h2>Lo que compartiste</h2>${r.axes.map(a => `<details class="card"><summary>${escape(a.name)}</summary>${a.criteria.map(c => `<p><strong>${escape(c.name)}${c.name.endsWith('?') ? '' : ':'}</strong> ${escape(r.editorial?.criteria?.[c.id] || c.fact.evidence || 'Necesitamos más información para evaluar esta práctica.')}<br><small>${escape(scoreLabel(c.score))}</small></p>`).join('')}</details>`).join('')}
    <h2>Tus próximos pasos</h2>${r.actions.length ? r.actions.map((a, i) => `<article class="card"><p class="eyebrow">Prioridad ${i + 1} · ${escape(a.axis)}</p><h3>${escape(a.title)}</h3><p>${escape(a.step)}</p><p><strong>Por qué:</strong> ${escape(a.evidence)}</p><p><strong>Cómo darle seguimiento:</strong> ${escape(a.indicator)}</p><p>${escape(a.support)}</p></article>`).join('') : '<p>Conserva las prácticas que funcionan. Si hay temas pendientes, complétalos antes de elegir una mejora.</p>'}
    <p>Guarda este resultado y vuelve a evaluar tus prácticas cuando hayas realizado mejoras. Las comparaciones requieren el mismo contexto y versión del modelo.</p></section>`;
}
export async function makePDF(record) {
  const { PDFDocument, StandardFonts, rgb } = await import('./vendor/pdf-lib.js');
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(.05, .21, .55), textColor = rgb(.16, .19, .24), muted = rgb(.34, .38, .45), pale = rgb(.84, .88, .94);
  const margin = 50, width = 495, bottom = 56;
  let page, y;
  const normalizePDF = value => String(value ?? '').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, '-').replace(/…/g, '...').replace(/•/g, '-').replace(/→/g, 'a');
  const safe = value => Array.from(normalizePDF(value)).map(char => { try { regular.encodeText(char); return char; } catch { return '?'; } }).join('');
  const addPage = () => {
    page = pdf.addPage([595.28, 841.89]); y = 756;
    page.drawText('Jorkcáceres  |  Diagnóstico digital', { x: margin, y: 803, size: 10, font: bold, color: ink });
    page.drawLine({ start: { x: margin, y: 792 }, end: { x: margin + width, y: 792 }, thickness: .6, color: pale });
  };
  const wrap = (value, size = 11, strong = false, maxWidth = width) => {
    const font = strong ? bold : regular, words = safe(value).split(/\s+/).filter(Boolean), lines = []; let line = '';
    for (let word of words) {
      while (font.widthOfTextAtSize(word, size) > maxWidth) {
        if (line) { lines.push(line); line = ''; }
        let end = 1; while (end < word.length && font.widthOfTextAtSize(word.slice(0, end + 1), size) <= maxWidth) end++;
        lines.push(word.slice(0, end)); word = word.slice(end);
      }
      const next = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth) { if (line) lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line); return lines;
  };
  const lineHeight = size => size * 1.42;
  const linesHeight = (lines, size) => lines.length * lineHeight(size);
  const ensure = height => { if (y - height < bottom) addPage(); };
  const drawLines = (lines, x, size = 11, strong = false, color = textColor) => { const font = strong ? bold : regular; lines.forEach(line => { page.drawText(line, { x, y, size, font, color }); y -= lineHeight(size); }); };
  const paragraph = (value, size = 11, strong = false, color = textColor, gap = 8, maxWidth = width, x = margin) => { const lines = wrap(value, size, strong, maxWidth); ensure(linesHeight(lines, size) + gap); drawLines(lines, x, size, strong, color); y -= gap; };
  const rule = (gapBefore = 5, gapAfter = 14) => { ensure(gapBefore + gapAfter + 1); y -= gapBefore; page.drawLine({ start: { x: margin, y }, end: { x: margin + width, y }, thickness: .6, color: pale }); y -= gapAfter; };
  const title = (value, following = 0) => { const lines = wrap(value, 21, true); ensure(linesHeight(lines, 21) + 12 + following); drawLines(lines, margin, 21, true, ink); y -= 12; };
  const subtitle = (value, following = 0) => { const lines = wrap(value, 14, true); ensure(linesHeight(lines, 14) + 8 + following); drawLines(lines, margin, 14, true, ink); y -= 8; };
  const score = value => value === null ? 'Información insuficiente' : value.toFixed(1) + ' / 5 · ' + LEVELS[Math.floor(value)];
  const entryRows = entries => entries.flatMap((entry, index) => {
    const rows = [];
    if (entry.label) wrap(entry.label, 10.4, true).forEach(line => rows.push({ line, size: 10.4, strong: true, color: ink }));
    wrap(entry.text || '', 9.9).forEach(line => rows.push({ line, size: 9.9, strong: false, color: textColor }));
    if (index < entries.length - 1) rows.push({ spacer: true });
    return rows;
  });
  const blockHeight = (heading, entries) => linesHeight(wrap(heading, 14, true), 14) + 8 + entryRows(entries).reduce((sum, row) => sum + (row.spacer ? 7 : lineHeight(row.size)), 0) + 17;
  const textBlock = (heading, entries) => {
    const rows = entryRows(entries), needed = blockHeight(heading, entries); ensure(needed);
    subtitle(heading);
    rows.forEach(row => { if (row.spacer) y -= 7; else { page.drawText(row.line, { x: margin, y, size: row.size, font: row.strong ? bold : regular, color: row.color }); y -= lineHeight(row.size); } });
    rule(1, 13);
  };
  const axisEntries = axis => axis.criteria.map(criterion => ({
    label: criterion.name.endsWith('?') ? criterion.name : criterion.name + ':',
    text: (record.result.editorial?.criteria?.[criterion.id] || criterion.fact.evidence || 'No evaluable con la información compartida.') + '  ' + score(criterion.score)
  }));
  const actionEntries = action => [
    { label: action.title, text: action.step },
    { label: 'Por qué', text: action.evidence || 'Se relaciona con la información compartida.' },
    { label: 'Cómo darle seguimiento', text: action.indicator },
    { text: action.support }
  ];
  const drawRadar = () => {
    const cx = 175, cy = y - 118, radius = 74;
    const point = (index, radiusValue) => ({ x: cx + Math.cos(Math.PI / 2 - index * Math.PI / 3) * radiusValue, y: cy + Math.sin(Math.PI / 2 - index * Math.PI / 3) * radiusValue });
    for (let ring = 1; ring <= 5; ring++) for (let index = 0; index < 6; index++) page.drawLine({ start: point(index, radius * ring / 5), end: point((index + 1) % 6, radius * ring / 5), thickness: .5, color: pale });
    const values = record.result.axes.map((axis, index) => axis.score === null ? null : point(index, axis.score / 5 * radius));
    if (values.every(Boolean)) values.forEach((item, index) => page.drawLine({ start: item, end: values[(index + 1) % 6], thickness: 2, color: ink }));
    values.filter(Boolean).forEach(item => page.drawCircle({ x: item.x, y: item.y, size: 3.1, color: ink }));
    ['Dirección', 'Presencia', 'Clientes', 'Operación', 'Datos', 'Personas'].forEach((label, index) => { const item = point(index, 99); page.drawText(label, { x: item.x - regular.widthOfTextAtSize(label, 7.8) / 2, y: item.y, size: 7.8, font: regular, color: muted }); });
  };

  addPage();
  paragraph('TU PUNTO DE PARTIDA · MODELO ' + (record.result.version || ''), 9.5, true, ink, 5);
  title('Diagnóstico de madurez digital');
  paragraph(record.contact?.company_name || 'Tu negocio', 13.5, true, textColor, 10);
  paragraph('Este resultado organiza la información que compartiste y orienta próximos pasos prácticos. Es una autoevaluación orientativa, no una auditoría.', 10.5, false, muted, 7);
  paragraph('Escala: 0 No establecido a 5 Optimizado. Cada eje puede tener decimales porque promedia sus dos prácticas.', 9.5, false, muted, 16);
  const profileTop = y;
  page.drawText('Estado de tus ejes', { x: margin, y, size: 14, font: bold, color: ink });
  page.drawText('Tu perfil digital', { x: 330, y, size: 14, font: bold, color: ink });
  y -= 14; drawRadar();
  let profileY = profileTop - 30;
  record.result.axes.forEach(axis => {
    page.drawText(axis.name, { x: 330, y: profileY, size: 9.2, font: bold, color: textColor }); profileY -= 11;
    page.drawText(score(axis.score), { x: 330, y: profileY, size: 8.8, font: regular, color: muted }); profileY -= 16;
  });
  y = profileTop - 224; rule(0, 13);
  subtitle('Resumen de tu negocio');
  paragraph(record.result.editorial?.summary || record.context || 'No se registró una descripción adicional del negocio.', 10.4, false, textColor, 0);

  addPage();
  const firstAxis = record.result.axes[0];
  title('Lo que compartiste', blockHeight(firstAxis.name, axisEntries(firstAxis)));
  record.result.axes.slice(0, 3).forEach(axis => textBlock(axis.name, axisEntries(axis)));

  addPage();
  record.result.axes.slice(3).forEach(axis => textBlock(axis.name, axisEntries(axis)));
  const firstAction = record.result.actions[0];
  if (!firstAction) { title('Tus próximos pasos'); paragraph('Conserva las prácticas que funcionan y completa los temas pendientes antes de priorizar nuevas acciones.'); }
  else {
    const firstNeeded = blockHeight('PRIORIDAD 1 · ' + firstAction.axis, actionEntries(firstAction));
    if (y - linesHeight(wrap('Tus próximos pasos', 21, true), 21) - firstNeeded < bottom) addPage();
    title('Tus próximos pasos', firstNeeded);
    textBlock('PRIORIDAD 1 · ' + firstAction.axis, actionEntries(firstAction));
    record.result.actions.slice(1).forEach((action, index) => textBlock('PRIORIDAD ' + (index + 2) + ' · ' + action.axis, actionEntries(action)));
  }
  paragraph('Guarda este resultado y vuelve a evaluarlo cuando hayas aplicado mejoras. Las comparaciones requieren el mismo negocio y la misma versión del modelo.', 9.5, false, muted, 10);
  const compared = comparison(record);
  if (compared) {
    const changes = compared.compatible ? compared.rows.map(row => ({ label: row.name, text: (row.before === null ? 'Pendiente' : row.before.toFixed(1)) + ' a ' + (row.now === null ? 'Pendiente' : row.now.toFixed(1)) + ' · ' + (row.delta === null ? 'Sin comparación suficiente' : 'Diferencia: ' + (row.delta > 0 ? '+' : '') + row.delta.toFixed(1) + ' puntos') })) : [];
    const changesHeight = compared.compatible ? blockHeight('Cambios por eje', changes) : 70;
    title('Respecto a tu evaluación anterior', changesHeight);
    paragraph('Evaluación anterior: ' + new Date(record.previous.created_at).toLocaleDateString('es-CO'), 9.5, false, muted, 7);
    if (compared.compatible) textBlock('Cambios por eje', changes); else paragraph('El negocio, la versión del modelo o la guía de decisión cambió. Por eso no calculamos diferencias automáticas.');
  }
  paragraph('Referencia del diagnóstico: ' + (record.id || 'Vista de prueba'), 8.5, false, muted, 0);
  const pages = pdf.getPages();
  pages.forEach((item, index) => item.drawText((index + 1) + ' / ' + pages.length + ' · Autoevaluación orientativa', { x: margin, y: 30, size: 9, font: regular, color: muted }));
  return pdf.save();
}
