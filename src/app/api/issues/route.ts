import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const projectId = searchParams.get('projectId')

  if (!projectId) return Response.json({ error: 'projectId required' }, { status: 400 })

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  let query = supabase
    .from('issues')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  const status = searchParams.get('status')
  if (status) query = query.eq('status', status)

  const severity = searchParams.get('severity')
  if (severity) query = query.eq('severity', severity)

  const type = searchParams.get('type')
  if (type) query = query.eq('type', type)

  const { data: issues } = await query.limit(50)

  return Response.json({ issues: issues ?? [] })
}
