'use client'

import { useState } from 'react'
import { ArrowLeft, ExternalLink, GitPullRequest, ThumbsDown, ThumbsUp, Wrench } from 'lucide-react'
import type { Issue } from '@/lib/types'
import Link from 'next/link'
import { PageHeader, Panel, PanelHeader, Pill, severityTone, statusTone } from '@/components/dashboard/ui'

export function IssueDetail({ issue }: { issue: Issue & { issue_feedback: { verdict: string }[] } }) {
  const [feedbackGiven, setFeedbackGiven] = useState(issue.issue_feedback?.length > 0)
  const [fixing, setFixing] = useState(false)
  const [prUrl, setPrUrl] = useState(issue.pr_url)

  async function submitFeedback(verdict: 'confirmed' | 'rejected') {
    await fetch(`/api/issues/${issue.id}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verdict }),
    })
    setFeedbackGiven(true)
  }

  async function triggerFix() {
    setFixing(true)
    const res = await fetch(`/api/fix/${issue.id}`, { method: 'POST' })
    const data = await res.json()
    if (data.pr_url) setPrUrl(data.pr_url)
    setFixing(false)
  }

  return (
    <div className="pt-20 md:pt-0">
      <Link href="/dashboard/issues" className="ev-focus mb-5 inline-flex items-center gap-2 rounded text-sm text-[var(--ev-muted)] transition-colors hover:text-[var(--ev-text)]">
        <ArrowLeft size={16} />
        Back to loops
      </Link>

      <PageHeader
        eyebrow={`ExterVision / Loop EV-${issue.id.slice(0, 4)}`}
        title="Loop detail"
        description="Evidence, diagnosis, team feedback, generated fix, and memory update in one review surface."
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-3">
          <Panel>
            <PanelHeader label={issue.type.replace('_', ' ')} value={`${Math.round(issue.confidence * 100)}% confidence`} />
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                <Pill tone={severityTone(issue.severity)}>{issue.severity}</Pill>
                <Pill tone={statusTone(issue.status)}>{issue.status}</Pill>
                <Pill tone="accent">{issue.affected_component || 'Product flow'}</Pill>
              </div>
              <h1 className="mt-4 text-2xl font-semibold leading-tight text-[var(--ev-text)]">{issue.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--ev-muted)]">{issue.description}</p>
            </div>
          </Panel>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Panel>
              <PanelHeader label="Replay evidence" value="PostHog source" />
              <div className="p-3">
                <div className="ev-grid-bg relative min-h-80 overflow-hidden rounded border border-[var(--ev-border)] bg-[linear-gradient(180deg,rgba(244,241,234,0.06),rgba(244,241,234,0.015))]">
                  <div className="absolute left-4 top-4 rounded border border-[var(--ev-border)] bg-[var(--ev-surface)] px-3 py-2">
                    <p className="font-data text-[10px] uppercase tracking-normal text-[var(--ev-muted)]">Affected component</p>
                    <p className="mt-1 text-sm text-[var(--ev-text)]">{issue.affected_component || 'Unknown component'}</p>
                  </div>
                  <div className="absolute bottom-8 right-8 rounded border border-[rgba(255,92,92,0.42)] bg-[rgba(255,92,92,0.1)] px-3 py-2 font-data text-[11px] text-[#ffd8d8]">
                    failure cluster
                  </div>
                  <div className="absolute bottom-24 right-20 h-20 w-20 rounded-full border border-[rgba(255,92,92,0.72)] shadow-[0_0_0_14px_rgba(255,92,92,0.08),0_0_0_30px_rgba(255,92,92,0.04)]" />
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-4">
                  <Event label="Signal" value="Observed" />
                  <Event label="Diagnosis" value={issue.root_cause ? 'Ready' : 'Pending'} />
                  <Event label="Feedback" value={feedbackGiven ? 'Learned' : 'Needed'} />
                  <Event label="PR" value={prUrl ? 'Open' : 'Queued'} />
                </div>
              </div>
            </Panel>

            <Panel>
              <PanelHeader label="Diagnosis" value="Root cause" />
              <div className="space-y-4 p-4">
                <DetailBlock title="Root cause">{issue.root_cause || 'ExterVision has not produced a root cause yet.'}</DetailBlock>
                <DetailBlock title="Reproduction">{issue.reproduction_steps || 'No reproduction steps captured yet.'}</DetailBlock>
              </div>
            </Panel>
          </div>

          <Panel>
            <PanelHeader label="Generated fix" value={prUrl ? 'PR open' : 'ready for review'} />
            <div className="p-4">
              <pre className="overflow-x-auto rounded border border-[rgba(111,227,161,0.16)] bg-[rgba(111,227,161,0.06)] p-4 font-data text-xs leading-6 text-[var(--ev-success)]">
{issue.suggested_fix || '+ generate scoped fix\n+ add regression coverage\n+ open pull request'}
              </pre>
              {prUrl && (
                <a
                  href={prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ev-focus mt-4 inline-flex items-center gap-2 rounded text-sm text-[var(--ev-success)] transition-colors hover:text-[var(--ev-text)]"
                >
                  <GitPullRequest size={16} />
                  {prUrl}
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </Panel>
        </div>

        <aside className="grid content-start gap-3">
          <Panel>
            <PanelHeader label="Teach ExterVision" value={feedbackGiven ? 'recorded' : 'needed'} />
            <div className="p-4">
              {!feedbackGiven ? (
                <>
                  <p className="text-sm leading-6 text-[var(--ev-muted)]">
                    Your feedback updates future classification, confidence, and PR thresholds.
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => submitFeedback('confirmed')}
                      className="ev-focus inline-flex min-h-10 items-center justify-center gap-2 rounded bg-[rgba(111,227,161,0.12)] text-sm font-medium text-[var(--ev-success)] ring-1 ring-[rgba(111,227,161,0.22)]"
                    >
                      <ThumbsUp size={14} />
                      Confirm
                    </button>
                    <button
                      onClick={() => submitFeedback('rejected')}
                      className="ev-focus inline-flex min-h-10 items-center justify-center gap-2 rounded bg-[rgba(255,92,92,0.12)] text-sm font-medium text-[var(--ev-danger)] ring-1 ring-[rgba(255,92,92,0.22)]"
                    >
                      <ThumbsDown size={14} />
                      Reject
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-sm leading-6 text-[var(--ev-muted)]">Feedback recorded. ExterVision will use this loop as memory for future detections.</p>
              )}

              {!prUrl && (
                <button
                  onClick={triggerFix}
                  disabled={fixing}
                  className="ev-focus mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded bg-[var(--ev-acid)] px-4 text-sm font-semibold text-[#11130b] disabled:opacity-50"
                >
                  <Wrench size={14} />
                  {fixing ? 'Generating fix...' : 'Generate fix & PR'}
                </button>
              )}
            </div>
          </Panel>

          <Panel>
            <div className="p-4">
              <h2 className="font-display text-4xl font-semibold uppercase leading-[0.9] tracking-normal text-[var(--ev-text)]">
                Memory ledger
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ev-muted)]">
                This loop should update ExterVision&apos;s future thresholds after team review.
              </p>
            </div>
            <div className="divide-y divide-[var(--ev-border)] border-t border-[var(--ev-border)]">
              <LedgerItem label="Classification">Revenue and task-blocking failures outrank cosmetic replay noise.</LedgerItem>
              <LedgerItem label="PR policy">Risky surfaces require owner approval before merge.</LedgerItem>
              <LedgerItem label="Watch">Regression monitor arms after fix is merged.</LedgerItem>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Event({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[var(--ev-border)] bg-white/[0.02] p-2">
      <p className="font-data text-[10px] uppercase tracking-normal text-[var(--ev-muted)]">{label}</p>
      <p className="mt-2 text-xs text-[var(--ev-text)]">{value}</p>
    </div>
  )
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">{title}</h3>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--ev-text)]">{children}</p>
    </div>
  )
}

function LedgerItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <p className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-acid)]">{label}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--ev-muted)]">{children}</p>
    </div>
  )
}
