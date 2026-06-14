'use client'

import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { CheckCircle, Save } from 'lucide-react'
import { PageHeader, Panel, PanelHeader, Pill } from '@/components/dashboard/ui'

type ExistingProject = {
  id: string
  name: string
  posthog_project_id: string
  github_repo: string
  sync_enabled: boolean
} | null

export function SettingsForm({ userId, project }: { userId: string; project: ExistingProject }) {
  const [name, setName] = useState(project?.name ?? '')
  const [posthogKey, setPosthogKey] = useState('')
  const [posthogProjectId, setPosthogProjectId] = useState(project?.posthog_project_id ?? '')
  const [openaiKey, setOpenAIKey] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [githubRepo, setGithubRepo] = useState(project?.github_repo ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    const body: Record<string, string> = {
      userId,
      name: name || 'My Project',
      posthog_project_id: posthogProjectId,
      github_repo: githubRepo,
    }
    if (posthogKey) body.posthog_api_key = posthogKey
    if (openaiKey) body.openai_api_key = openaiKey
    if (githubToken) body.github_token = githubToken
    if (project?.id) body.projectId = project.id

    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="pt-20 lg:pt-0">
      <PageHeader
        eyebrow="ExterVision / Settings"
        title="Source wiring"
        description="Connect the services that power the loop: replay evidence from PostHog, code context from GitHub, and model execution through OpenAI."
      />

      <div className="grid gap-3 xl:grid-cols-[minmax(0,760px)_340px]">
        <Panel>
          <PanelHeader label="Integration keys" value={project ? 'configured' : 'setup needed'} />
          <form onSubmit={handleSubmit} className="space-y-6 p-5">
            <Field label="Project name" value={name} onChange={setName} placeholder="My App" />

            <ServiceSection title="PostHog" description="Replay evidence, user paths, rage clicks, dead clicks, and session context.">
              <Field
                label="Personal API key"
                value={posthogKey}
                onChange={setPosthogKey}
                placeholder={project ? '••••••••  already set' : 'phx_...'}
                type="password"
              />
              <Field
                label="Project ID"
                value={posthogProjectId}
                onChange={setPosthogProjectId}
                placeholder="12345"
              />
            </ServiceSection>

            <ServiceSection title="OpenAI" description="Analysis, diagnosis, feedback learning, and generated fix plans.">
              <Field
                label="API key"
                value={openaiKey}
                onChange={setOpenAIKey}
                placeholder={project ? '••••••••  already set' : 'sk-...'}
                type="password"
              />
            </ServiceSection>

            <ServiceSection title="GitHub" description="Repository context, generated branches, and PR handoff.">
              <Field
                label="Personal access token"
                value={githubToken}
                onChange={setGithubToken}
                placeholder={project ? '••••••••  already set' : 'ghp_...'}
                type="password"
              />
              <Field
                label="Repository"
                value={githubRepo}
                onChange={setGithubRepo}
                placeholder="owner/repo"
              />
            </ServiceSection>

            <button
              type="submit"
              disabled={saving}
              className="ev-focus inline-flex min-h-11 items-center gap-2 rounded bg-[var(--ev-acid)] px-5 text-sm font-semibold text-[#11130b] disabled:opacity-50"
            >
              {saved ? <CheckCircle size={16} /> : <Save size={16} />}
              {saving ? 'Saving...' : saved ? 'Saved' : 'Save settings'}
            </button>
          </form>
        </Panel>

        <Panel>
          <div className="p-4">
            <h2 className="font-display text-4xl font-semibold uppercase leading-[0.9] tracking-normal text-[var(--ev-text)]">
              Loop readiness
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ev-muted)]">
              ExterVision needs replay evidence, code access, and model execution before it can close loops.
            </p>
          </div>
          <div className="divide-y divide-[var(--ev-border)] border-t border-[var(--ev-border)]">
            <ReadinessItem label="PostHog" active={Boolean(project?.posthog_project_id)} />
            <ReadinessItem label="GitHub repo" active={Boolean(project?.github_repo)} />
            <ReadinessItem label="Sync" active={Boolean(project?.sync_enabled)} />
          </div>
        </Panel>
      </div>
    </div>
  )
}

function ServiceSection({ title, description, children }: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="border-t border-[var(--ev-border)] pt-6">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[var(--ev-text)]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--ev-muted)]">{description}</p>
      </div>
      <div className="grid gap-4">{children}</div>
    </div>
  )
}

function ReadinessItem({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 p-4">
      <span className="text-sm text-[var(--ev-text)]">{label}</span>
      <Pill tone={active ? 'success' : 'warning'}>{active ? 'ready' : 'needed'}</Pill>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="ev-focus w-full rounded border border-[var(--ev-border)] bg-[var(--ev-surface-raised)] px-3 py-2 text-sm text-[var(--ev-text)] placeholder:text-[var(--ev-faint)]"
      />
    </div>
  )
}
