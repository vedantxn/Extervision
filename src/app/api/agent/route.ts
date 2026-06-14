import { waitUntil } from '@vercel/functions'
import { createServiceSupabase } from '@/lib/supabase/server'
import { PostHogClient } from '@/lib/posthog'
import { SessionAnalyzer } from '@/lib/analyzer'
import { CodeFixer } from '@/lib/fixer'
import { getExamplesForProject } from '@/lib/self-improve'
import { decrypt } from '@/lib/encrypt'
import type { Session } from '@/lib/types'

export const maxDuration = 300

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceSupabase()

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('sync_enabled', true)

  if (!projects || projects.length === 0) {
    scheduleNext()
    return Response.json({ message: 'No active projects', next: '5m' })
  }

  const results = []

  for (const project of projects) {
    try {
      const posthogKey = decrypt(project.posthog_api_key)
      const openaiKey = decrypt(project.openai_api_key)

      // Sync
      const client = new PostHogClient(posthogKey, project.posthog_project_id)
      const { data: existing } = await supabase
        .from('sessions')
        .select('posthog_recording_id')
        .eq('project_id', project.id)

      const existingIds = new Set<string>(
        (existing ?? []).map((s: { posthog_recording_id: string }) => s.posthog_recording_id)
      )
      const newSessions = await client.syncRecordings(existingIds)

      if (newSessions.length > 0) {
        await supabase.from('sessions').insert(
          newSessions.map(s => ({
            ...s,
            project_id: project.id,
            analysis_status: 'pending',
            synced_at: new Date().toISOString(),
          }))
        )
      }

      // Analyze
      const { data: pending } = await supabase
        .from('sessions')
        .select('*')
        .eq('project_id', project.id)
        .eq('analysis_status', 'pending')
        .limit(5)

      if (!pending || pending.length === 0) {
        results.push({ project: project.id, synced: newSessions.length, analyzed: 0, issues: 0, prs: 0 })
        continue
      }

      const analyzer = new SessionAnalyzer(openaiKey)
      const examples = await getExamplesForProject(project.id)
      let totalIssues = 0
      let totalPrs = 0

      for (const session of pending as Session[]) {
        await supabase.from('sessions').update({ analysis_status: 'analyzing' }).eq('id', session.id)

        const result = await analyzer.analyze(session, examples)

        if (result.findings.length > 0) {
          const issues = result.findings.map(f => ({
            project_id: project.id,
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

          const { data: inserted } = await supabase.from('issues').insert(issues).select()
          totalIssues += issues.length

          // Auto-fix
          if (project.github_token && project.github_repo && inserted) {
            const githubToken = decrypt(project.github_token)
            const fixer = new CodeFixer(openaiKey, githubToken, project.github_repo)

            for (const issue of inserted) {
              if (issue.confidence >= 0.8 && (issue.severity === 'critical' || issue.severity === 'high')) {
                try {
                  const prUrl = await fixer.fixAndPush(issue)
                  if (prUrl) {
                    await supabase.from('issues').update({ pr_url: prUrl, pr_status: 'open' }).eq('id', issue.id)
                    totalPrs++
                  }
                } catch {}
              }
            }
          }
        }

        await supabase.from('sessions').update({ analysis_status: 'done' }).eq('id', session.id)
      }

      results.push({ project: project.id, synced: newSessions.length, analyzed: pending.length, issues: totalIssues, prs: totalPrs })
    } catch (err) {
      results.push({ project: project.id, error: String(err) })
    }
  }

  // Schedule next run — keeps the agent alive
  scheduleNext()

  return Response.json({ results, next: '5m' })
}

// Vercel Cron hits this as a failsafe restart
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Trigger agent via POST
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  waitUntil(
    fetch(`${baseUrl}/api/agent`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
    })
  )

  return Response.json({ status: 'triggered' })
}

function scheduleNext() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  waitUntil(
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000))
      await fetch(`${baseUrl}/api/agent`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      }).catch(() => {})
    })()
  )
}
