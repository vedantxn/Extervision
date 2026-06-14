import { createServerSupabase } from '@/lib/supabase/server'
import { recordFeedback } from '@/lib/self-improve'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { verdict, comment } = await request.json()

  if (!['confirmed', 'rejected', 'partial'].includes(verdict)) {
    return Response.json({ error: 'Invalid verdict' }, { status: 400 })
  }

  const { data: issue } = await supabase
    .from('issues')
    .select('project_id')
    .eq('id', id)
    .single()

  if (!issue) return Response.json({ error: 'Issue not found' }, { status: 404 })

  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', issue.project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  await recordFeedback(issue.project_id, id, user.id, verdict, comment ?? null)

  return Response.json({ success: true })
}
