'use client'

import { useState } from 'react'
import { AlertCircle, Clock, Monitor, Play } from 'lucide-react'
import type { Session } from '@/lib/types'
import { EmptyState, PageHeader, Panel, PanelHeader, Pill, statusTone } from '@/components/dashboard/ui'

export function SessionsList({ sessions }: { sessions: Session[]; projectId: string }) {
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

  async function analyzeSession(sessionId: string) {
    setAnalyzingId(sessionId)
    await fetch(`/api/analyze/${sessionId}`, { method: 'POST' })
    setAnalyzingId(null)
    window.location.reload()
  }

  return (
    <div className="pt-20 lg:pt-0">
      <PageHeader
        eyebrow="ExterVision / Replays"
        title="Replay evidence"
        description="Raw PostHog sessions that can become loops when ExterVision sees blocked flows, errors, rage clicks, or team-defined signals."
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="No replays synced"
          description="Sync PostHog sessions from the inbox. Replays become evidence once ExterVision analyzes the session stream."
        />
      ) : (
        <Panel>
          <PanelHeader label="PostHog sessions" value={`${sessions.length} loaded`} />
          <div className="divide-y divide-[var(--ev-border)]">
            {sessions.map(session => (
              <div
                key={session.id}
                className="grid gap-3 px-3 py-3 md:grid-cols-[26px_minmax(0,1fr)_110px_100px_96px] md:items-center"
              >
                <Monitor size={16} className="text-[var(--ev-muted)]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ev-text)]">
                    {session.user_distinct_id || 'Anonymous user'}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {Math.round(session.duration)}s
                    </span>
                    <span>{session.event_summary?.total_events ?? 0} events</span>
                    {(session.console_errors?.length ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 text-[var(--ev-danger)]">
                        <AlertCircle size={12} />
                        {session.console_errors.length} errors
                      </span>
                    )}
                    {(session.event_summary?.rage_clicks ?? 0) > 0 && (
                      <span className="text-[var(--ev-warning)]">{session.event_summary.rage_clicks} rage clicks</span>
                    )}
                  </div>
                </div>
                <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-muted)]">
                  {(session.event_summary?.dead_clicks ?? 0)} dead clicks
                </span>
                <Pill tone={statusTone(session.analysis_status)}>{session.analysis_status}</Pill>
                {session.analysis_status === 'pending' ? (
                  <button
                    onClick={() => analyzeSession(session.id)}
                    disabled={analyzingId === session.id}
                    className="ev-focus inline-flex min-h-9 items-center justify-center gap-1 rounded bg-[var(--ev-acid)] px-3 text-xs font-semibold text-[#11130b] disabled:opacity-50"
                  >
                    <Play size={12} />
                    {analyzingId === session.id ? 'Analyzing' : 'Analyze'}
                  </button>
                ) : (
                  <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-faint)]">Evidence</span>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
