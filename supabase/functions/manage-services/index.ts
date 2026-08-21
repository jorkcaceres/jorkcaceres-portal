import { withSupabase } from 'npm:@supabase/server@^1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://portal.jorkcaceres.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function textValue(value: unknown) {
  return String(value ?? '').trim()
}

function dateValue(value: unknown) {
  const valueAsDate = textValue(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(valueAsDate) ? valueAsDate : null
}

function amountValue(value: unknown) {
  if (textValue(value) === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function colombiaDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const value = Object.fromEntries(parts.filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return `${value.year}-${value.month}-${value.day}`
}

function nextRenewalDate(value: string, intervalValue: number, intervalUnit: string) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (intervalUnit === 'dias') date.setUTCDate(date.getUTCDate() + intervalValue)
  if (intervalUnit === 'meses') date.setUTCMonth(date.getUTCMonth() + intervalValue)
  if (intervalUnit === 'anios') date.setUTCFullYear(date.getUTCFullYear() + intervalValue)
  return date.toISOString().slice(0, 10)
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
    if (profileError || profile?.role !== 'admin') return json({ error: 'No tienes autorización para administrar servicios.' }, 403)

    const body = await request.json()
    const action = textValue(body.action)

    if (action === 'set_active') {
      const serviceId = textValue(body.service_id)
      if (!serviceId || typeof body.active !== 'boolean') return json({ error: 'La acción solicitada no es válida.' }, 400)
      const { error } = await ctx.supabaseAdmin.from('client_services').update({ active: body.active, updated_at: new Date().toISOString() }).eq('id', serviceId)
      if (error) return json({ error: 'No fue posible actualizar el servicio.' }, 400)
      return json({ ok: true })
    }

    if (action === 'renew') {
      const renewalId = textValue(body.renewal_id)
      const receiptPath = textValue(body.receipt_path)
      if (!renewalId || receiptPath !== `${renewalId}/receipt.png`) return json({ error: 'El comprobante de la renovación no es válido.' }, 400)

      const { data: renewal, error: renewalError } = await ctx.supabaseAdmin
        .from('service_renewals')
        .select('id,service_id,renewal_date,status,client_services(recurrence_id,portal_service_recurrences(interval_value,interval_unit))')
        .eq('id', renewalId)
        .maybeSingle()
      if (renewalError || !renewal) return json({ error: 'La renovación no existe.' }, 404)
      if (renewal.status !== 'programado') return json({ error: 'Esta renovación ya fue confirmada.' }, 400)

      const service = Array.isArray(renewal.client_services) ? renewal.client_services[0] : renewal.client_services
      const recurrence = service?.portal_service_recurrences
      if (!recurrence) return json({ error: 'No fue posible identificar la recurrencia del servicio.' }, 400)

      const { data: updated, error: updateError } = await ctx.supabaseAdmin
        .from('service_renewals')
        .update({ status: 'renovado', receipt_path: receiptPath, renewed_at: colombiaDate(), updated_at: new Date().toISOString() })
        .eq('id', renewalId)
        .eq('status', 'programado')
        .select('id')
      if (updateError || !updated?.length) return json({ error: 'No fue posible confirmar la renovación.' }, 400)

      const nextDate = nextRenewalDate(renewal.renewal_date, Number(recurrence.interval_value), recurrence.interval_unit)
      const { data: nextRenewal, error: nextError } = await ctx.supabaseAdmin
        .from('service_renewals')
        .insert({ service_id: renewal.service_id, renewal_date: nextDate, status: 'programado' })
        .select('id,renewal_date')
        .single()
      if (nextError) return json({ error: 'La renovación fue confirmada, pero no se pudo programar el siguiente ciclo. Contáctame para revisarlo.' }, 400)
      return json({ ok: true, next_renewal: nextRenewal })
    }

    const clientId = textValue(body.client_id)
    const name = textValue(body.name)
    const recurrenceId = textValue(body.recurrence_id)
    const renewalDate = dateValue(body.renewal_date)
    const amount = amountValue(body.amount)
    const observations = textValue(body.observations) || null
    if (!clientId || name.length < 2 || name.length > 120 || !recurrenceId || !renewalDate || (textValue(body.amount) !== '' && amount === null)) {
      return json({ error: 'Completa cliente, servicio, recurrencia y fecha de renovación. El valor debe ser válido.' }, 400)
    }

    const { data: client } = await ctx.supabaseAdmin.from('clients').select('id').eq('id', clientId).maybeSingle()
    if (!client) return json({ error: 'El cliente seleccionado no existe.' }, 404)
    const { data: recurrence } = await ctx.supabaseAdmin.from('portal_service_recurrences').select('id,active').eq('id', recurrenceId).maybeSingle()
    if (!recurrence || (action === 'create' && !recurrence.active)) return json({ error: 'La recurrencia seleccionada no está disponible.' }, 400)

    const values = { client_id: clientId, name, recurrence_id: recurrenceId, amount, observations, updated_at: new Date().toISOString() }

    if (action === 'create') {
      const { data: service, error: serviceError } = await ctx.supabaseAdmin.from('client_services').insert(values).select('id').single()
      if (serviceError || !service) return json({ error: 'No fue posible registrar el servicio.' }, 400)
      const { data: renewal, error: renewalError } = await ctx.supabaseAdmin.from('service_renewals').insert({ service_id: service.id, renewal_date: renewalDate, status: 'programado' }).select('id,renewal_date').single()
      if (renewalError) return json({ error: 'El servicio fue creado, pero no se pudo registrar su primera renovación.' }, 400)
      return json({ service, renewal })
    }

    if (action === 'update') {
      const serviceId = textValue(body.service_id)
      if (!serviceId) return json({ error: 'No fue posible identificar el servicio.' }, 400)
      const { error: serviceError } = await ctx.supabaseAdmin.from('client_services').update(values).eq('id', serviceId)
      if (serviceError) return json({ error: 'No fue posible actualizar el servicio.' }, 400)
      const { error: renewalError } = await ctx.supabaseAdmin.from('service_renewals').update({ renewal_date: renewalDate, updated_at: new Date().toISOString() }).eq('service_id', serviceId).eq('status', 'programado')
      if (renewalError) return json({ error: 'No fue posible actualizar la próxima renovación.' }, 400)
      return json({ ok: true })
    }

    return json({ error: 'La acción solicitada no existe.' }, 400)
  }),
}

