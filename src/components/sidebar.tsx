'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpenCheck, Bug, GitPullRequest, History, LogOut, Monitor, Settings } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { clsx } from 'clsx'

const nav = [
  { id: 'inbox', href: '/dashboard', label: 'Inbox', icon: Bug },
  { id: 'loops', href: '/dashboard/issues', label: 'Loops', icon: History },
  { id: 'replays', href: '/dashboard/sessions', label: 'Replays', icon: Monitor },
  { id: 'learnings', href: '/dashboard/signals', label: 'Learnings', icon: BookOpenCheck },
  { id: 'prs', href: '/dashboard/issues?view=pull-requests', label: 'Pull Requests', icon: GitPullRequest },
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
    <aside className="fixed inset-x-0 top-0 z-40 flex h-auto border-b border-white/[0.05] bg-[rgba(11,13,11,0.86)] backdrop-blur-xl lg:inset-y-0 lg:left-0 lg:h-screen lg:w-64 lg:flex-col lg:border-b-0 lg:border-r">
      <div className="flex min-w-40 items-center gap-3 border-r border-white/[0.05] px-4 py-3 lg:block lg:border-r-0 lg:border-b lg:p-5">
        <h1 className="font-display text-2xl font-semibold uppercase leading-[0.85] tracking-normal text-[var(--ev-text)] lg:text-3xl">
          Exter<br className="hidden lg:block" />Vision
        </h1>
        <p className="hidden font-data mt-1 text-[10px] uppercase tracking-normal text-[var(--ev-muted)] sm:block">Closed-loop quality</p>
      </div>

      <nav className="flex flex-1 gap-1 overflow-x-auto p-2 lg:block lg:space-y-1 lg:overflow-visible lg:p-3">
        {nav.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                'ev-focus flex min-w-max items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors lg:min-w-0 lg:gap-3 lg:rounded-2xl',
                isActive
                  ? 'bg-[linear-gradient(135deg,rgba(215,255,95,0.16),rgba(111,232,255,0.08))] text-[var(--ev-acid)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-[var(--ev-muted)] hover:bg-white/[0.04] hover:text-[var(--ev-text)]'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="hidden border-t border-[var(--ev-border)] p-3 lg:block">
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
