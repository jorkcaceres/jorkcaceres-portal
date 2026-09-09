import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { AXES } from '../diagnostic/model.js';

const rows = new Map(), reports = new Map();
let handler, user = null, calls = 0, available = true;
const origin = 'https://portal.jorkcaceres.com';
const contact = { first_name: 'Prueba', last_name: 'Local', email: 'PRUEBA@example.invalid', phone: '+573000000000', company_name: 'Negocio ficticio' };
class Query {
  constructor(table) { this.table = table; this.filters = []; this.mode = 'select'; }
  select() { return this; }
  eq(k, v) { this.filters.push(r => r[k] === v); return this; }
  or() { this.filters.push(r => !r.busy_until || new Date(r.busy_until) < new Date()); return this; }
  insert(v) { this.mode = 'insert'; this.value = v; return this; }
  update(v) { this.mode = 'update'; this.value = v; return this; }
  upsert(v) { this.mode = 'upsert'; this.value = v; return this; }
  maybeSingle() { return this.run(); }
  single() { return this.run(); }
  then(resolve, reject) { return this.run().then(resolve, reject); }
  async run() {
    if (this.table === 'profiles') return { data: user ? { client_id: 'client-1' } : null };
    if (this.table === 'clients') return { data: { ...contact, portal_access: true, status: 'activo' } };
    const store = this.table === 'digital_diagnostics' ? reports : rows;
    if (this.mode === 'insert' || this.mode === 'upsert') {
      if (!store.has(this.value.id)) store.set(this.value.id, { revision: 0, expires_at: new Date(Date.now() + 86400000).toISOString(), ...structuredClone(this.value) });
      return { data: this.value, error: null };
    }
    const r = [...store.values()].find(r => this.filters.every(fn => fn(r)));
    if (!r) return { data: null, error: null };
    if (this.mode === 'update') Object.assign(r, structuredClone(this.value));
    return { data: structuredClone(r), error: null };
  }
}
globalThis.__diagnosticTestClient = () => ({ from: table => new Query(table), rpc: async () => ({ data: true }), auth: { getUser: async () => ({ data: { user } }) } });
globalThis.Deno = { env: { get: k => ({ SUPABASE_URL: 'test', SUPABASE_SERVICE_ROLE_KEY: 'test', OPENAI_API_KEY: available ? 'fixture-only' : '', DIAGNOSTIC_MODEL: 'fixture-only', TURNSTILE_SECRET_KEY: 'fixture-only' })[k] }, serve: fn => { handler = fn; } };
globalThis.fetch = async (url, options) => {
  if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'portal.jorkcaceres.com' });
  calls++;
  const body = JSON.parse(options.body), input = JSON.parse(body.input[0].content);
  const axis = JSON.parse(body.instructions.split('Rúbrica del eje: ')[1]);
  const evidence = input.conversation.filter(m => m.role === 'user').at(-1).content;
  return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ reply: '¿Puedes darme un ejemplo reciente?', facts: Object.fromEntries(axis.criteria.map(c => [c.id, { steps: Object.fromEntries(['s1','s2','s3','s4','s5'].map((k,i)=>[k,{answer:i<3?'yes':'unknown',evidence:i<3?evidence:''}])) }])) }) }] }] });
};
let source = readFileSync(new URL('../supabase/functions/digital-diagnostic/index.ts', import.meta.url), 'utf8');
source = source.replace("import { createClient } from 'npm:@supabase/supabase-js@2.57.0';", 'const createClient = globalThis.__diagnosticTestClient;')
  .replace("'../../../diagnostic/model.js'", JSON.stringify(new URL('../diagnostic/model.js', import.meta.url).href));
