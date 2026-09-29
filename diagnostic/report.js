import { LEVELS } from './model.js?v=1.3.1';
export const escape = (v = '') => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const scoreLabel = score => score === null ? 'Información insuficiente' : `${score.toFixed(1)} / 5 · ${LEVELS[Math.floor(score)]}`;
export function comparison(record) {
  const previous = record.previous;
  if (!previous) return null;
  const sameBusiness = String(previous.contact?.company_name || '').trim().toLocaleLowerCase() === String(record.contact?.company_name || '').trim().toLocaleLowerCase();
  if (previous.result.version !== record.result.version || !sameBusiness) return { compatible: false, rows: [] };
  return { compatible: true, rows: record.result.axes.map(a => {
    const before = previous.result.axes.find(b => b.id === a.id)?.score ?? null;
    return { name: a.name, before, now: a.score, delta: before === null || a.score === null ? null : a.score - before };
  }) };
}
function comparisonHTML(record) {
  const c = comparison(record); if (!c) return '';
  return `<section class="card"><h2>Respecto a tu evaluación anterior</h2><p>${new Date(record.previous.created_at).toLocaleDateString('es-CO')} → ${new Date(record.created_at).toLocaleDateString('es-CO')}</p>${c.compatible ? c.rows.map(r => `<p><strong>${escape(r.name)}</strong><br>${r.before === null ? 'Pendiente' : r.before.toFixed(1)} → ${r.now === null ? 'Pendiente' : r.now.toFixed(1)} · ${r.delta === null ? 'Sin comparación suficiente' : `${r.delta > 0 ? '+' : ''}${r.delta.toFixed(1)} puntos`}</p>`).join('') : '<p>El nombre del negocio o la versión del modelo cambió. No calculamos diferencias automáticamente.</p>'}<p>Las diferencias reflejan respuestas declaradas. Comprueba que el contexto del negocio siga siendo comparable.</p></section>`;
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
  return `<section class="diagnostic-result"><p class="eyebrow">Tu punto de partida · Modelo ${escape(r.version)}</p><h1>Diagnóstico de madurez digital</h1><p class="lead">${escape(record.contact?.company_name || 'Tu negocio')}</p><p>${escape(r.editorial?.summary || record.context || '')}</p>
    <p>Este resultado se basa en la información que compartiste y orienta tus próximos pasos.</p><p class="field-note">Es una autoevaluación orientativa, no una auditoría. La escala va de 0 (No establecido) a 5 (En mejora continua). Cada eje puede tener decimales porque promedia sus dos prácticas.</p>
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
  const ink = rgb(.05, .21, .55), textColor = rgb(.16, .19, .24), muted = rgb(.34, .38, .45);
  const border = rgb(.85, .88, .93), surface = rgb(.97, .98, 1);
  const margin = 44, width = 507, bottom = 52;
  let page, y;
  const normalizePDF = value => String(value ?? '')
    .replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-').replace(/…/g, '...').replace(/•/g, '-').replace(/→/g, 'a');
  const safe = value => Array.from(normalizePDF(value)).map(char => { try { regular.encodeText(char); return char; } catch { return '?'; } }).join('');
  const addPage = () => {
    page = pdf.addPage([595.28, 841.89]); y = 770;
    page.drawText('Jorkcáceres  |  Diagnóstico digital', { x: margin, y: 803, size: 10, font: bold, color: ink });
    page.drawLine({ start: { x: margin, y: 792 }, end: { x: margin + width, y: 792 }, thickness: .6, color: border });
  };
  const wrap = (value, size = 11, strong = false, maxWidth = width) => {
    const font = strong ? bold : regular, words = safe(value).split(/\s+/).filter(Boolean), lines = []; let line = '';
    for (let word of words) {
      while (font.widthOfTextAtSize(word, size) > maxWidth) {
        if (line) { lines.push(line); line = ''; }
        let end = 1;
        while (end < word.length && font.widthOfTextAtSize(word.slice(0, end + 1), size) <= maxWidth) end++;
        lines.push(word.slice(0, end)); word = word.slice(end);
      }
      const next = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth) { if (line) lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const lineHeight = size => size * 1.4;
  const linesHeight = (lines, size) => lines.length * lineHeight(size);
  const ensure = height => { if (y - height < bottom) addPage(); };
  const drawLines = (lines, x, size = 11, strong = false, color = textColor) => {
    const font = strong ? bold : regular;
    for (const line of lines) { page.drawText(line, { x, y, size, font, color }); y -= lineHeight(size); }
  };
  const paragraph = (value, size = 11, strong = false, color = textColor, gap = 8, maxWidth = width, x = margin) => {
    const lines = wrap(value, size, strong, maxWidth); ensure(linesHeight(lines, size) + gap); drawLines(lines, x, size, strong, color); y -= gap;
  };
  const titleHeight = value => linesHeight(wrap(value, 20, true), 20) + 12;
  const title = (value, followingHeight = 0) => {
    const lines = wrap(value, 20, true); ensure(linesHeight(lines, 20) + 12 + followingHeight); drawLines(lines, margin, 20, true, ink); y -= 12;
  };
  const cardRows = (heading, entries) => {
    const rows = [];
    if (heading) wrap(heading, 13, true, width - 28).forEach(line => rows.push({ line, size: 13, strong: true, color: ink }));
    entries.forEach((entry, index) => {
      if (entry.label) wrap(entry.label, 10.5, true, width - 28).forEach(line => rows.push({ line, size: 10.5, strong: true, color: ink }));
      wrap(entry.text || '', 9.6, false, width - 28).forEach(line => rows.push({ line, size: 9.6, strong: false, color: textColor }));
      if (index < entries.length - 1) rows.push({ spacer: true });
    });
    return rows;
  };
  const cardHeight = rows => 24 + rows.reduce((total, row) => total + (row.spacer ? 5 : lineHeight(row.size)), 0) + 12;
  const card = (heading, entries) => {
    const rows = cardRows(heading, entries), height = cardHeight(rows); ensure(height);
    const cardBottom = y - height;
    page.drawRectangle({ x: margin, y: cardBottom, width, height, color: surface, borderColor: border, borderWidth: .8 });
    y -= 16;
    rows.forEach(row => {
      if (row.spacer) { y -= 5; return; }
      page.drawText(row.line, { x: margin + 14, y, size: row.size, font: row.strong ? bold : regular, color: row.color });
      y -= lineHeight(row.size);
    });
    y = cardBottom - 10;
    return height;
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
  const score = value => value === null ? 'Información insuficiente' : value.toFixed(1) + ' / 5 · ' + LEVELS[Math.floor(value)];
  const axisLabels = ['Dirección', 'Presencia', 'Clientes', 'Operación', 'Datos', 'Personas'];
  const drawRadar = () => {
    const cx = 164, cy = y - 134, radius = 76;
    const point = (index, radiusValue) => ({ x: cx + Math.cos(Math.PI / 2 - index * Math.PI / 3) * radiusValue, y: cy + Math.sin(Math.PI / 2 - index * Math.PI / 3) * radiusValue });
    for (let ring = 1; ring <= 5; ring++) for (let index = 0; index < 6; index++) page.drawLine({ start: point(index, radius * ring / 5), end: point((index + 1) % 6, radius * ring / 5), thickness: .5, color: border });
    const values = record.result.axes.map((axis, index) => axis.score === null ? null : point(index, axis.score / 5 * radius));
    if (values.every(Boolean)) values.forEach((item, index) => page.drawLine({ start: item, end: values[(index + 1) % 6], thickness: 2, color: ink }));
    values.filter(Boolean).forEach(item => page.drawCircle({ x: item.x, y: item.y, size: 3.2, color: ink }));
    axisLabels.forEach((label, index) => { const item = point(index, 101); page.drawText(label, { x: item.x - regular.widthOfTextAtSize(label, 8) / 2, y: item.y, size: 8, font: regular, color: muted }); });
  };

  addPage();
  paragraph('TU PUNTO DE PARTIDA · MODELO ' + (record.result.version || ''), 10, true, ink, 5);
  title('Diagnóstico de madurez digital');
  paragraph(record.contact?.company_name || 'Tu negocio', 13, true, textColor, 10);
  paragraph('Este resultado organiza la información que compartiste y orienta próximos pasos prácticos. Es una autoevaluación orientativa, no una auditoría.', 10.5, false, muted, 6);
  paragraph('Escala: 0 No establecido a 5 En mejora continua. Cada eje puede tener decimales porque promedia sus dos prácticas. Los temas sin información suficiente no se califican.', 9.5, false, muted, 12);
  const coverTop = y, coverHeight = 230, leftWidth = 238, gap = 18, rightX = margin + leftWidth + gap, rightWidth = width - leftWidth - gap;
  ensure(coverHeight + 12);
  page.drawRectangle({ x: margin, y: y - coverHeight, width: leftWidth, height: coverHeight, color: surface, borderColor: border, borderWidth: .8 });
  page.drawRectangle({ x: rightX, y: y - coverHeight, width: rightWidth, height: coverHeight, color: surface, borderColor: border, borderWidth: .8 });
  page.drawText('Estado de tus ejes', { x: margin + 14, y: y - 20, size: 13, font: bold, color: ink });
  drawRadar();
  page.drawText(record.result.coverage + ' de 6 ejes con información suficiente', { x: margin + 14, y: y - coverHeight + 17, size: 8.5, font: regular, color: muted });
  page.drawText('Tu perfil digital', { x: rightX + 14, y: y - 20, size: 13, font: bold, color: ink });
  let profileY = y - 42;
  record.result.axes.forEach(axis => {
    page.drawText(axis.name, { x: rightX + 14, y: profileY, size: 8.7, font: bold, color: textColor }); profileY -= 11;
    page.drawText(score(axis.score), { x: rightX + 14, y: profileY, size: 8.3, font: regular, color: muted }); profileY -= 17;
  });
  y = coverTop - coverHeight - 10;
  card('Resumen de tu negocio', [{ text: record.result.editorial?.summary || record.context || 'No se registró una descripción adicional del negocio.' }]);

  addPage();
  const firstAxisHeight = cardHeight(cardRows(record.result.axes[0].name, axisEntries(record.result.axes[0])));
  title('Lo que compartiste', firstAxisHeight);
  record.result.axes.slice(0, 3).forEach(axis => card(axis.name, axisEntries(axis)));

  addPage();
  record.result.axes.slice(3).forEach(axis => card(axis.name, axisEntries(axis)));
  const firstAction = record.result.actions[0];
  if (!firstAction) { title('Tus próximos pasos'); paragraph('Conserva las prácticas que funcionan y completa los temas pendientes antes de priorizar nuevas acciones.'); }
  else {
    const firstActionHeight = cardHeight(cardRows('PRIORIDAD 1 · ' + firstAction.axis, actionEntries(firstAction)));
    if (y - titleHeight('Tus próximos pasos') - firstActionHeight < bottom) addPage();
    title('Tus próximos pasos', firstActionHeight);
    card('PRIORIDAD 1 · ' + firstAction.axis, actionEntries(firstAction));
    record.result.actions.slice(1).forEach((action, index) => card('PRIORIDAD ' + (index + 2) + ' · ' + action.axis, actionEntries(action)));
  }
  paragraph('Guarda este resultado y vuelve a evaluarlo cuando hayas aplicado mejoras. Las comparaciones requieren el mismo negocio y la misma versión del modelo.', 9.5, false, muted, 9);

  const compared = comparison(record);
  if (compared) {
    const changes = compared.compatible ? compared.rows.map(row => ({ label: row.name, text: (row.before === null ? 'Pendiente' : row.before.toFixed(1)) + ' a ' + (row.now === null ? 'Pendiente' : row.now.toFixed(1)) + ' · ' + (row.delta === null ? 'Sin comparación suficiente' : 'Diferencia: ' + (row.delta > 0 ? '+' : '') + row.delta.toFixed(1) + ' puntos') })) : [];
    const changesHeight = compared.compatible ? cardHeight(cardRows('Cambios por eje', changes)) : 60;
    title('Respecto a tu evaluación anterior', changesHeight);
    paragraph('Evaluación anterior: ' + new Date(record.previous.created_at).toLocaleDateString('es-CO'), 9.5, false, muted, 7);
    if (compared.compatible) card('Cambios por eje', changes);
    else paragraph('El negocio o la versión del modelo cambió. Por eso no calculamos diferencias automáticas.');
  }
  paragraph('Referencia del diagnóstico: ' + (record.id || 'Vista de prueba'), 8.5, false, muted, 0);
  const pages = pdf.getPages();
  pages.forEach((item, index) => item.drawText((index + 1) + ' / ' + pages.length + ' · Autoevaluación orientativa', { x: margin, y: 30, size: 9, font: regular, color: muted }));
  return pdf.save();
}
