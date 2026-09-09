// Evidence remains stored separately. Editorial text never changes scores or service scope.
export const EDITORIAL_VERSION = '1.1.0';
export const EXPLANATIONS = {
  priorities: '¿Tienes claro qué mejorar primero?', followup: '¿Compruebas si las mejoras funcionan?',
  channels: '¿Pueden encontrarte y contactarte?', acquisition: '¿Sabes qué canales generan oportunidades?',
  pipeline: '¿Das seguimiento a cada oportunidad?', relationship: '¿Mantienes la relación después del servicio?',
  records: '¿Mantienes tus registros al día?', workflow: '¿Tienes una forma de trabajo repetible?',
  quality: '¿Puedes confiar en tus datos?', decisions: '¿Usas tus indicadores para decidir?',
  skills: '¿Puedes mantener el negocio funcionando?', protection: '¿Puedes recuperar tus cuentas e información?',
};
const obj = properties => ({ type: 'object', additionalProperties: false, required: Object.keys(properties), properties });
const str = maxLength => ({ type: 'string', maxLength });
const grounded = obj({ text: str(600), quotes: { type: 'array', minItems: 0, maxItems: 5, items: str(240) } });
export function editorialSchema(result) {
  return obj({ summary: grounded,
    criteria: obj(Object.fromEntries(result.axes.flatMap(a => a.criteria.map(c => [c.id, grounded])))),
    actions: obj(Object.fromEntries(result.actions.map(a => [a.axis, obj({ title: str(90), step: str(500), why: grounded, indicator: str(300) })]))),
  });
}
export function validateEditorial(data, messages, result) {
  const sources = messages.filter(m => m.role === 'user').map(m => m.content);
  const validate = block => {
    if (!block || typeof block.text !== 'string' || !block.text.trim() || block.text.length > 600 || !Array.isArray(block.quotes) || !block.quotes.length || block.quotes.some(q => typeof q !== 'string' || !q.trim() || !sources.some(s => s.includes(q)))) throw new Error('La explicación necesita respaldo en la conversación.');
    // No new numerical facts in summaries. Proposed schedules live in step/indicator.
    const evidence = block.quotes.join(' ');
    if ((block.text.match(/\d+(?:[.,]\d+)*/g) || []).some(n => !evidence.includes(n))) throw new Error('La explicación contiene cifras sin respaldo.');
    return block.text.trim();
  };
  const summary = validate(data.summary), criteria = {};
  for (const a of result.axes) for (const c of a.criteria) criteria[c.id] = c.fact.status === 'unknown' ? 'Falta información para evaluar esta práctica.' : validate(data.criteria?.[c.id]);
  const actions = result.actions.map((a, i) => {
    const draft = data.actions?.[a.axis];
    if (!draft || ['title','step','indicator'].some(k => typeof draft[k] !== 'string' || !draft[k].trim() || draft[k].length > 500)) throw new Error('La recomendación está incompleta.');
    return { ...a, title: draft.title, step: draft.step, evidence: validate(draft.why), indicator: draft.indicator };
  });
  return { version: EDITORIAL_VERSION, summary, criteria, actions, evidence: data };
}

