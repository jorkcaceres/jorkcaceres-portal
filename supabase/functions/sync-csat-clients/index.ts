import { withSupabase } from 'npm:@supabase/server@^1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://portal-qa.jorkcaceres.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function normalizedEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders })
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

    const { data: profile, error: profileError } = await ctx.supabase
      .from('profiles')
      .select('role')
      .eq('id', ctx.userClaims.id)
      .maybeSingle()
    if (profileError || profile?.role !== 'admin') return json({ error: 'No tienes autorización para sincronizar encuestas.' }, 403)

    const { mode } = await request.json()
    if (mode !== 'partial' && mode !== 'complete') return json({ error: 'El tipo de sincronización no es válido.' }, 400)

    const { data: clients, error: clientsError } = await ctx.supabaseAdmin
      .from('clients')
      .select('id,email')
      .order('id', { ascending: true })
    if (clientsError) return json({ error: 'No fue posible consultar los clientes.' }, 400)

    const clientsByEmail = new Map<string, string>()
    for (const client of clients || []) {
      const email = normalizedEmail(client.email)
      if (email && !clientsByEmail.has(email)) clientsByEmail.set(email, client.id)
    }

    let responsesRequest = ctx.supabaseAdmin
      .from('csat_responses')
      .select('id,email,client_id')
      .order('submitted_at', { ascending: false })
      .limit(1000)
    if (mode === 'partial') responsesRequest = responsesRequest.is('client_id', null)
    const { data: responses, error: responsesError } = await responsesRequest
    if (responsesError) return json({ error: 'No fue posible consultar las encuestas.' }, 400)

    let updated = 0
    for (const response of responses || []) {
      const clientId = clientsByEmail.get(normalizedEmail(response.email))
      if (!clientId || clientId === response.client_id) continue
      const { error: updateError } = await ctx.supabaseAdmin
        .from('csat_responses')
        .update({ client_id: clientId })
        .eq('id', response.id)
      if (updateError) return json({ error: 'No fue posible completar la sincronización.' }, 400)
      updated += 1
    }

    return json({ ok: true, mode, reviewed: (responses || []).length, updated })
  }),
}

