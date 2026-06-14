import { Sidebar } from '@/components/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Sidebar />
      <main className="ml-60 p-8">
        {children}
      </main>
    </div>
  )
}
