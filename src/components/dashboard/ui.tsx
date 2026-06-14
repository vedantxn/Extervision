import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-acid)]">{eyebrow}</p>
        <h1 className="font-display mt-2 text-5xl font-semibold uppercase leading-[0.9] tracking-normal text-[var(--ev-text)] md:text-6xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ev-muted)]">{description}</p>
      </div>
      {action}
    </div>
  )
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <section className={clsx('ev-panel overflow-hidden', className)}>{children}</section>
}

export function PanelHeader({
  label,
  value,
}: {
  label: string
  value?: string
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 border-b border-[var(--ev-border)] px-3">
      <span className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">{label}</span>
      {value && <span className="font-data text-[11px] uppercase tracking-normal text-[var(--ev-muted)]">{value}</span>}
    </div>
  )
}

export function Pill({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'blue'
  className?: string
}) {
  return (
    <span
      className={clsx(
        'inline-flex min-h-6 items-center rounded px-2 font-data text-[11px] font-medium uppercase tracking-normal',
        tone === 'neutral' && 'bg-white/[0.04] text-[var(--ev-muted)] ring-1 ring-white/[0.08]',
        tone === 'accent' && 'bg-[rgba(215,255,95,0.12)] text-[var(--ev-acid)] ring-1 ring-[rgba(215,255,95,0.22)]',
        tone === 'success' && 'bg-[rgba(111,227,161,0.12)] text-[var(--ev-success)] ring-1 ring-[rgba(111,227,161,0.22)]',
        tone === 'warning' && 'bg-[rgba(242,184,75,0.12)] text-[var(--ev-warning)] ring-1 ring-[rgba(242,184,75,0.22)]',
        tone === 'danger' && 'bg-[rgba(255,92,92,0.12)] text-[var(--ev-danger)] ring-1 ring-[rgba(255,92,92,0.22)]',
        tone === 'blue' && 'bg-[rgba(114,167,255,0.12)] text-[var(--ev-blue)] ring-1 ring-[rgba(114,167,255,0.22)]',
        className,
      )}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="ev-panel flex min-h-56 flex-col items-center justify-center px-6 py-10 text-center">
      <p className="font-display text-2xl font-semibold uppercase leading-none tracking-normal text-[var(--ev-text)]">{title}</p>
      <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ev-muted)]">{description}</p>
    </div>
  )
}

export function severityTone(severity: string): 'neutral' | 'success' | 'warning' | 'danger' {
  if (severity === 'critical' || severity === 'high') return 'danger'
  if (severity === 'medium') return 'warning'
  if (severity === 'low') return 'neutral'
  return 'neutral'
}

export function statusTone(status: string | null): 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'blue' {
  if (status === 'confirmed' || status === 'fixed' || status === 'merged' || status === 'done') return 'success'
  if (status === 'open' || status === 'analyzing') return 'blue'
  if (status === 'pending') return 'warning'
  if (status === 'rejected' || status === 'closed') return 'danger'
  return 'neutral'
}
