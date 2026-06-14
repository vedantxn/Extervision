'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpenCheck, Bug, GitPullRequest, History, LogOut, Monitor, Settings } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { clsx } from 'clsx'

const nav = [
  { id: 'inbox', href: '/dashboard', label: 'Inbox', meta: '12', icon: Bug },
  { id: 'loops', href: '/dashboard/issues', label: 'Loops', meta: '43', icon: History },
  { id: 'replays', href: '/dashboard/sessions', label: 'Replays', meta: '9.8k', icon: Monitor },
  { id: 'learnings', href: '/dashboard/signals', label: 'Learnings', meta: '128', icon: BookOpenCheck },
  { id: 'prs', href: '/dashboard/issues?view=pull-requests', label: 'Pull Requests', meta: '7', icon: GitPullRequest },
  { id: 'settings', href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="fixed inset-x-0 top-0 z-40 flex h-auto border-b border-[var(--ev-border)] bg-[var(--ev-bg)] md:inset-y-0 md:left-0 md:h-screen md:w-60 md:flex-col md:border-b-0 md:border-r">
      <div className="flex min-w-48 items-center gap-3 border-r border-[var(--ev-border)] px-4 py-3 md:block md:border-r-0 md:border-b md:p-5">
        <h1 className="font-display text-3xl font-semibold uppercase leading-[0.85] tracking-normal text-[var(--ev-text)]">
          Exter<br className="hidden md:block" />Vision
        </h1>
        <p className="font-data mt-0.5 text-[10px] uppercase tracking-normal text-[var(--ev-muted)]">Closed-loop quality</p>
      </div>

      <nav className="flex flex-1 gap-1 overflow-x-auto p-2 md:block md:space-y-1 md:overflow-visible md:p-3">
        {nav.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                'ev-focus flex min-w-max items-center gap-3 rounded px-3 py-2 text-sm transition-colors md:min-w-0',
                isActive
                  ? 'bg-[rgba(215,255,95,0.1)] text-[var(--ev-acid)]'
                  : 'text-[var(--ev-muted)] hover:bg-white/[0.04] hover:text-[var(--ev-text)]'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {item.meta && <span className="font-data text-[10px] text-[var(--ev-faint)]">{item.meta}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t border-[var(--ev-border)] p-3 md:block">
        <button
          onClick={handleLogout}
          className="ev-focus flex w-full items-center gap-3 rounded px-3 py-2 text-sm text-[var(--ev-muted)] transition-colors hover:bg-white/[0.04] hover:text-[var(--ev-text)]"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
