import { createServerSupabase } from '@/lib/supabase/server'
import { SessionAnalyzer } from '@/lib/analyzer'
import { CodeFixer } from '@/lib/fixer'
import { getExamplesForProject } from '@/lib/self-improve'
import { decrypt } from '@/lib/encrypt'
import type { Session } from '@/lib/types'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await request.json()

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 })

  const { data: pendingSessions } = await supabase
    .from('sessions')
    .select('*')
    .eq('project_id', projectId)
    .eq('analysis_status', 'pending')
    .limit(10)

  if (!pendingSessions || pendingSessions.length === 0) {
    return Response.json({ analyzed: 0, issues: 0 })
  }

  const anthropicKey = decrypt(project.anthropic_api_key)
  const analyzer = new SessionAnalyzer(anthropicKey)
  const examples = await getExamplesForProject(projectId)

  let totalIssues = 0

  for (const session of pendingSessions as Session[]) {
    await supabase
      .from('sessions')
      .update({ analysis_status: 'analyzing' })
      .eq('id', session.id)

    const result = await analyzer.analyze(session, examples)

    if (result.findings.length > 0) {
      const issues = result.findings.map(f => ({
        project_id: projectId,
        session_id: session.id,
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

      const { data: insertedIssues } = await supabase
        .from('issues')
        .insert(issues)
        .select()

      totalIssues += issues.length

      if (project.github_token && project.github_repo && insertedIssues) {
        const githubToken = decrypt(project.github_token)
        const fixer = new CodeFixer(anthropicKey, githubToken, project.github_repo)

        for (const issue of insertedIssues) {
          if (issue.confidence >= 0.8 && (issue.severity === 'critical' || issue.severity === 'high')) {
            try {
              const prUrl = await fixer.fixAndPush(issue)
              if (prUrl) {
                await supabase
                  .from('issues')
                  .update({ pr_url: prUrl, pr_status: 'open' })
                  .eq('id', issue.id)
              }
            } catch {
              // PR push failed, issue still recorded
            }
          }
        }
      }
    }

    await supabase
      .from('sessions')
      .update({ analysis_status: 'done' })
      .eq('id', session.id)
  }

  return Response.json({ analyzed: pendingSessions.length, issues: totalIssues })
}
