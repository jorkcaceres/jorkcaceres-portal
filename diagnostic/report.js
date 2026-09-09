import { LEVELS } from './model.js?v=1.1.0';
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
    <p>Este resultado se basa en la información que compartiste y orienta tus próximos pasos.</p>
    <div class="diagnostic-result-grid"><div class="card">${radar(r)}<p>${r.coverage} de 6 ejes con información suficiente.${r.coverage < 6 ? ' Los puntos sin datos no se dibujan ni se convierten en cero.' : ''}</p></div>
    <div class="card"><h2>Tu perfil digital</h2>${r.axes.map(a => `<div class="diagnostic-score"><strong>${escape(a.name)}</strong><span>${escape(scoreLabel(a.score))}</span></div>`).join('')}<p>Avanzar significa mejorar prácticas útiles para tu negocio, no comprar más herramientas.</p></div></div>
    ${comparisonHTML(record)}<h2>Lo que compartiste</h2>${r.axes.map(a => `<details class="card"><summary>${escape(a.name)}</summary>${a.criteria.map(c => `<p><strong>${escape(c.name)}${c.name.endsWith('?') ? '' : ':'}</strong> ${escape(r.editorial?.criteria?.[c.id] || c.fact.evidence || 'Necesitamos más información para evaluar esta práctica.')}<br><small>${escape(scoreLabel(c.score))}</small></p>`).join('')}</details>`).join('')}
    <h2>Tus próximos pasos</h2>${r.actions.length ? r.actions.map((a, i) => `<article class="card"><p class="eyebrow">Prioridad ${i + 1} · ${escape(a.axis)}</p><h3>${escape(a.title)}</h3><p>${escape(a.step)}</p><p><strong>Por qué:</strong> ${escape(a.evidence)}</p><p><strong>Cómo seguir el avance:</strong> ${escape(a.indicator)}</p><p>${escape(a.support)}</p></article>`).join('') : '<p>Conserva las prácticas que funcionan. Si hay temas pendientes, complétalos antes de elegir una mejora.</p>'}
    <p>Guarda este resultado y vuelve a evaluar tus prácticas cuando hayas realizado mejoras. Las comparaciones requieren el mismo contexto y versión del modelo.</p></section>`;
}
export async function makePDF(record) {
  const { PDFDocument, StandardFonts, rgb } = await import('./vendor/pdf-lib.js');
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica), bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(.05, .21, .55), gray = rgb(.28, .32, .38);
  let page, y;
  const safe = value => Array.from(String(value ?? '')).map(c => { try { regular.encodeText(c); return c; } catch { return ' '; } }).join('');
  const newPage = () => { page = pdf.addPage([595.28, 841.89]); y = 770; page.drawText('Jorkcáceres | Diagnóstico digital', { x: 44, y: 803, font: bold, size: 10, color: ink }); };
  const text = (value, size = 11, strong = false) => {
    const font = strong ? bold : regular, maxWidth = 507;
    const words = safe(value).split(/\s+/), lines = []; let line = '';
    for (let word of words) {
      while (font.widthOfTextAtSize(word, size) > maxWidth) {
        if (line) { lines.push(line); line = ''; }
        let end = 1; while (end < word.length && font.widthOfTextAtSize(word.slice(0, end + 1), size) <= maxWidth) end++;
        lines.push(word.slice(0, end)); word = word.slice(end);
      }
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) > maxWidth) { lines.push(line); line = word; } else line = next;
    }
    if (line) lines.push(line);
    for (const l of lines) { if (y < 62) newPage(); page.drawText(l, { x: 44, y, font, size, color: strong ? ink : gray }); y -= size * 1.45; }
    y -= 7;
  };
  newPage(); text('Diagnóstico de madurez digital', 24, true); text(record.contact?.company_name || 'Tu negocio', 16, true);
  text(`Fecha: ${new Date(record.created_at || Date.now()).toLocaleDateString('es-CO')} | Modelo ${record.result.version}`);
  text('Este resultado se basa en la información que compartiste y orienta tus próximos pasos.');
  // Vector radar: the same six scores used by screen and history, never filling missing scores.
  const cx = 295, cy = y - 130, radius = 106;
  const pt = (i, r) => ({ x: cx + Math.cos(Math.PI / 2 - i * Math.PI / 3) * r, y: cy + Math.sin(Math.PI / 2 - i * Math.PI / 3) * r });
  for (let n = 1; n <= 5; n++) {
    for (let i = 0; i < 6; i++) page.drawLine({ start: pt(i, radius * n / 5), end: pt((i + 1) % 6, radius * n / 5), thickness: .5, color: rgb(.8, .84, .9) });
    page.drawText(String(n), { x: cx + 4, y: cy + radius * n / 5 - 10, size: 8, font: regular });
  }
  const names = ['Dirección', 'Presencia', 'Clientes', 'Operación', 'Datos', 'Personas'];
  const points = record.result.axes.map((a, i) => a.score === null ? null : pt(i, a.score / 5 * radius));
  names.forEach((n, i) => { const p = pt(i, 130); page.drawText(n, { x: p.x - regular.widthOfTextAtSize(n, 10) / 2, y: p.y, size: 10, font: regular }); });
  if (points.every(Boolean)) points.forEach((p, i) => page.drawLine({ start: p, end: points[(i + 1) % 6], thickness: 2, color: ink }));
  points.filter(Boolean).forEach(p => page.drawCircle({ x: p.x, y: p.y, size: 3, color: ink }));
  page.drawText('0', { x: cx + 4, y: cy - 10, font: regular, size: 8 });
  y = cy - 160;
  text(`${record.result.coverage} de 6 ejes con información suficiente. Los ejes sin datos no se califican.`);
  record.result.axes.forEach(a => text(`${a.name}: ${scoreLabel(a.score)}`, 11));
  newPage(); text('Lo que entendimos de tu negocio', 20, true); text(record.result.editorial?.summary || record.context || '');
  record.result.axes.forEach(a => { if (y < 180) newPage(); text(a.name, 14, true); a.criteria.forEach(c => text(`${c.name}${c.name.endsWith('?') ? '' : ':'} ${record.result.editorial?.criteria?.[c.id] || c.fact.evidence || 'Información insuficiente.'} (${scoreLabel(c.score)})`)); });
  newPage(); text('Tus próximos pasos', 20, true);
  if (!record.result.actions.length) text('Conserva las prácticas que funcionan y completa los temas pendientes antes de priorizar nuevas acciones.');
  record.result.actions.forEach((a, i) => { text(`${i + 1}. ${a.title}`, 14, true); text(a.step); text(`Por qué: ${a.evidence}`); text(`Cómo seguir el avance: ${a.indicator}`); text(a.support); });
  text('¿Quieres conversar sobre tu resultado?', 15, true); text('WhatsApp: +57 324 306 2809 | Correo: ceo@jorkcaceres.com');
  text(`Referencia del diagnóstico: ${record.id || 'Vista de prueba'}`, 9);
  const compared = comparison(record);
  if (compared) { newPage(); text('Respecto a tu evaluación anterior', 20, true); text(`Evaluación anterior: ${new Date(record.previous.created_at).toLocaleDateString('es-CO')}`);
    if (compared.compatible) compared.rows.forEach(r => text(`${r.name}: ${r.before === null ? 'Pendiente' : r.before.toFixed(1)} a ${r.now === null ? 'Pendiente' : r.now.toFixed(1)}. ${r.delta === null ? 'Sin comparación suficiente' : `Diferencia: ${r.delta > 0 ? '+' : ''}${r.delta.toFixed(1)} puntos`}`));
    else text('El negocio o la versión del modelo cambió. No calculamos diferencias automáticamente.');
    text('Las diferencias reflejan respuestas declaradas. Comprueba que el contexto del negocio siga siendo comparable.');
  }
  const pages = pdf.getPages(); pages.forEach((p, i) => p.drawText(`${i + 1} / ${pages.length} | Autoevaluación orientativa`, { x: 44, y: 30, font: regular, size: 9, color: gray }));
  return pdf.save();
}

