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
  const date = textValue(value)
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function amountValue(value: unknown) {
  if (textValue(value) === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
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
    if (profileError || profile?.role !== 'admin') return json({ error: 'No tienes autorización para administrar pagos.' }, 403)

    const body = await request.json()
    const action = textValue(body.action)

    if (action === 'set_receipt') {
      const paymentId = textValue(body.payment_id)
      const receiptPath = textValue(body.receipt_path)
      if (!paymentId || receiptPath !== `${paymentId}/receipt.png`) return json({ error: 'La referencia del comprobante no es válida.' }, 400)
      const { data: payment } = await ctx.supabaseAdmin.from('project_payments').select('id').eq('id', paymentId).maybeSingle()
      if (!payment) return json({ error: 'El pago no existe.' }, 404)
      const { error } = await ctx.supabaseAdmin.from('project_payments').update({ receipt_path: receiptPath }).eq('id', paymentId)
      if (error) return json({ error: 'No fue posible vincular el comprobante.' }, 400)
      return json({ ok: true })
    }

    const projectId = textValue(body.project_id)
    const paymentType = textValue(body.payment_type)
    const amount = amountValue(body.amount)
    const paymentDate = dateValue(body.payment_date)
    const status = textValue(body.status)
    const validStatuses = ['pendiente', 'confirmado']

    if (!projectId || !paymentType || amount === null || !paymentDate || !validStatuses.includes(status)) {
      return json({ error: 'Completa proyecto, tipo de pago, monto, fecha y estado.' }, 400)
    }

    const { data: configuredType } = await ctx.supabaseAdmin
      .from('portal_payment_types')
      .select('code,name,active')
      .eq('code', paymentType)
      .maybeSingle()
    if (!configuredType || (action === 'create' && !configuredType.active)) {
      return json({ error: 'El tipo de pago seleccionado no está disponible.' }, 400)
    }

    const { data: project } = await ctx.supabaseAdmin.from('projects').select('id').eq('id', projectId).maybeSingle()
    if (!project) return json({ error: 'El proyecto seleccionado no existe.' }, 404)

    const values = {
      project_id: projectId,
      payment_type: paymentType,
      concept: configuredType.name,
      amount,
      payment_date: paymentDate,
      status,
    }

    if (action === 'create') {
      const { data, error } = await ctx.supabaseAdmin.from('project_payments').insert(values).select('id,code').single()
      if (error) return json({ error: 'No fue posible registrar el pago.' }, 400)
      return json({ payment: data })
    }

    if (action === 'update') {
      const paymentId = textValue(body.payment_id)
      if (!paymentId) return json({ error: 'No fue posible identificar el pago.' }, 400)
      const { data: payment } = await ctx.supabaseAdmin.from('project_payments').select('id').eq('id', paymentId).maybeSingle()
      if (!payment) return json({ error: 'El pago no existe.' }, 404)
      const { error } = await ctx.supabaseAdmin.from('project_payments').update(values).eq('id', paymentId)
      if (error) return json({ error: 'No fue posible actualizar el pago.' }, 400)
      return json({ ok: true })
    }

    return json({ error: 'La acción solicitada no existe.' }, 400)
  }),
}

