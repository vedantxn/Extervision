import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: issue } = await supabase
    .from('issues')
    .select('*, sessions(*), issue_feedback(*)')
    .eq('id', id)
    .single()

  if (!issue) return Response.json({ error: 'Not found' }, { status: 404 })

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', issue.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  return Response.json({ issue })
}