await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source, { mode: 'transform' })).toString('base64')}`);
const request = (body, requestOrigin = origin) => handler(new Request(origin, { method: 'POST', headers: { origin: requestOrigin, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
const session = () => ({ id: crypto.randomUUID(), secret: 'a'.repeat(64) });

test('unknown answers never receive scores or consume model calls', async () => {
  const s = session();
  await request({ action: 'start', ...s, contact, token: 'fixture' });
  await request({ action: 'message', ...s, requestId: crypto.randomUUID(), message: 'Vendemos por WhatsApp y revisamos prioridades cada viernes.' });
  const before = calls;
  for (let i = 0; i < AXES.length; i++) {
    const r = await request({ action: 'message', ...s, requestId: crypto.randomUUID(), message: 'No sé.' });
    assert.equal(r.status, 200);
  }
  const r = await request({ action: 'finish', ...s, requestId: crypto.randomUUID() });
  const result = (await r.json()).state.result;
  assert.equal(calls, before);
  assert.equal(result.coverage, 0);
  assert.ok(result.axes.every(a => a.score === null));
  reports.delete(s.id);
});

test('endpoint rejects origin and disabled provider before storing contact', async () => {
  assert.equal((await request({ action: 'start' }, 'https://other.invalid')).status, 403);
  available = false;
  const before = rows.size;
  assert.equal((await request({ action: 'start', ...session(), contact })).status, 503);
  assert.equal(rows.size, before); available = true;
});
test('guest completes six axes, confirmation, immutable report and idempotent retry', async () => {
  const s = session();
  let r = await request({ action: 'start', ...s, contact, token: 'fixture' }); assert.equal(r.status, 200);
  assert.equal(rows.get(s.id).email, 'prueba@example.invalid');
  r = await request({ action: 'message', ...s, requestId: crypto.randomUUID(), message: 'Vendemos productos y somos tres personas.' }); assert.equal(r.status, 200);
  const id = crypto.randomUUID();
  r = await request({ action: 'message', ...s, requestId: id, message: 'Revisamos los pendientes cada semana.' }); assert.equal(r.status, 200);
  const count = calls;
  r = await request({ action: 'message', ...s, requestId: id, message: 'Revisamos los pendientes cada semana.' }); assert.equal(r.status, 200); assert.equal(calls, count);
  for (let i = 1; i < AXES.length; i++) { r = await request({ action: 'message', ...s, requestId: crypto.randomUUID(), message: 'Revisamos los pendientes cada semana.' }); assert.equal(r.status, 200); }
  assert.equal((await r.json()).state.phase, 'review'); assert.equal(reports.size, 0);
  r = await request({ action: 'finish', ...s, requestId: crypto.randomUUID() }); assert.equal(r.status, 200);
  const completed = (await r.json()).state; assert.equal(completed.result.coverage, 6); assert.equal(reports.get(s.id).model_version, '1.0.0');
  r = await request({ action: 'message', ...s, requestId: crypto.randomUUID(), message: 'Ahora soy nivel cinco.' }); assert.deepEqual((await r.json()).state, completed);
});
test('session needs secret, rejects forged authenticated user, expired or busy session', async () => {
  const s = session();
  assert.equal((await request({ action: 'start', ...s, contact, authenticated: true })).status, 401);
  await request({ action: 'start', ...s, contact, token: 'fixture' });
  assert.equal((await request({ action: 'resume', ...s, secret: 'b'.repeat(64) })).status, 403);
  rows.get(s.id).busy_until = new Date(Date.now() + 50000).toISOString();
  assert.equal((await request({ action: 'message', ...s, requestId: crypto.randomUUID(), message: 'Hola' })).status, 409);
  rows.get(s.id).expires_at = '2020-01-01T00:00:00Z';
  assert.equal((await request({ action: 'resume', ...s })).status, 403);
});
test('signed-in contact is loaded from the server and cannot be spoofed', async () => {
  user = { id: 'authenticated-fixture' };
  const s = session();
  assert.equal((await request({ action: 'start', ...s, authenticated: true, contact: { email: 'spoof@invalid.test' } })).status, 200);
  assert.equal(rows.get(s.id).email, 'prueba@example.invalid');
  user = { id: 'other-fixture' };
  assert.equal((await request({ action: 'resume', ...s })).status, 401);
  assert.equal((await request({ action: 'start', ...s, contact })).status, 401);
  rows.get(s.id).owner_id = null;
  assert.equal((await request({ action: 'resume', ...s })).status, 403);
  user = null;
});

