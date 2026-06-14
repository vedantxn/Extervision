import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardOverview } from '@/components/dashboard/overview'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)

  const project = projects?.[0]

  if (!project) {
    redirect('/dashboard/settings')
  }

  const { data: issues } = await supabase
    .from('issues')
    .select('*')
    .eq('project_id', project.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, analysis_status')
    .eq('project_id', project.id)

  const stats = {
    totalSessions: sessions?.length ?? 0,
    analyzedSessions: sessions?.filter(s => s.analysis_status === 'done').length ?? 0,
    totalIssues: issues?.length ?? 0,
    openIssues: issues?.filter(i => i.status === 'open').length ?? 0,
    criticalIssues: issues?.filter(i => i.severity === 'critical').length ?? 0,
    prsCreated: issues?.filter(i => i.pr_url).length ?? 0,
  }

  return <DashboardOverview stats={stats} recentIssues={issues ?? []} projectId={project.id} />
}
