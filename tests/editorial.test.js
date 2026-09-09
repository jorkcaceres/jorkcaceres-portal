import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateEditorial } from '../diagnostic/editorial.js';
import { AXES, evaluate } from '../diagnostic/model.js';
const messages = [{role:'user',content:'Tengo un CRM propio y trabajo solo. Reviso las ventas cada semana.'}];
const result = evaluate();
const grounded = {text:'Trabajas por tu cuenta y utilizas un CRM propio.',quotes:['Tengo un CRM propio y trabajo solo.']};
const draft = () => ({summary:structuredClone(grounded),criteria:Object.fromEntries(AXES.flatMap(a=>a.criteria.map(c=>[c.id,structuredClone(grounded)]))),actions:{}});
test('editorial preserves source evidence without altering the score result',()=>{
  const before=structuredClone(result), text=validateEditorial(draft(),messages,result);
  assert.equal(text.summary,grounded.text); assert.deepEqual(result,before);
});
test('invented quotes and numerical facts cannot enter the report',()=>{
  const d=draft();d.summary.quotes=['Tenemos cinco empleados.'];assert.throws(()=>validateEditorial(d,messages,result));
  d.summary.quotes=grounded.quotes;d.summary.text='El negocio tiene 5 empleados.';assert.throws(()=>validateEditorial(d,messages,result));
});
test('declared acquisition goal guides recommendations without changing scores',()=>{
  const facts=Object.fromEntries(AXES.flatMap(a=>a.criteria.map(c=>[c.id,{status:'observed',evidence:'Práctica declarada.',steps:['Práctica declarada.']}])));
  const a=evaluate(facts),b=evaluate(facts,'Quiero captar clientes potenciales');
  assert.deepEqual(a.axes,b.axes);assert.equal(b.actions[0].axis,'Presencia y captación');
  facts.protection={status:'absent',evidence:'No protegemos las cuentas.'};
  assert.equal(evaluate(facts,'Quiero captar clientes potenciales').actions[0].axis,'Personas y cuidado digital');
});

