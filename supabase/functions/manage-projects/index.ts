import { withSupabase } from 'npm:@supabase/server@^1'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://portal-qa.jorkcaceres.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

function dateValue(value: unknown) {
  const date = String(value ?? '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

function textValue(value: unknown) {
  return String(value ?? '').trim()
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

    if (profileError || profile?.role !== 'admin') return json({ error: 'No tienes autorización para administrar proyectos.' }, 403)

    const body = await request.json()
    const action = textValue(body.action)
    const clientId = textValue(body.client_id)
    const title = textValue(body.title)
    const service = textValue(body.service)
    const status = textValue(body.status)
    const startDate = dateValue(body.start_date)
    const endDate = dateValue(body.end_date)
    const sharedFolderUrl = textValue(body.shared_folder_url) || null
    const observations = textValue(body.observations) || null
    const validStatuses = ['planificado', 'en_curso', 'pausado', 'finalizado']

    if (!clientId || !title || !service || !startDate || !validStatuses.includes(status)) {
      return json({ error: 'Completa cliente, título, servicio, estado y fecha de inicio.' }, 400)
    }
    if (endDate && endDate < startDate) return json({ error: 'La fecha de finalización no puede ser anterior a la fecha de inicio.' }, 400)
    if (sharedFolderUrl) {
      try { new URL(sharedFolderUrl) } catch { return json({ error: 'La carpeta compartida debe usar una URL válida.' }, 400) }
    }

    const { data: client } = await ctx.supabaseAdmin.from('clients').select('id').eq('id', clientId).maybeSingle()
    if (!client) return json({ error: 'El cliente seleccionado no existe.' }, 404)

    const values = { client_id: clientId, title, service, status, project_date: startDate, start_date: startDate, end_date: endDate, shared_folder_url: sharedFolderUrl, observations }

    if (action === 'create') {
      const { data, error } = await ctx.supabaseAdmin.from('projects').insert(values).select('id,code').single()
      if (error) return json({ error: 'No fue posible crear el proyecto.' }, 400)
      return json({ project: data })
    }

    if (action === 'update') {
      const projectId = textValue(body.project_id)
      if (!projectId) return json({ error: 'No fue posible identificar el proyecto.' }, 400)
      const { data: existingProject } = await ctx.supabaseAdmin.from('projects').select('id').eq('id', projectId).maybeSingle()
      if (!existingProject) return json({ error: 'El proyecto no existe o ya fue eliminado.' }, 404)
      const { error } = await ctx.supabaseAdmin.from('projects').update(values).eq('id', projectId)
      if (error) return json({ error: 'No fue posible actualizar el proyecto.' }, 400)
      return json({ ok: true })
    }

    return json({ error: 'La acción solicitada no existe.' }, 400)
  }),
}

