// Local UI integration tests. Provider and database are mocked; no customer data or API spend.
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.DIAGNOSTIC_PLAYWRIGHT || 'playwright');
const root = resolve('.');
const server = createServer(async (req, res) => {
  const path = resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!path.startsWith(root + '\\') && !path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
  try { const contents = await readFile(path); res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.png': 'image/png' })[extname(path)] || 'application/octet-stream'); res.end(contents); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}`;
await mkdir('output/qa', { recursive: true });
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1365, height: 1000 } });
    await context.addInitScript(() => { window.turnstile = { render: (_, opts) => { setTimeout(() => opts.callback('fixture'), 0); return 1; }, remove() {}, reset() {} }; });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    const stub = `import {AXES,evaluate} from '${url}/diagnostic/model.js';
      let s=null, saved=[];
      const observed=()=>({status:'observed',evidence:'Revisamos las ventas cada semana.',steps:['Revisamos las ventas cada semana.','Revisamos las ventas cada semana.','Revisamos las ventas cada semana.','','']});
      export function createClient(){return {
      auth:{onAuthStateChange(){},getSession:async()=>({data:{session:window.__signed?{user:{id:'fixture-user',email:'fixture@example.invalid'}}:null}})},
      from:table=>{const q={select(){return q},eq(){return q},order(){return q},range(){return q},maybeSingle:async()=>({data:table==='profiles'?{role:'client',client_id:'fixture-client'}:null}),then:resolve=>resolve({data:saved,count:saved.length})};return q},
      functions:{invoke:async(name,{body:b})=>{
        if(window.__failNext){window.__failNext=false;return {error:new Error('Fixture offline')}};
        if(b.action==='start') s={phase:'context',facts:{},axis:0,revisions:0,context:'',messages:[{role:'assistant',content:'Cuéntame qué hace tu negocio.'}]};
        if(b.action==='message'){s.messages.push({role:'user',content:b.message});if(s.phase==='context'){s.context=b.message;s.phase='axis'}else{AXES[s.axis].criteria.forEach(c=>s.facts[c.id]=observed());s.axis++;if(s.axis===6)s.phase='review'}s.messages.push({role:'assistant',content:s.phase==='review'?'Revisa lo que entendí.':AXES[s.axis].question})}
        if(b.action==='finish'){s.phase='done';s.result=evaluate(s.facts);s.contact={company_name:'Negocio de prueba'};saved=[{id:b.id,result:s.result,contact:s.contact,context:s.context,created_at:new Date().toISOString(),model_version:'1.0.0'}]}
        return {data:{state:s}};
      }}}}`;
    await page.route('https://esm.sh/**', route => route.fulfill({ contentType: 'text/javascript', body: stub, headers: { 'Access-Control-Allow-Origin': '*' } }));
    await page.goto(url + '/index.html#diagnostico');
    await page.getByLabel('Nombre', { exact: true }).fill('Prueba');
    assert.equal(await page.locator('[data-diagnostic-start] input').count(), 5);
    await page.getByLabel('Apellido', { exact: true }).fill('Local');
    await page.getByLabel('Correo electrónico', { exact: true }).fill('fixture@example.invalid');
    await page.getByLabel('Teléfono con WhatsApp').fill('+573000000000');
    await page.getByLabel('Empresa / negocio').fill('Negocio de prueba');
    await page.screenshot({ path: `output/qa/entry-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
    await page.getByRole('button', { name: 'Comenzar conversación' }).click();
    await page.getByLabel('Tu respuesta', { exact: true }).fill('Vendemos productos y somos tres personas.');
    await page.getByRole('button', { name: 'Enviar respuesta' }).click();
    await page.getByLabel('Tu respuesta', { exact: true }).fill('Revisamos las ventas cada semana.');
    await page.evaluate(() => window.__failNext = true);
    await page.getByRole('button', { name: 'Enviar respuesta' }).click();
    await page.locator('[data-diagnostic-error]:not([hidden])').waitFor();
    assert.equal(await page.locator('textarea').inputValue(), 'Revisamos las ventas cada semana.');
    await page.screenshot({ path: `output/qa/chat-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
    for (let i = 0; i < 6; i++) {
      await page.getByLabel('Tu respuesta', { exact: true }).fill('Revisamos las ventas cada semana.');
      await page.getByRole('button', { name: 'Enviar respuesta' }).click();
    }
    await page.getByRole('button', { name: 'Confirmar y generar diagnóstico' }).click();
    await page.getByRole('heading', { name: 'Diagnóstico de madurez digital', exact: true }).waitFor();
    assert.equal(await page.locator('.diagnostic-score').count(), 6);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
    await page.screenshot({ path: `output/qa/report-${mobile ? 'mobile' : 'desktop'}.png`, fullPage: true });
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar PDF' }).click();
    const download = await downloadPromise; await download.saveAs(`output/qa/report-${mobile ? 'mobile' : 'desktop'}.pdf`);
    await page.addInitScript(() => window.__signed = true);
    await page.goto(url + '/index.html#diagnostico');
    await page.reload();
    await page.getByRole('button', { name: 'Comenzar conversación' }).waitFor();
    assert.equal(await page.locator('[data-diagnostic-start] input').count(), 0);
    await page.getByRole('link', { name: 'Consultar mi historial' }).click();
    await page.getByRole('heading', { name: 'Mi historial digital', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log(`UI ${mobile ? 'mobile' : 'desktop'}: five fields, authenticated entry, chat retry, review, result, PDF and empty history passed`);
    await context.close();
  }
} finally { await browser.close(); server.close(); }
