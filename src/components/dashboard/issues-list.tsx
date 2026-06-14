'use client'

import { GitPullRequest } from 'lucide-react'
import type { Issue } from '@/lib/types'
import Link from 'next/link'
import { EmptyState, PageHeader, Panel, PanelHeader, Pill, severityTone, statusTone } from '@/components/dashboard/ui'

export function IssuesList({ issues }: { issues: Issue[] }) {
  return (
    <div className="pt-20 lg:pt-0">
      <PageHeader
        eyebrow="ExterVision / Loops"
        title="Loop archive"
        description="Replay-backed product quality loops with severity, confidence, PR readiness, and learned team policy."
      />

      {issues.length === 0 ? (
        <EmptyState
          title="No loops yet"
          description="Analyze replays to create the first closed loop from signal to diagnosis, feedback, PR, and regression watch."
        />
      ) : (
        <Panel>
          <PanelHeader label="Loop inbox" value={`${issues.length} detected`} />
          <div className="hidden grid-cols-[84px_minmax(0,1fr)_110px_86px_92px_92px] gap-3 border-b border-[var(--ev-border)] px-3 py-2 font-data text-[10px] uppercase tracking-normal text-[var(--ev-faint)] md:grid">
            <span>Severity</span>
            <span>Detected issue</span>
            <span>Type</span>
            <span>Confidence</span>
            <span>Status</span>
            <span>PR</span>
          </div>
          <div className="divide-y divide-[var(--ev-border)]">
            {issues.map(issue => (
              <Link
                key={issue.id}
                href={`/dashboard/issues/${issue.id}`}
                className="ev-focus grid gap-3 px-3 py-3 transition-colors hover:bg-white/[0.03] md:grid-cols-[84px_minmax(0,1fr)_110px_86px_92px_92px] md:items-center"
              >
                <Pill tone={severityTone(issue.severity)}>{issue.severity}</Pill>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ev-text)]">{issue.title}</p>
                  <p className="mt-1 truncate text-xs text-[var(--ev-muted)]">{issue.description}</p>
                </div>
                <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-muted)]">{issue.type.replace('_', ' ')}</span>
                <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-muted)]">{Math.round(issue.confidence * 100)}%</span>
                <Pill tone={statusTone(issue.status)}>{issue.status}</Pill>
                {issue.pr_url ? (
                  <span className="inline-flex items-center gap-1 font-data text-xs uppercase tracking-normal text-[var(--ev-success)]">
                    <GitPullRequest size={13} /> Open
                  </span>
                ) : (
                  <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-faint)]">Queued</span>
                )}
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
