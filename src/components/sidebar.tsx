'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Monitor, Bug, Zap, Settings, LogOut } from 'lucide-react'
import { createBrowserSupabase } from '@/lib/supabase/client'
import { clsx } from 'clsx'

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/sessions', label: 'Sessions', icon: Monitor },
  { href: '/dashboard/issues', label: 'Issues', icon: Bug },
  { href: '/dashboard/signals', label: 'Signals', icon: Zap },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="w-60 h-screen fixed left-0 top-0 bg-zinc-950 border-r border-zinc-800 flex flex-col">
      <div className="p-5 border-b border-zinc-800">
        <h1 className="text-lg font-bold text-white">FlyVision</h1>
        <p className="text-xs text-zinc-500 mt-0.5">Autonomous Bug Fixing</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(item => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600/10 text-blue-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-zinc-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 w-full transition-colors"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
