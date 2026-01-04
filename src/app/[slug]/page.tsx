import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, addDays } from 'date-fns'
import { Euro, Users, ListChecks, CheckCircle2, Download, AlertTriangle, Clock, ArrowRightFromLine } from "lucide-react"
import Link from 'next/link'
import { NotificationWidget } from '@/components/dashboard/notification-widget'

// Grafy
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"
import { JobStatusChart } from "@/components/charts/job-status-chart"

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  // ✅ Session musí byť await
  const session = await getSession()
  if (!session) redirect('/login')

  // ✅ Získanie agency
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7)

  // 1️⃣ NAČÍTANIE JOBOV
  const jobs = await prisma.job.findMany({
    where: {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { budgets: true, campaign: { include: { client: true } }, assignments: { include: { user: true } } }
  }) || []

  // 2️⃣ ANALYTIKA: ACTIVE, OVERDUE, WARNING
  const activeCount = jobs.filter(j => j.status !== 'DONE').length
  const overdue = jobs
    .filter(j => j.status !== 'DONE' && j.deadline && j.deadline < now)
    .sort((a, b) => {
      // 1. By Deadline (ASC) - oldest first
      const dateA = new Date(a.deadline).getTime()
      const dateB = new Date(b.deadline).getTime()
      if (dateA !== dateB) return dateA - dateB

      // 2. By Client Priority (ASC) - assuming 1 is Highest
      const priorityA = a.campaign?.client?.priority || 99
      const priorityB = b.campaign?.client?.priority || 99
      return priorityA - priorityB
    })
  const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline >= now && j.deadline <= criticalThreshold)

  // 3️⃣ BUDGET DATA - Top 5 Jobs by Budget desc
  const budgetData = jobs
    .filter(j => j.budget != null && Number(j.budget) > 0)
    .sort((a, b) => Number(b.budget) - Number(a.budget))
    // .slice(0, 5) // Show ALL active projects with budget
    .map(j => ({
      id: j.id,
      name: `${j.campaign?.client?.name?.substring(0, 10) || 'Client'} - ${j.title?.substring(0, 10) || 'Job'}`,
      plan: Number(j.budget || 0),
      real: Number(j.budgets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0)
    }))

  // 4️⃣ TIMESHEETS
  const pendingCount = await prisma.timesheet.count({
    where: { status: 'PENDING', endTime: { not: null }, jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } }
  })
  const approvedCount = await prisma.timesheet.count({
    where: { status: 'APPROVED', jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } }
  })
  const tsData = [{ name: 'Výkazy', approved: approvedCount, pending: pendingCount }]

  // 5️⃣ WORKLOAD (ADMIN only) - Planned Hours for next 7 days
  let workloadData: { name: string, value: number }[] = []
  if (!isCreative) {
    const next7Days = addDays(new Date(), 7)
    const users = await prisma.user.findMany({
      where: { agencyId: agency.id, active: true },
      include: {
        plannerEntries: {
          where: {
            date: {
              gte: new Date(),
              lte: next7Days
            }
          }
        }
      }
    })

    workloadData = users.map(u => ({
      name: u.name || u.email.split('@')[0],
      value: Math.round((u.plannerEntries.reduce((sum, entry) => sum + entry.minutes, 0) / 60) * 10) / 10 // Convert to hours, 1 decimal
    })).filter(v => v.value > 0).sort((a, b) => b.value - a.value)
  }

  // 6️⃣ JOB STATUS
  const statusCounts = {
    TODO: jobs.filter(j => j.status === 'TODO').length,
    IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    DONE: jobs.filter(j => j.status === 'DONE').length
  }
  const jobStatusData = [
    { name: 'TODO', value: statusCounts.TODO },
    { name: 'IN_PROGRESS', value: statusCounts.IN_PROGRESS },
    { name: 'DONE', value: statusCounts.DONE }
  ]

  // 7️⃣ TOTAL SPENT & TEAM COUNT
  const totalSpentAgg = await prisma.budgetItem.aggregate({
    where: { job: { campaign: { client: { agencyId: agency.id } } } },
    _sum: { amount: true }
  })
  const totalSpent = Number(totalSpentAgg._sum?.amount || 0)
  const teamCount = await prisma.user.count({ where: { agencyId: agency.id, active: true } })

  // 8️⃣ CREATIVE TIME DATA
  let creativeTimeData: { name: string, minutes: number }[] = []
  if (isCreative) {
    const myTs = await prisma.timesheet.findMany({
      where: { jobAssignment: { userId: session.userId }, endTime: { not: null } },
      orderBy: { startTime: 'asc' },
      take: 10
    })
    creativeTimeData = myTs.map(t => ({
      name: t.startTime ? format(new Date(t.startTime), 'd.M.') : '—',
      minutes: t.durationMinutes || 0
    }))
  }

  // 9️⃣ NEW WIDGETS DATA
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 5
  })

  // Waiting on Approval (Admin/Traffic only)
  let pendingReassigns: any[] = []
  let pendingTimesheetsList: any[] = []

  if (!isCreative) {
    pendingReassigns = await prisma.reassignmentRequest.findMany({
      where: { status: 'PENDING', assignment: { job: { campaign: { client: { agencyId: agency.id } } } } },
      include: { requestByUser: true, assignment: { include: { job: true } } },
      take: 5
    })

    pendingTimesheetsList = await prisma.timesheet.findMany({
      where: { status: 'PENDING', endTime: { not: null }, jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } },
      include: { jobAssignment: { include: { user: true, job: true } } },
      orderBy: { startTime: 'desc' },
      take: 5
    })
  } else {
    // For Creative: Burning Tasks assigned to me
    // Already filtered in `jobs` but let's filter specifically for display
  }

  // Burning Tasks (Active & Deadline < 5 days)
  const burningTasks = jobs.filter(j => {
    if (j.status === 'DONE' || !j.deadline) return false
    const days = (new Date(j.deadline).getTime() - now.getTime()) / (1000 * 3600 * 24)
    return days < 5
  }).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()).slice(0, 5)

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">Manažérsky Prehľad</h2>
          <p className="text-slate-500 text-sm font-medium">Agentúra: {agency.name}</p>
        </div>
        {!isCreative && (
          <Link href={`/${params.slug}/timesheets`}>
            <Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </Link>
        )}
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href={`/${params.slug}/jobs`} className="block transform transition hover:scale-105">
          <Card className="bg-slate-900 text-white h-full shadow-lg border-none">
            <CardContent className="pt-4">
              <p className="text-[10px] font-bold uppercase opacity-50">Aktívne Joby</p>
              <div className="text-2xl font-black">{activeCount}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${params.slug}/jobs?filter=OVERDUE`} className="block transform transition hover:scale-105">
          <Card className="bg-red-600 text-white shadow-lg border-none h-full">
            <CardContent className="pt-4">
              <p className="text-[10px] font-bold uppercase opacity-80">Mešká</p>
              <div className="text-2xl font-black">{overdue.length}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${params.slug}/jobs?filter=CRITICAL`} className="block transform transition hover:scale-105">
          <Card className="bg-amber-500 text-white shadow-lg border-none h-full">
            <CardContent className="pt-4">
              <p className="text-[10px] font-bold uppercase opacity-80">Kritické</p>
              <div className="text-2xl font-black">{warning.length}</div>
            </CardContent>
          </Card>
        </Link>

        <Link href={isCreative ? `/${params.slug}/timesheets` : `/${params.slug}/agency`} className="block transform transition hover:scale-105">
          <Card className="bg-blue-600 text-white h-full shadow-lg border-none">
            <CardContent className="pt-4">
              <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-bold">
                <span>{isCreative ? 'Môj čas (min)' : 'Tím'}</span>
                <Users className="h-4 w-4" />
              </div>
              <div className="text-2xl font-black mt-1">
                {isCreative ? creativeTimeData.reduce((s, i) => s + i.minutes, 0) : teamCount}
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Notifications - LEFT */}
        <NotificationWidget notifications={notifications} />

        {/* Burning Tasks - CENTER */}
        <Card className="shadow-xl border-none ring-1 ring-slate-200">
          <CardHeader className="border-b bg-slate-50/50 py-3">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
              <AlertTriangle className="h-4 w-4" /> Burning Tasks ({burningTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {burningTasks.map(j => (
                <Link href={`/${params.slug}/jobs/${j.id}`} key={j.id} className="p-3 hover:bg-slate-50 block transition font-medium">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-800 truncate pr-2">{j.title}</span>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1 rounded">
                      {j.deadline ? format(new Date(j.deadline), 'd.M.') : '!'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{j.campaign?.client?.name}</p>
                </Link>
              ))}
              {burningTasks.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-400 italic">Všetko stíhame.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Waiting on Approval - RIGHT */}
        {!isCreative && (
          <Card className="shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Clock className="h-4 w-4" /> Čaká na schválenie
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {pendingReassigns.map(r => (
                  <Link href={`/${params.slug}/traffic`} key={r.id} className="p-3 hover:bg-slate-50 block transition group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-orange-600 uppercase">Presun</span>
                      <ArrowRightFromLine className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-800">{r.requestByUser.name} žiada o presun:</p>
                    <p className="text-[10px] text-slate-500 truncate">{r.assignment.job.title}</p>
                  </Link>
                ))}
                {pendingTimesheetsList.map(t => (
                  <Link href={`/${params.slug}/timesheets`} key={t.id} className="p-3 hover:bg-slate-50 block transition group">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-blue-600 uppercase">Timesheet</span>
                      <ArrowRightFromLine className="h-3 w-3 text-slate-400 group-hover:text-blue-500" />
                    </div>
                    <p className="text-xs font-medium text-slate-800">{t.jobAssignment.user.name} ({t.durationMinutes ? (t.durationMinutes / 60).toFixed(1) : '-'}h)</p>
                    <p className="text-[10px] text-slate-500 truncate">{t.jobAssignment.job.title}</p>
                  </Link>
                ))}
                {pendingReassigns.length === 0 && pendingTimesheetsList.length === 0 && (
                  <p className="p-6 text-center text-xs text-slate-400 italic">Všetko vybavené.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {!isCreative && (
          <Card className="lg:col-span-12 shadow-xl border-none ring-1 ring-slate-200 order-1">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Euro className="h-4 w-4" /> Finančný stav projektov
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <BudgetChart data={budgetData} slug={params.slug} />
            </CardContent>
          </Card>
        )}

        <Card className="lg:col-span-12 shadow-xl border-none ring-1 ring-slate-200 order-2">
          <CardHeader className="border-b bg-slate-50/50 py-3">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
              <ListChecks className="h-4 w-4" /> Stav úloh
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <JobStatusChart data={jobStatusData} />
                <div className="grid grid-cols-3 gap-2 w-full text-center mt-6">
                  <div className="bg-red-50 p-2 rounded-lg text-red-700 flex flex-col items-center justify-center">
                    <span className="font-bold text-[10px] uppercase opacity-70">TODO</span>
                    <span className="font-black text-lg">{statusCounts.TODO}</span>
                  </div>
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-700 flex flex-col items-center justify-center">
                    <span className="font-bold text-[10px] uppercase opacity-70">WORK</span>
                    <span className="font-black text-lg">{statusCounts.IN_PROGRESS}</span>
                  </div>
                  <div className="bg-green-50 p-2 rounded-lg text-green-700 flex flex-col items-center justify-center">
                    <span className="font-bold text-[10px] uppercase opacity-70">DONE</span>
                    <span className="font-black text-lg">{statusCounts.DONE}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Projekty po Deadline ({overdue.length})</h3>
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {overdue.map(j => (
                    <Link href={`/${params.slug}/jobs/${j.id}`} key={j.id} className="block p-3 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-red-900 truncate">{j.title}</p>
                          <p className="text-[10px] text-red-600 truncate mt-0.5">{j.campaign?.client?.name}</p>
                        </div>
                        <span className="text-[10px] font-bold text-red-700 bg-red-200 px-2 py-1 rounded whitespace-nowrap">
                          {j.deadline ? format(new Date(j.deadline), 'd.M.yyyy') : '—'}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {overdue.length === 0 && (
                    <p className="text-center text-xs text-slate-400 italic py-8">Žiadne projekty po deadline.</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!isCreative && (
          <Card className="lg:col-span-12 shadow-xl border-none ring-1 ring-slate-200 order-3">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Users className="h-4 w-4" /> Vyťaženosť tímu (Naplánované hodiny - 7 dní)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <WorkloadChart data={workloadData} slug={params.slug} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
