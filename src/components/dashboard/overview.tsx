'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Bug, GitPullRequest, Monitor, Power, RefreshCw, Zap } from 'lucide-react'
import type { Issue } from '@/lib/types'
import { EmptyState, PageHeader, Panel, PanelHeader, Pill, severityTone, statusTone } from '@/components/dashboard/ui'

type Stats = {
  totalSessions: number
  analyzedSessions: number
  totalIssues: number
  openIssues: number
  criticalIssues: number
  prsCreated: number
}

export function DashboardOverview({
  stats,
  recentIssues,
  projectId,
  setupMode = false,
}: {
  stats: Stats
  recentIssues: Issue[]
  projectId: string
  setupMode?: boolean
}) {
  const [syncing, setSyncing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const primaryIssue = recentIssues[0]

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    const res = await fetch('/api/posthog/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })
    const data = await res.json()
    setSyncResult(`Synced ${data.synced} new sessions`)
    setSyncing(false)
  }

  async function handleAnalyze() {
    setAnalyzing(true)
    setSyncResult(null)
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    })
    const data = await res.json()
    setSyncResult(`Analyzed ${data.analyzed} sessions, found ${data.issues} issues`)
    setAnalyzing(false)
  }

  return (
    <div className="pt-20 lg:pt-0">
      <PageHeader
        eyebrow="ExterVision / Loop inbox"
        title="Loop inbox"
        description={setupMode
          ? 'Connect PostHog, GitHub, and OpenAI to start turning replay evidence into loops.'
          : 'Evidence ranked by user pain, confidence, fix readiness, and learned team policy.'}
        action={
          setupMode ? (
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone="warning">Setup needed</Pill>
              <Link
                href="/dashboard/settings"
                className="ev-focus inline-flex min-h-10 items-center rounded-full bg-[var(--ev-acid)] px-5 text-sm font-semibold text-[#11130b]"
              >
                Connect sources
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={async () => {
                  setAgentRunning(true)
                  setSyncResult(null)
                  const res = await fetch('/api/agent/start', { method: 'POST' })
                  const data = await res.json()
                  setSyncResult(data.message ?? 'Agent started')
                }}
                disabled={agentRunning}
                className="ev-focus inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--ev-acid)] px-5 text-sm font-semibold text-[#11130b] disabled:opacity-50"
              >
                <Power size={16} className={agentRunning ? 'animate-pulse' : ''} />
                {agentRunning ? 'Watching' : 'Start watch'}
              </button>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="ev-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--ev-border)] px-5 text-sm text-[var(--ev-text)] transition-colors hover:bg-white/[0.04] disabled:opacity-50"
              >
                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                Sync replays
              </button>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="ev-focus inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--ev-border)] px-5 text-sm text-[var(--ev-text)] transition-colors hover:bg-white/[0.04] disabled:opacity-50"
              >
                <Zap size={16} className={analyzing ? 'animate-pulse' : ''} />
                Analyze loops
              </button>
            </div>
          )
        }
      />

      {syncResult && (
        <div className="mb-5 rounded border border-[rgba(215,255,95,0.22)] bg-[rgba(215,255,95,0.08)] px-3 py-2 font-data text-xs uppercase tracking-normal text-[var(--ev-acid)]">
          {syncResult}
        </div>
      )}

      {!setupMode && (
        <div className="mb-6 grid gap-3 rounded-[28px] bg-white/[0.025] p-3 ring-1 ring-white/[0.045] sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Monitor} label="Observed" value={stats.totalSessions} detail={`${stats.analyzedSessions} analyzed`} />
          <Metric icon={Bug} label="Loops" value={stats.totalIssues} detail={`${stats.openIssues} open`} />
          <Metric icon={AlertTriangle} label="Critical" value={stats.criticalIssues} detail="needs owner" tone="danger" />
          <Metric icon={GitPullRequest} label="PR ready" value={stats.prsCreated} detail="auto-generated" tone="success" />
        </div>
      )}

      {primaryIssue ? (
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid gap-3">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
              <Panel>
                <PanelHeader label={`EV-${primaryIssue.id.slice(0, 4)} / ${primaryIssue.type.replace('_', ' ')}`} value={`${Math.round(primaryIssue.confidence * 100)}% confidence`} />
                <div className="p-3">
                  <div className="ev-grid-bg relative min-h-72 overflow-hidden rounded border border-[var(--ev-border)] bg-[linear-gradient(180deg,rgba(244,241,234,0.06),rgba(244,241,234,0.015))]">
                    <div className="absolute left-4 top-4 rounded border border-[var(--ev-border)] bg-[var(--ev-surface)] px-3 py-2">
                      <p className="font-data text-[10px] uppercase tracking-normal text-[var(--ev-muted)]">Replay evidence</p>
                      <p className="mt-1 text-sm text-[var(--ev-text)]">{primaryIssue.affected_component || 'Product flow'}</p>
                    </div>
                    <div className="absolute bottom-8 right-8 rounded border border-[rgba(255,92,92,0.42)] bg-[rgba(255,92,92,0.1)] px-3 py-2 font-data text-[11px] text-[#ffd8d8]">
                      suspected failure cluster
                    </div>
                    <div className="absolute bottom-24 right-20 h-20 w-20 rounded-full border border-[rgba(255,92,92,0.72)] shadow-[0_0_0_14px_rgba(255,92,92,0.08),0_0_0_30px_rgba(255,92,92,0.04)]" />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-5">
                    {['Signal', 'Diagnose', 'Teach', 'PR', 'Watch'].map((step, index) => (
                      <div key={step} className="rounded border border-[var(--ev-border)] bg-white/[0.02] p-2">
                        <p className="font-data text-[10px] text-[var(--ev-muted)]">00:{String(index * 7 + 3).padStart(2, '0')}</p>
                        <p className="mt-2 text-xs text-[var(--ev-text)]">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <Panel className="grid">
                <PanelHeader label="Generated fix" value={primaryIssue.pr_url ? 'PR open' : 'ready'} />
                <div className="flex flex-col p-3">
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={severityTone(primaryIssue.severity)}>{primaryIssue.severity}</Pill>
                    <Pill tone={statusTone(primaryIssue.status)}>{primaryIssue.status}</Pill>
                    <Pill tone="accent">{Math.round(primaryIssue.confidence * 100)}%</Pill>
                  </div>
                  <h2 className="mt-4 text-xl font-semibold leading-tight text-[var(--ev-text)]">{primaryIssue.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-[var(--ev-muted)]">{primaryIssue.description}</p>
                  <pre className="mt-4 overflow-x-auto rounded border border-[rgba(111,227,161,0.16)] bg-[rgba(111,227,161,0.06)] p-3 font-data text-xs leading-6 text-[var(--ev-success)]">
{primaryIssue.suggested_fix || '+ preserve state\n+ add regression coverage\n+ open scoped PR'}
                  </pre>
                  <div className="mt-auto pt-4">
                    <Link
                      href={`/dashboard/issues/${primaryIssue.id}`}
                      className="ev-focus inline-flex min-h-10 w-full items-center justify-center rounded bg-[var(--ev-acid)] px-4 text-sm font-semibold text-[#11130b]"
                    >
                      Inspect loop
                    </Link>
                  </div>
                </div>
              </Panel>
            </div>

            <Panel>
              <PanelHeader label="Recent loops" value={`${recentIssues.length} loaded`} />
              <div className="divide-y divide-[var(--ev-border)]">
                {recentIssues.slice(0, 8).map(issue => (
                  <LoopRow key={issue.id} issue={issue} />
                ))}
              </div>
            </Panel>
          </div>

          <MemoryLedger />
        </div>
      ) : (
        setupMode ? (
          <SetupGuide />
        ) : (
          <EmptyState
            title="No loops detected yet"
            description="Sync PostHog sessions and run analysis. ExterVision will turn replay evidence into diagnosis, feedback, PRs, and memory updates."
          />
        )
      )}
    </div>
  )
}

function SetupGuide() {
  const steps = [
    ['PostHog', 'Replay evidence', 'Session recordings, rage clicks, dead clicks, console errors, and user paths.'],
    ['OpenAI', 'Diagnosis', 'The reasoning layer that turns replay evidence into root cause and fix plans.'],
    ['GitHub', 'Pull requests', 'Repository access for scoped changes, review routing, and regression follow-up.'],
  ]

  return (
    <section className="ev-liquid overflow-hidden rounded-[34px] p-5 ring-1 ring-white/[0.06] md:p-7">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] xl:items-center">
        <div>
          <p className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-acid)]">No project connected yet</p>
          <h2 className="font-display mt-3 max-w-xl text-5xl font-semibold uppercase leading-[0.88] tracking-normal text-[var(--ev-text)] md:text-7xl">
            Wire the loop once.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ev-muted)]">
            ExterVision needs real sources before the dashboard has real loops. Connect replay evidence, model diagnosis, and code access. Then this inbox fills with actual product failures and PRs.
          </p>
          <Link
            href="/dashboard/settings"
            className="ev-focus mt-7 inline-flex min-h-12 items-center rounded-full bg-[var(--ev-acid)] px-6 text-sm font-semibold text-[#11130b]"
          >
            Connect sources
          </Link>
        </div>

        <div className="relative">
          <div className="absolute left-8 right-8 top-1/2 hidden h-px bg-gradient-to-r from-[var(--ev-acid)] via-[var(--ev-cyan)] to-[var(--ev-success)] opacity-60 md:block" />
          <div className="relative grid gap-3 md:grid-cols-3">
            {steps.map(([name, label, description], index) => (
              <div
                key={name}
                className="rounded-[26px] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(215,255,95,0.13)] font-data text-xs text-[var(--ev-acid)] ring-1 ring-[rgba(215,255,95,0.24)]">
                  0{index + 1}
                </div>
                <p className="mt-5 text-lg font-semibold text-[var(--ev-text)]">{name}</p>
                <p className="font-data mt-1 text-[11px] uppercase tracking-normal text-[var(--ev-acid)]">{label}</p>
                <p className="mt-4 text-sm leading-6 text-[var(--ev-muted)]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Metric({ icon: Icon, label, value, detail, tone = 'neutral' }: { icon: typeof Monitor; label: string; value: number; detail: string; tone?: 'neutral' | 'danger' | 'success' }) {
  return (
    <div className="min-h-24 rounded-[22px] px-3 py-2 transition-colors hover:bg-white/[0.025]">
      <div className="flex items-center gap-2">
        <Icon size={16} className={tone === 'danger' ? 'text-[var(--ev-danger)]' : tone === 'success' ? 'text-[var(--ev-success)]' : 'text-[var(--ev-muted)]'} />
        <span className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">{label}</span>
      </div>
      <p className="font-display mt-4 text-4xl font-semibold leading-none tracking-normal text-[var(--ev-text)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--ev-faint)]">{detail}</p>
    </div>
  )
}

function LoopRow({ issue }: { issue: Issue }) {
  return (
    <Link
      href={`/dashboard/issues/${issue.id}`}
      className="ev-focus grid gap-3 px-3 py-3 transition-colors hover:bg-white/[0.03] md:grid-cols-[82px_minmax(0,1fr)_86px_84px_92px]"
    >
      <Pill tone={severityTone(issue.severity)}>{issue.severity}</Pill>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[var(--ev-text)]">{issue.title}</p>
        <p className="mt-1 truncate text-xs text-[var(--ev-muted)]">{issue.description}</p>
      </div>
      <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-muted)]">{issue.type.replace('_', ' ')}</span>
      <span className="font-data text-xs uppercase tracking-normal text-[var(--ev-muted)]">{Math.round(issue.confidence * 100)}%</span>
      <Pill tone={issue.pr_url ? 'success' : statusTone(issue.status)}>{issue.pr_url ? 'PR open' : issue.status}</Pill>
    </Link>
  )
}

function MemoryLedger() {
  const entries = [
    ['Rule updated', 'Disabled checkout buttons after failed network requests are now revenue-blocking, not UI polish.'],
    ['Feedback applied', 'QA requires two-session repro before ExterVision opens PRs touching payments.'],
    ['Regression watch', 'Promo retry, payment intent recovery, and abandon rate are watched after merge.'],
    ['Trust control', 'Auth, billing, and deletion fixes require engineering approval before auto-merge.'],
  ]

  return (
    <Panel>
      <div className="p-4">
        <h2 className="font-display text-4xl font-semibold uppercase leading-[0.9] tracking-normal text-[var(--ev-text)]">
          Memory ledger
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--ev-muted)]">
          ExterVision should expose how PM, QA, and engineering feedback changes future classifications.
        </p>
      </div>
      <div className="divide-y divide-[var(--ev-border)] border-t border-[var(--ev-border)]">
        {entries.map(([label, text]) => (
          <div key={label} className="p-4">
            <p className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-acid)]">{label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--ev-muted)]">{text}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}
