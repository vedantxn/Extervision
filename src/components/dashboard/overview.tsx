'use client'

import { useState } from 'react'
import { Monitor, Bug, GitPullRequest, AlertTriangle, RefreshCw, Zap, Power } from 'lucide-react'
import type { Issue } from '@/lib/types'
import { clsx } from 'clsx'

type Stats = {
  totalSessions: number
  analyzedSessions: number
  totalIssues: number
  openIssues: number
  criticalIssues: number
  prsCreated: number
}

export function DashboardOverview({ stats, recentIssues, projectId }: { stats: Stats; recentIssues: Issue[]; projectId: string }) {
  const [syncing, setSyncing] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [agentRunning, setAgentRunning] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

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
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">AI is watching your product 24/7</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={async () => {
              setAgentRunning(true)
              setSyncResult(null)
              const res = await fetch('/api/agent/start', { method: 'POST' })
              const data = await res.json()
              setSyncResult(data.message ?? 'Agent started')
            }}
            disabled={agentRunning}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            <Power size={16} className={agentRunning ? 'animate-pulse' : ''} />
            {agentRunning ? 'Agent Running' : 'Start Agent'}
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            Sync Sessions
          </button>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
          >
            <Zap size={16} className={analyzing ? 'animate-pulse' : ''} />
            Analyze & Fix
          </button>
        </div>
      </div>

      {syncResult && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-blue-400 text-sm mb-6">
          {syncResult}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={Monitor} label="Sessions" value={stats.totalSessions} sub={`${stats.analyzedSessions} analyzed`} />
        <StatCard icon={Bug} label="Issues Found" value={stats.totalIssues} sub={`${stats.openIssues} open`} />
        <StatCard icon={AlertTriangle} label="Critical" value={stats.criticalIssues} sub="need attention" color="red" />
        <StatCard icon={GitPullRequest} label="PRs Pushed" value={stats.prsCreated} sub="auto-generated" color="green" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Recent Issues</h2>
        {recentIssues.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
            <p className="text-zinc-400">No issues detected yet. Sync sessions and run analysis to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentIssues.map(issue => (
              <IssueRow key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Monitor; label: string; value: number; sub: string; color?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className={color === 'red' ? 'text-red-400' : color === 'green' ? 'text-green-400' : 'text-zinc-400'} />
        <span className="text-sm text-zinc-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-zinc-500 mt-1">{sub}</p>
    </div>
  )
}

function IssueRow({ issue }: { issue: Issue }) {
  return (
    <a
      href={`/dashboard/issues/${issue.id}`}
      className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors"
    >
      <span className={clsx(
        'px-2 py-0.5 rounded text-xs font-medium',
        issue.severity === 'critical' && 'bg-red-500/10 text-red-400',
        issue.severity === 'high' && 'bg-orange-500/10 text-orange-400',
        issue.severity === 'medium' && 'bg-yellow-500/10 text-yellow-400',
        issue.severity === 'low' && 'bg-zinc-700/50 text-zinc-400',
      )}>
        {issue.severity}
      </span>
      <span className="text-white flex-1 text-sm">{issue.title}</span>
      <span className="text-xs text-zinc-500">{issue.type}</span>
      {issue.pr_url && (
        <span className="text-xs text-green-400 flex items-center gap-1">
          <GitPullRequest size={12} /> PR
        </span>
      )}
      <span className={clsx(
        'text-xs px-2 py-0.5 rounded',
        issue.status === 'open' && 'bg-blue-500/10 text-blue-400',
        issue.status === 'confirmed' && 'bg-green-500/10 text-green-400',
        issue.status === 'rejected' && 'bg-zinc-700/50 text-zinc-400',
        issue.status === 'fixed' && 'bg-purple-500/10 text-purple-400',
      )}>
        {issue.status}
      </span>
    </a>
  )
}
