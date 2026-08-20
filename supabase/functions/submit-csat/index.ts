import { createClient } from 'npm:@supabase/supabase-js@2.57.0'

const origin = 'https://portal.jorkcaceres.com'
const corsHeaders = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function text(value: unknown, limit = 0) {
  const result = String(value ?? '').trim()
  return limit ? result.slice(0, limit) : result
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)
  if (request.headers.get('origin') !== origin) return json({ error: 'Origen no autorizado.' }, 403)

  try {
    const body = await request.json()
    const token = text(body.token, 4096)
    const email = text(body.email, 254).toLowerCase()
    const satisfaction = Number(body.satisfaction)
    const expectation = text(body.expectation, 32)
    const returnIntent = text(body.return_intent, 32)
    const improvement = text(body.improvement, 2000) || null
    const validExpectations = new Set(['completamente', 'gran_parte', 'parcialmente', 'no'])
    const validReturnIntentions = new Set(['si', 'tal_vez', 'no'])

    if (!token || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Number.isInteger(satisfaction) || satisfaction < 1 || satisfaction > 5 || !validExpectations.has(expectation) || !validReturnIntentions.has(returnIntent)) {
      return json({ error: 'Verifica los datos requeridos de la encuesta.' }, 400)
    }

    const verification = new FormData()
    verification.append('secret', Deno.env.get('TURNSTILE_SECRET_KEY') ?? '')
    verification.append('response', token)
    const remoteIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (remoteIp) verification.append('remoteip', remoteIp)
    const challenge = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: verification })
    const result = await challenge.json()
    if (!result.success || result.hostname !== 'portal.jorkcaceres.com') return json({ error: 'No fue posible validar la verificación de seguridad. Inténtalo nuevamente.' }, 403)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const { error } = await supabase.from('csat_responses').insert({ email, satisfaction, expectation, return_intent: returnIntent, improvement })
    if (error) return json({ error: 'No fue posible registrar la encuesta.' }, 500)
    return json({ ok: true })
  } catch {
    return json({ error: 'No fue posible procesar la encuesta.' }, 400)
  }
})

