import { waitUntil } from '@vercel/functions'

export const maxDuration = 60

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Run the agent
  const agentRes = await fetch(`${baseUrl}/api/agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify({}),
  })

  const agentResult = await agentRes.json()

  // Schedule next run using waitUntil so the response returns immediately
  // but the re-invocation happens after a delay
  waitUntil(scheduleNextRun(baseUrl))

  return Response.json({
    status: 'alive',
    lastRun: agentResult,
    nextRunIn: '5 minutes',
  })
}

async function scheduleNextRun(baseUrl: string) {
  // Wait 5 minutes
  await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000))

  // Re-invoke self — this creates the immortal loop
  await fetch(`${baseUrl}/api/agent/scheduler`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  }).catch(() => {
    // If this fails, the Vercel Cron will restart it
  })
}

// GET endpoint for Vercel Cron to bootstrap/restart the loop
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Kick off the scheduler loop
  waitUntil(
    fetch(`${baseUrl}/api/agent/scheduler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CRON_SECRET}`,
      },
    })
  )

  return Response.json({ status: 'scheduler started' })
}
