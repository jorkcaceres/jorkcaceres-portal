import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AXES, evaluate, scoreCriterion } from '../diagnostic/model.js';
import { reportHTML, radar, makePDF, comparison } from '../diagnostic/report.js';

const observed = n => ({ status: 'observed', evidence: 'Revisamos los pendientes cada semana.', steps: Array.from({ length: 5 }, (_, i) => i < n ? 'Revisamos los pendientes cada semana.' : '') });
test('unknown and missing never become zero', () => {
  assert.equal(scoreCriterion(), null);
  assert.equal(scoreCriterion({ status: 'unknown' }), null);
  assert.equal(evaluate().coverage, 0);
  assert.equal(evaluate().actions.length, 0);
});
test('zero requires an explicit absence with evidence', () => {
  assert.equal(scoreCriterion({ status: 'absent', evidence: '' }), null);
  assert.equal(scoreCriterion({ status: 'absent', evidence: 'No llevo registros.' }), 0);
});
test('levels must be contiguous, never skip prerequisites', () => {
  assert.equal(scoreCriterion({ status: 'observed', evidence: 'Uso una hoja', steps: ['Uso una hoja', '', 'Soy avanzado'] }), 1);
  for (let n = 1; n <= 5; n++) assert.equal(scoreCriterion(observed(n)), n);
});
test('axis needs both applicable criteria; not applicable is excluded', () => {
  const facts = { priorities: observed(3) };
  assert.equal(evaluate(facts).axes[0].score, null);
  facts.followup = observed(2);
  assert.equal(evaluate(facts).axes[0].score, 2.5);
  facts.followup = { status: 'not_applicable', evidence: 'No aplica' };
  assert.equal(evaluate(facts).axes[0].score, 3);
});
test('deterministic scoring and top-three priorities', () => {
  const facts = Object.fromEntries(AXES.flatMap(a => a.criteria.map(c => [c.id, observed(2)])));
  const a = evaluate(facts), b = evaluate(structuredClone(facts));
  assert.deepEqual(a, b); assert.equal(a.coverage, 6); assert.equal(a.actions.length, 3);
});
test('partial radar has no fictitious connected polygon', () => {
  const html = radar(evaluate({ priorities: observed(1), followup: observed(1) }));
  assert.equal((html.match(/<circle/g) || []).length, 1);
  assert.ok(!html.includes('fill="#6ba5f244"'));
});
test('report escapes untrusted contact and evidence', () => {
  const html = reportHTML({ contact: { company_name: '<img onerror=alert(1)>' }, context: '<script>bad()</script>', result: evaluate() });
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'));
});
test('history comparison excludes missing scores and incompatible models', () => {
  const previous = { contact: { company_name: 'Prueba' }, result: evaluate({ priorities: observed(1), followup: observed(1) }) };
  const record = { contact: { company_name: 'Prueba' }, result: evaluate({ priorities: observed(3), followup: observed(3) }), previous };
  assert.equal(comparison(record).rows[0].delta, 2);
  assert.equal(comparison(record).rows[1].delta, null);
  previous.result.version = '0.1'; assert.equal(comparison(record).compatible, false);
});
test('PDF generator handles Spanish, long words and missing scores', async () => {
  const bytes = await makePDF({ contact: { company_name: 'Empresa de prueba áéíóú ñ 🚀' }, context: 'x'.repeat(1600), result: evaluate() });
  assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), '%PDF-');
});
