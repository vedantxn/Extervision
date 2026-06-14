import { createServerSupabase } from '@/lib/supabase/server'
import { waitUntil } from '@vercel/functions'

export async function POST() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Start the agent loop
  waitUntil(
    fetch(`${baseUrl}/api/agent/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })
  )

  return Response.json({ status: 'Agent started', message: 'The agent is now running continuously.' })
}
