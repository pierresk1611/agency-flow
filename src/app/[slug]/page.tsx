import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, addDays } from 'date-fns'
import { AlertCircle, Clock, TrendingUp, Users, Euro, CheckCircle2, ListChecks, BarChart3 } from "lucide-react"

// Importy našich nových grafov
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"
import { TimesheetStatusChart } from "@/components/charts/timesheet-status-chart"
import { JobStatusChart } from "@/components/charts/job-status-chart"
import { PersonalTimeChart } from "@/components/charts/personal-time-chart"

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7)

  // 1. DATA FETCH: JOBY
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { budgets: true, campaign: { include: { client: true } }, assignments: { include: { user: true } } }
  })

  // 2. TIMING ANALYTICS
  const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline < now)
  const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline >= now && j.deadline <= criticalThreshold)

  // 3. BUDGET ANALYTICS (Plan vs Real)
  const budgetData = jobs.filter(j => (j.budget || 0) > 0).slice(0, 5).map(j => ({
    name: j.title.substring(0, 10),
    plan: Number(j.budget),
    real: Number(j.budgets.reduce((sum, b) => sum + b.amount, 0))
  }))

  // 4. WORKLOAD ANALYTICS (Admin only)
  let workloadData: any[] = []
  if (!isCreative) {
    const users = await prisma.user.findMany({ 
        where: { agencyId: agency.id, active: true }, 
        include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' } } } } } } } 
    })
    workloadData = users.map(u => ({ name: u.name || u.email.split('@')[0], value: u._count.assignments }))
  }

  // 5. JOB STATUS ANALYTICS (Pie)
  const statusCounts = {
    TODO: jobs.filter(j => j.status === 'TODO').length,
    IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    DONE: jobs.filter(j => j.status === 'DONE').length,
  }
  const jobStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // 6. TIMESHEET ANALYTICS (Approved vs Pending)
  const tsGrouped = await prisma.timesheet.groupBy({
    by: ['status'],
    where: { jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } },
    _count: true
  })
  const tsData = [{
    name: 'Timesheety',
    approved: tsGrouped.find(g => g.status === 'APPROVED')?._count || 0,
    pending: tsGrouped.find(g => g.status === 'PENDING')?._count || 0,
  }]

  // 7. KREATÍVCOVA ŠPECIÁLNA ANALYTIKA
  let creativeTimeData: any[] = []
  if (isCreative) {
    const myTimesheets = await prisma.timesheet.findMany({
        where: { jobAssignment: { userId: session.userId } },
        orderBy: { startTime: 'asc' },
        take: 10
    })
    creativeTimeData = myTimesheets.map(t => ({ name: format(new Date(t.startTime), 'dd.MM'), minutes: t.durationMinutes || 0 }))
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">{isCreative ? 'Môj Výkon' : 'BI Dashboard'}</h2>
        <Badge variant="outline" className="font-mono">{agency.name}</Badge>
      </div>

      {/* KPI SEKICA */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 text-white"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-50">Aktívne Joby</p><div className="text-2xl font-black">{jobs.filter(j => j.status !== 'DONE').length}</div></CardContent></Card>
        <Card className="bg-red-600 text-white"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80">Mešká</p><div className="text-2xl font-black">{overdue.length}</div></CardContent></Card>
        <Card className="bg-amber-500 text-white"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80">Kritické (7 dní)</p><div className="text-2xl font-black">{warning.length}</div></CardContent></Card>
        <Card className="bg-blue-600 text-white"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80">{isCreative ? 'Môj čas (min)' : 'Tím'}</p><div className="text-2xl font-black">{isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : teamCount}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* --- PRVÝ RAD GRAFOV --- */}
        <Card className="lg:col-span-8 shadow-xl">
            <CardHeader className="border-b"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Euro className="h-4 w-4" /> Finančný stav projektov (Plán vs Real)</CardTitle></CardHeader>
            <CardContent>
                {isCreative ? <PersonalTimeChart data={creativeTimeData} /> : <BudgetChart data={budgetData} />}
            </CardContent>
        </Card>

        <Card className="lg:col-span-4 shadow-xl">
            <CardHeader className="border-b"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><ListChecks className="h-4 w-4" /> Stav úloh</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center">
                <JobStatusChart data={jobStatusData} />
                <div className="grid grid-cols-3 gap-4 w-full text-center mt-4">
                    <div><p className="text-[10px] font-bold text-red-500">TODO</p><p className="font-black">{statusCounts.TODO}</p></div>
                    <div><p className="text-[10px] font-bold text-blue-500">WORK</p><p className="font-black">{statusCounts.IN_PROGRESS}</p></div>
                    <div><p className="text-[10px] font-bold text-green-500">DONE</p><p className="font-black">{statusCounts.DONE}</p></div>
                </div>
            </CardContent>
        </Card>

        {/* --- DRUHÝ RAD GRAFOV (Iba Admin) --- */}
        {!isCreative && (
            <>
                <Card className="lg:col-span-6 shadow-xl">
                    <CardHeader className="border-b"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-4 w-4" /> Vyťaženosť tímu (Počet jobov)</CardTitle></CardHeader>
                    <CardContent><WorkloadChart data={workloadData} /></CardContent>
                </Card>

                <Card className="lg:col-span-6 shadow-xl">
                    <CardHeader className="border-b"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Efektivita schvaľovania výkazov</CardTitle></CardHeader>
                    <CardContent><TimesheetStatusChart data={tsData} /></CardContent>
                </Card>
            </>
        )}

        {/* KRITICKÉ LISTY (Vždy na očiach) */}
        <Card className="lg:col-span-12 border-2 border-red-100 shadow-2xl">
            <CardHeader className="bg-red-50 border-b"><CardTitle className="text-red-600 font-black uppercase text-sm italic">Urgentné zadania (Overdue & Soon)</CardTitle></CardHeader>
            <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overdue.map(j => (
                        <div key={j.id} className="p-4 bg-red-600 text-white rounded-xl shadow-lg animate-pulse">
                            <p className="text-[10px] font-black uppercase opacity-70">{j.campaign.client.name}</p>
                            <h4 className="font-bold truncate">{j.title}</h4>
                            <p className="text-[10px] mt-2 font-mono">DEADLINE BOL: {format(new Date(j.deadline), 'dd.MM.yyyy')}</p>
                        </div>
                    ))}
                    {warning.map(j => (
                        <div key={j.id} className="p-4 bg-amber-100 border-2 border-amber-400 rounded-xl">
                            <p className="text-[10px] font-black uppercase text-amber-700">{j.campaign.client.name}</p>
                            <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                            <p className="text-[10px] mt-2 font-mono text-amber-700">KONČÍ O {Math.ceil((new Date(j.deadline).getTime() - now.getTime()) / (1000*60*60*24))} DNÍ</p>
                        </div>
                    ))}
                    {overdue.length === 0 && warning.length === 0 && (
                        <div className="col-span-full py-10 text-center text-emerald-600 font-bold italic">Žiadne horiace termíny. Skvelá práca! 🥂</div>
                    )}
                </div>
            </CardContent>
        </Card>

      </div>
    </div>
  )
}