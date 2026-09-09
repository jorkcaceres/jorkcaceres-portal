// Explicit live smoke test using a temporary server-provisioned QA session.
// Requires output/qa/live-session.json; never uses or reads an OpenAI API key.
import { readFile, writeFile } from 'node:fs/promises';
const credentials = JSON.parse(await readFile('output/qa/live-session.json', 'utf8'));
const invoke = async body => {
  const r = await fetch('https://zfzsigdyycgaqvbauffk.supabase.co/functions/v1/digital-diagnostic', { method: 'POST', headers: { origin: 'https://portal.jorkcaceres.com', apikey: 'sb_publishable_K5khETTDgbkAmAOeiDg2Tw_gKfdxBeq', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...credentials, ...body }), signal: AbortSignal.timeout(65000) });
  const data = await r.json(); if (!r.ok) throw new Error(`${r.status}: ${data.error} (${data.code})`); return data.state;
};
let state = await invoke({ action: 'resume' });
if (state.phase === 'context') state = await invoke({ action: 'message', requestId: crypto.randomUUID(), message: 'Tengo un negocio de repostería por encargo, somos dos personas. Vendemos por WhatsApp e Instagram. Quiero responder a tiempo y dejar de olvidar pedidos.' });
const answers = [
  'Queremos evitar olvidar pedidos. Yo llevo una hoja con prioridades y mi socia revisa conmigo cada viernes; reservamos una hora. No medimos resultados todavía.',
  'Tenemos Instagram con catálogo y un enlace a WhatsApp, lo actualizo yo cada semana. No registramos de dónde vienen los clientes ni medimos conversiones.',
  'Anotamos algunos pedidos en WhatsApp pero a veces olvidamos responder. No tenemos un registro de pendientes. Después de entregar pregunto si les gustó, cuando me acuerdo.',
  'Registro las ventas y gastos todos los días en una hoja. Mi socia revisa cada viernes. Los pedidos están en chats, copiamos a mano y no medimos errores ni tiempos.',
  'Reviso ventas totales en la hoja cada viernes y comparo con la semana anterior. No revisamos la calidad de los datos de forma organizada. Dejé de ofrecer un pastel porque vi que casi no se vendía.',
  'Las dos sabemos usar WhatsApp y la hoja. No tenemos instrucciones ni un plan de continuidad. No hacemos copias de seguridad ni sabemos recuperar las cuentas si perdemos el teléfono.',
];
let steps = 0;
while (state.phase === 'axis' && steps++ < 16) {
  const answer = state.followup ? answers[state.axis] + ' Eso es todo lo que hacemos actualmente; no hay otras revisiones.' : answers[state.axis];
  const before = Date.now();
  state = await invoke({ action: 'message', requestId: crypto.randomUUID(), message: answer });
  console.log(JSON.stringify({ turn: steps, phase: state.phase, nextAxis: state.axis, elapsedMs: Date.now() - before, lastMessage: state.messages.at(-1).content }));
}
if (state.phase === 'review') state = await invoke({ action: 'finish', requestId: crypto.randomUUID() });
await writeFile('output/qa/live-result.json', JSON.stringify(state, null, 2));
console.log(JSON.stringify({ phase: state.phase, coverage: state.result?.coverage, scores: state.result?.axes.map(a => [a.name, a.score]) }));
