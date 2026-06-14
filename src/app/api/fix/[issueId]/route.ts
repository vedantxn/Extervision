import { createServerSupabase } from '@/lib/supabase/server'
import { CodeFixer } from '@/lib/fixer'
import { decrypt } from '@/lib/encrypt'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ issueId: string }> }
) {
  const { issueId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: issue } = await supabase
    .from('issues')
    .select('*, projects(*)')
    .eq('id', issueId)
    .single()

  if (!issue || issue.projects.user_id !== user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const project = issue.projects
  if (!project.github_token || !project.github_repo) {
    return Response.json({ error: 'GitHub not configured' }, { status: 400 })
  }

  const anthropicKey = decrypt(project.anthropic_api_key)
  const githubToken = decrypt(project.github_token)
  const fixer = new CodeFixer(anthropicKey, githubToken, project.github_repo)

  const prUrl = await fixer.fixAndPush(issue)

  if (prUrl) {
    await supabase
      .from('issues')
      .update({ pr_url: prUrl, pr_status: 'open', status: 'fixed' })
      .eq('id', issueId)

    return Response.json({ pr_url: prUrl })
  }

  return Response.json({ error: 'Could not generate fix' }, { status: 422 })
}
