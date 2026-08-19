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

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
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

    if (profileError || profile?.role !== 'admin') {
      return json({ error: 'No tienes autorización para administrar clientes.' }, 403)
    }

    const body = await request.json()
    const action = String(body.action ?? 'create')

    if (action === 'create') {
      const firstName = String(body.first_name ?? '').trim()
      const lastName = String(body.last_name ?? '').trim()
      const email = String(body.email ?? '').trim().toLowerCase()
      const phone = String(body.phone ?? '').trim() || null
      const companyName = String(body.company_name ?? '').trim() || null
      const portalAccess = body.portal_access === true

      if (!firstName || !lastName || !isValidEmail(email)) {
        return json({ error: 'Completa nombre, apellido y un correo electrónico válido.' }, 400)
      }

      const { data: client, error: clientError } = await ctx.supabaseAdmin
        .from('clients')
        .insert({ first_name: firstName, last_name: lastName, email, phone, company_name: companyName, portal_access: portalAccess })
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
    }

    const clientId = String(body.client_id ?? '')
    if (!clientId) return json({ error: 'No fue posible identificar al cliente.' }, 400)

    const { data: client, error: clientError } = await ctx.supabaseAdmin
      .from('clients')
      .select('id, email, status, portal_access')
      .eq('id', clientId)
      .maybeSingle()

    if (clientError || !client) return json({ error: 'El cliente no existe o ya fue eliminado.' }, 404)

    const { data: accessProfile } = await ctx.supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle()

    if (action === 'update') {
      const firstName = String(body.first_name ?? '').trim()
      const lastName = String(body.last_name ?? '').trim()
      const email = String(body.email ?? '').trim().toLowerCase()
      const phone = String(body.phone ?? '').trim() || null
      const companyName = String(body.company_name ?? '').trim() || null

      if (!firstName || !lastName || !isValidEmail(email)) {
        return json({ error: 'Completa nombre, apellido y un correo electrónico válido.' }, 400)
      }

      if (accessProfile && email !== client.email) {
        const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(accessProfile.id, {
          email,
          email_confirm: true,
        })
        if (authError) return json({ error: authError.message || 'No fue posible actualizar el correo de acceso.' }, 400)
      }

      const { error: updateError } = await ctx.supabaseAdmin
        .from('clients')
        .update({ first_name: firstName, last_name: lastName, email, phone, company_name: companyName })
        .eq('id', clientId)

      if (updateError) return json({ error: 'No fue posible actualizar los datos del cliente.' }, 400)
      return json({ ok: true })
    }

    if (action === 'grant_access') {
      if (accessProfile) return json({ error: 'Este cliente ya tiene acceso al portal.' }, 400)
      const temporaryPassword = createTemporaryPassword()
      const { data: userResult, error: userError } = await ctx.supabaseAdmin.auth.admin.createUser({
        email: client.email,
        password: temporaryPassword,
        email_confirm: true,
      })
      if (userError || !userResult.user) return json({ error: userError?.message ?? 'No fue posible crear el acceso al portal.' }, 400)

      const { error: profileInsertError } = await ctx.supabaseAdmin.from('profiles').insert({
        id: userResult.user.id,
        client_id: clientId,
        role: 'cliente',
      })
      if (profileInsertError) {
        await ctx.supabaseAdmin.auth.admin.deleteUser(userResult.user.id)
        return json({ error: 'No fue posible completar el acceso al portal.' }, 500)
      }

      const { error: accessUpdateError } = await ctx.supabaseAdmin
        .from('clients')
        .update({ portal_access: true, status: 'activo' })
        .eq('id', clientId)
      if (accessUpdateError) return json({ error: 'El acceso fue creado, pero no se pudo actualizar el estado del cliente.' }, 500)
      return json({ temporaryPassword })
    }

    if (!accessProfile) return json({ error: 'Este contacto aún no tiene acceso al portal.' }, 400)

    if (action === 'reset_password') {
      const temporaryPassword = createTemporaryPassword()
      const { error: passwordError } = await ctx.supabaseAdmin.auth.admin.updateUserById(accessProfile.id, { password: temporaryPassword })
      if (passwordError) return json({ error: passwordError.message || 'No fue posible restablecer la contraseña.' }, 400)
      return json({ temporaryPassword })
    }

    if (action === 'deactivate_access' || action === 'reactivate_access') {
      const deactivating = action === 'deactivate_access'
      const { error: authError } = await ctx.supabaseAdmin.auth.admin.updateUserById(accessProfile.id, {
        ban_duration: deactivating ? '876000h' : 'none',
      })
      if (authError) return json({ error: authError.message || 'No fue posible actualizar el acceso.' }, 400)

      const { error: statusError } = await ctx.supabaseAdmin
        .from('clients')
        .update({ status: deactivating ? 'inactivo' : 'activo' })
        .eq('id', clientId)
      if (statusError) return json({ error: 'Se actualizó la cuenta, pero no fue posible actualizar el estado del cliente.' }, 500)
      return json({ ok: true })
    }

    return json({ error: 'La acción solicitada no existe.' }, 400)
  }),
}
