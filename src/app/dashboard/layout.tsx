import { Sidebar } from '@/components/sidebar'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ev-bg)] text-[var(--ev-text)]">
      <Sidebar />
      <main className="min-h-screen px-4 py-5 lg:ml-64 lg:px-8">
        {children}
      </main>
    </div>
  )
}
