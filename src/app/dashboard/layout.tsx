import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--ev-bg)] text-[var(--ev-text)]">
      <Sidebar />
      <main className="min-h-screen px-4 py-5 md:ml-60 md:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}
