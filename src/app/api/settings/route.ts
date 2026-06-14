import { createServerSupabase, createServiceSupabase } from '@/lib/supabase/server'
import { encrypt } from '@/lib/encrypt'

export async function POST(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { projectId, name, posthog_api_key, posthog_project_id, openai_api_key, github_token, github_repo } = body

  const update: Record<string, unknown> = {}

  if (name) update.name = name
  if (posthog_project_id) update.posthog_project_id = posthog_project_id
  if (github_repo) update.github_repo = github_repo
  if (posthog_api_key) update.posthog_api_key = encrypt(posthog_api_key)
  if (openai_api_key) update.openai_api_key = encrypt(openai_api_key)
  if (github_token) update.github_token = encrypt(github_token)

  const db = createServiceSupabase()

  if (projectId) {
    await db.from('projects').update(update).eq('id', projectId).eq('user_id', user.id)
  } else {
    // Check if user already has a project
    const { data: existing } = await db.from('projects').select('id').eq('user_id', user.id).limit(1)
    if (existing && existing[0]) {
      await db.from('projects').update(update).eq('id', existing[0].id)
    } else {
      await db.from('projects').insert({ ...update, user_id: user.id, name: name || 'My Project', sync_enabled: true })
    }
  }

  return Response.json({ success: true })
}
