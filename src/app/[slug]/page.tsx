import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format, addDays } from 'date-fns'
import { Euro, Users, ListChecks, CheckCircle2, Download } from "lucide-react"
import Link from 'next/link'

// Grafy
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"
import { TimesheetStatusChart } from "@/components/charts/timesheet-status-chart"
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
  const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline < now)
  const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline >= now && j.deadline <= criticalThreshold)

  // 3️⃣ BUDGET DATA
  const budgetData = jobs.filter(j => j.budget != null && Number(j.budget) > 0).slice(0, 5).map(j => ({
    id: j.id,
    name: j.title?.substring(0, 10) || 'Untitled',
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

  // 5️⃣ WORKLOAD (ADMIN only)
  let workloadData: { name: string, value: number }[] = []
  if (!isCreative) {
    const users = await prisma.user.findMany({
      where: { agencyId: agency.id, active: true },
      include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } } }
    })
    workloadData = users.map(u => ({
      name: u.name || u.email.split('@')[0],
      value: u._count?.assignments || 0
    })).filter(v => v.value > 0)
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

        <Card className="bg-red-600 text-white shadow-lg border-none">
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase opacity-80">Mešká</p>
            <div className="text-2xl font-black">{overdue.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-amber-500 text-white shadow-lg border-none">
          <CardContent className="pt-4">
            <p className="text-[10px] font-bold uppercase opacity-80">Kritické</p>
            <div className="text-2xl font-black">{warning.length}</div>
          </CardContent>
        </Card>

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

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        {!isCreative && (
          <Card className="lg:col-span-8 shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                <Euro className="h-3 w-3" /> Finančný stav projektov
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <BudgetChart data={budgetData} slug={params.slug} />
            </CardContent>
          </Card>
        )}

        <Card className={`lg:col-span-4 shadow-xl border-none ring-1 ring-slate-200 ${isCreative ? 'lg:col-span-12' : ''}`}>
          <CardHeader className="border-b bg-slate-50/50 py-3">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
              <ListChecks className="h-3 w-3" /> Stav úloh
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <JobStatusChart data={jobStatusData} />
            <div className="grid grid-cols-3 gap-2 w-full text-center mt-6">
              <div className="bg-red-50 p-2 rounded-lg text-red-700 font-bold text-xs uppercase truncate">TODO: {statusCounts.TODO}</div>
              <div className="bg-blue-50 p-2 rounded-lg text-blue-700 font-bold text-xs uppercase truncate">WORK: {statusCounts.IN_PROGRESS}</div>
              <div className="bg-green-50 p-2 rounded-lg text-green-700 font-bold text-xs uppercase truncate">DONE: {statusCounts.DONE}</div>
            </div>
          </CardContent>
        </Card>

        {!isCreative && (
          <>
            <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <Users className="h-3 w-3" /> Vyťaženosť tímu
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <WorkloadChart data={workloadData} slug={params.slug} />
              </CardContent>
            </Card>

            <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <CheckCircle2 className="h-3 w-3" /> Schvaľovanie výkazov
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <TimesheetStatusChart data={tsData} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
