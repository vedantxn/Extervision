import { createServerSupabase } from '@/lib/supabase/server'
import { SessionAnalyzer } from '@/lib/analyzer'
import { CodeFixer } from '@/lib/fixer'
import { getExamplesForProject } from '@/lib/self-improve'
import { decrypt } from '@/lib/encrypt'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session } = await supabase
    .from('sessions')
    .select('*, projects(*)')
    .eq('id', sessionId)
    .single()

  if (!session || session.projects.user_id !== user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const project = session.projects
  const anthropicKey = decrypt(project.anthropic_api_key)
  const analyzer = new SessionAnalyzer(anthropicKey)
  const examples = await getExamplesForProject(project.id)

  await supabase.from('sessions').update({ analysis_status: 'analyzing' }).eq('id', sessionId)

  const result = await analyzer.analyze(session, examples)
  let issuesCreated = 0

  if (result.findings.length > 0) {
    const issues = result.findings.map(f => ({
      project_id: project.id,
      session_id: sessionId,
      type: f.type,
      severity: f.severity,
      title: f.title,
      description: f.description,
      reproduction_steps: f.reproduction_steps,
      affected_component: f.affected_component,
      root_cause: f.root_cause,
      suggested_fix: f.suggested_fix,
      confidence: f.confidence,
      status: 'open',
      created_at: new Date().toISOString(),
    }))

    const { data: inserted } = await supabase.from('issues').insert(issues).select()
    issuesCreated = issues.length

    if (project.github_token && project.github_repo && inserted) {
      const githubToken = decrypt(project.github_token)
      const fixer = new CodeFixer(anthropicKey, githubToken, project.github_repo)

      for (const issue of inserted) {
        if (issue.confidence >= 0.8 && (issue.severity === 'critical' || issue.severity === 'high')) {
          try {
            const prUrl = await fixer.fixAndPush(issue)
            if (prUrl) {
              await supabase.from('issues').update({ pr_url: prUrl, pr_status: 'open' }).eq('id', issue.id)
            }
          } catch {}
        }
      }
    }
  }

  await supabase.from('sessions').update({ analysis_status: 'done' }).eq('id', sessionId)
  return Response.json({ findings: result.findings.length, issues_created: issuesCreated })
}
