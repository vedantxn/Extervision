'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Zap } from 'lucide-react'
import type { Signal } from '@/lib/types'
import { EmptyState, PageHeader, Panel, PanelHeader, Pill } from '@/components/dashboard/ui'

export function SignalsPage({ signals: initialSignals, projectId }: { signals: Signal[]; projectId: string }) {
  const [signals, setSignals] = useState(initialSignals)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function createSignal(e: FormEvent) {
    e.preventDefault()
    setSaving(true)

    const res = await fetch('/api/signals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, name, description }),
    })

    if (res.ok) {
      const { signal } = await res.json()
      setSignals(prev => [signal, ...prev])
      setName('')
      setDescription('')
      setShowForm(false)
    }
    setSaving(false)
  }

  return (
    <div className="pt-20 lg:pt-0">
      <PageHeader
        eyebrow="ExterVision / Learnings"
        title="Learning rules"
        description="Team-defined signals and feedback patterns that teach ExterVision what product failures matter."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="ev-focus inline-flex min-h-10 items-center gap-2 rounded bg-[var(--ev-acid)] px-4 text-sm font-semibold text-[#11130b]"
          >
            <Plus size={16} />
            New learning
          </button>
        }
      />

      {showForm && (
        <form onSubmit={createSignal} className="ev-panel mb-5 space-y-4 p-5">
          <Field
            label="Learning name"
            value={name}
            onChange={setName}
            placeholder="Checkout abandonment"
          />
          <div>
            <label className="mb-1.5 block font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">What ExterVision should watch for</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              placeholder="User visits pricing, clicks upgrade, but never completes checkout within the session"
              rows={3}
              className="ev-focus w-full resize-none rounded border border-[var(--ev-border)] bg-[var(--ev-surface-raised)] px-3 py-2 text-sm text-[var(--ev-text)] placeholder:text-[var(--ev-faint)]"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="ev-focus min-h-10 rounded bg-[var(--ev-acid)] px-4 text-sm font-semibold text-[#11130b] disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create learning'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="ev-focus min-h-10 rounded border border-[var(--ev-border)] px-4 text-sm text-[var(--ev-text)] hover:bg-white/[0.04]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {signals.length === 0 ? (
        <EmptyState
          title="No learning rules"
          description="Create a signal to teach ExterVision what to watch for in replay evidence."
        />
      ) : (
        <Panel>
          <PanelHeader label="Active learning memory" value={`${signals.length} rules`} />
          <div className="divide-y divide-[var(--ev-border)]">
            {signals.map(signal => (
              <div key={signal.id} className="grid gap-3 px-3 py-3 md:grid-cols-[26px_minmax(0,1fr)_96px] md:items-center">
                <Zap size={16} className={signal.is_active ? 'text-[var(--ev-acid)]' : 'text-[var(--ev-faint)]'} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[var(--ev-text)]">{signal.name}</p>
                  <p className="mt-1 truncate text-xs text-[var(--ev-muted)]">{signal.description}</p>
                </div>
                <Pill tone={signal.is_active ? 'success' : 'neutral'}>{signal.is_active ? 'active' : 'paused'}</Pill>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        placeholder={placeholder}
        className="ev-focus w-full rounded border border-[var(--ev-border)] bg-[var(--ev-surface-raised)] px-3 py-2 text-sm text-[var(--ev-text)] placeholder:text-[var(--ev-faint)]"
      />
    </div>
  )
}
