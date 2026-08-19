import { withSupabase } from 'npm:@supabase/server@^1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://portal.jorkcaceres.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function createTemporaryPassword() {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%'
  const values = crypto.getRandomValues(new Uint32Array(16))
  return Array.from(values, (value) => characters[value % characters.length]).join('')
}

export default {
  fetch: withSupabase({ auth: 'user' }, async (request, ctx) => {
    if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
    if (request.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)

    const { data: profile, error: profileError } = await ctx.supabase
      .from('profiles')
      .select('role')
      .eq('id', ctx.userClaims.id)
      .maybeSingle()

    if (profileError || profile?.role !== 'admin') {
      return json({ error: 'No tienes autorización para crear clientes.' }, 403)
    }

    const body = await request.json()
    const firstName = String(body.first_name ?? '').trim()
    const lastName = String(body.last_name ?? '').trim()
    const email = String(body.email ?? '').trim().toLowerCase()
    const phone = String(body.phone ?? '').trim() || null
    const companyName = String(body.company_name ?? '').trim() || null
    const portalAccess = body.portal_access === true

    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'Completa nombre, apellido y un correo electrónico válido.' }, 400)
    }

    const { data: client, error: clientError } = await ctx.supabaseAdmin
      .from('clients')
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company_name: companyName,
        portal_access: portalAccess,
      })
      .select('id, first_name, last_name, email, portal_access')
      .single()

    if (clientError) {
      return json({ error: clientError.code === '23505' ? 'Ya existe un cliente con este correo.' : 'No fue posible crear el cliente.' }, 400)
    }

    if (!portalAccess) return json({ client, temporaryPassword: null })

    const temporaryPassword = createTemporaryPassword()
    const { data: userResult, error: userError } = await ctx.supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true,
    })

    if (userError || !userResult.user) {
      await ctx.supabaseAdmin.from('clients').delete().eq('id', client.id)
      return json({ error: userError?.message ?? 'No fue posible crear el acceso al portal.' }, 400)
    }

    const { error: accessError } = await ctx.supabaseAdmin.from('profiles').insert({
      id: userResult.user.id,
      client_id: client.id,
      role: 'cliente',
    })

    if (accessError) {
      await ctx.supabaseAdmin.auth.admin.deleteUser(userResult.user.id)
      await ctx.supabaseAdmin.from('clients').delete().eq('id', client.id)
      return json({ error: 'No fue posible completar el acceso al portal.' }, 500)
    }

    return json({ client, temporaryPassword })
  }),
}
