import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, addDays } from 'date-fns'
import { AlertCircle, Clock, TrendingUp, Users, Euro, CheckCircle2, ListChecks, BarChart3 } from "lucide-react"

// Importy grafov
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

  // 1. NAČÍTANIE JOBOV
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

  // 3. BUDGET ANALYTICS
  const budgetData = jobs.filter(j => (j.budget || 0) > 0).slice(0, 5).map(j => ({
    name: j.title.substring(0, 10),
    plan: Number(j.budget || 0),
    real: Number(j.budgets.reduce((sum, b) => sum + b.amount, 0))
  }))

  // 4. WORKLOAD ANALYTICS (Admin only)
  let workloadData: any[] = []
  if (!isCreative) {
    const users = await prisma.user.findMany({ 
        where: { agencyId: agency.id, active: true }, 
        include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } } } 
    })
    workloadData = users.map(u => ({ name: u.name || u.email.split('@')[0], value: u._count.assignments })).filter(v => v.value > 0)
  }

  // 5. JOB STATUS ANALYTICS
  const statusCounts = {
    TODO: jobs.filter(j => j.status === 'TODO').length,
    IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
    DONE: jobs.filter(j => j.status === 'DONE').length,
  }
  const jobStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  // 6. TIMESHEET ANALYTICS
  const pendingCount = await prisma.timesheet.count({
    where: { 
        status: 'PENDING',
        endTime: { not: null },
        jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } }
    }
  })
  const approvedCount = await prisma.timesheet.count({
    where: { 
        status: 'APPROVED',
        jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } }
    }
  })
  const tsData = [{ name: 'Výkazy', approved: approvedCount, pending: pendingCount }]

  // 7. FINANCIE A TÍM (TOTO CHÝBALO)
  const totalSpentAgg = await prisma.budgetItem.aggregate({
    where: { job: { campaign: { client: { agencyId: agency.id } } } },
    _sum: { amount: true }
  })
  const totalSpent = Number(totalSpentAgg._sum.amount || 0)
  const teamCount = await prisma.user.count({ where: { agencyId: agency.id, active: true } })

  // 8. KREATÍVCOVA ŠPECIÁLNA ANALYTIKA
  let creativeTimeData: any[] = []
  if (isCreative) {
    const myTimesheets = await prisma.timesheet.findMany({
        where: { jobAssignment: { userId: session.userId }, endTime: { not: null } },
        orderBy: { startTime: 'asc' },
        take: 10
    })
    creativeTimeData = myTimesheets.map(t => ({ name: format(new Date(t.startTime), 'dd.MM'), minutes: t.durationMinutes || 0 }))
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">{isCreative ? 'Môj Výkon' : 'Manažérsky Prehľad'}</h2>
        <Badge variant="outline" className="font-bold border-slate-300">{agency.name}</Badge>
      </div>

      {/* KPI SEKICA */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 text-white shadow-lg"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Aktívne Joby</p><div className="text-2xl font-black">{jobs.filter(j => j.status !== 'DONE').length}</div></CardContent></Card>
        <Card className="bg-red-600 text-white shadow-lg"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Mešká</p><div className="text-2xl font-black">{overdue.length}</div></CardContent></Card>
        <Card className="bg-amber-500 text-white shadow-lg"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Kritické (7d)</p><div className="text-2xl font-black">{warning.length}</div></CardContent></Card>
        <Card className="bg-blue-600 text-white shadow-lg"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">{isCreative ? 'Môj čas (min)' : 'Tím'}</p><div className="text-2xl font-black">{isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : teamCount}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* GRAF 1: PLÁN VS REAL (ALEBO ČAS PRE KREATÍVCA) */}
        <Card className="lg:col-span-8 shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Euro className="h-3 w-3" /> {isCreative ? 'Moja časová investícia' : 'Finančný stav projektov (Plán vs Real)'}</CardTitle></CardHeader>
            <CardContent>
                {isCreative ? <PersonalTimeChart data={creativeTimeData} /> : <BudgetChart data={budgetData} />}
            </CardContent>
        </Card>

        {/* GRAF 2: STAV ÚLOH */}
        <Card className="lg:col-span-4 shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><ListChecks className="h-3 w-3" /> Stav úloh</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center pt-6">
                <JobStatusChart data={jobStatusData} />
                <div className="grid grid-cols-3 gap-2 w-full text-center mt-6">
                    <div className="bg-red-50 p-2 rounded-lg"><p className="text-[9px] font-black text-red-500 uppercase">Todo</p><p className="font-black text-red-700">{statusCounts.TODO}</p></div>
                    <div className="bg-blue-50 p-2 rounded-lg"><p className="text-[9px] font-black text-blue-500 uppercase">Work</p><p className="font-black text-blue-700">{statusCounts.IN_PROGRESS}</p></div>
                    <div className="bg-green-50 p-2 rounded-lg"><p className="text-[9px] font-black text-green-500 uppercase">Done</p><p className="font-black text-green-700">{statusCounts.DONE}</p></div>
                </div>
            </CardContent>
        </Card>

        {/* GRAFY PRE ADMINA */}
        {!isCreative && (
            <>
                <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-3 w-3" /> Vyťaženosť tímu (Aktívne joby)</CardTitle></CardHeader>
                    <CardContent className="pt-6"><WorkloadChart data={workloadData} /></CardContent>
                </Card>

                <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200 overflow-hidden">
                    <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Schvaľovanie výkazov</CardTitle></CardHeader>
                    <CardContent className="pt-6"><TimesheetStatusChart data={tsData} /></CardContent>
                </Card>
            </>
        )}

        {/* URGENTNÉ KARTY */}
        <Card className="lg:col-span-12 border-2 border-red-100 shadow-2xl overflow-hidden">
            <CardHeader className="bg-red-600 text-white py-3"><CardTitle className="font-black uppercase text-xs italic tracking-wider flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Pozor! Tieto úlohy vyžadujú okamžitú pozornosť</CardTitle></CardHeader>
            <CardContent className="pt-6 bg-red-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overdue.map(j => (
                        <div key={j.id} className="p-4 bg-white border-2 border-red-500 rounded-xl shadow-md">
                            <p className="text-[9px] font-black uppercase text-red-600 mb-1">{j.campaign?.client?.name || 'Klient'}</p>
                            <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                            <div className="mt-3 flex justify-between items-center">
                                <Badge variant="destructive" className="font-mono text-[9px] uppercase">MEŠKÁ</Badge>
                                <span className="text-[10px] font-bold text-red-600">{format(new Date(j.deadline), 'dd.MM.yyyy')}</span>
                            </div>
                        </div>
                    ))}
                    {warning.map(j => (
                        <div key={j.id} className="p-4 bg-white border-2 border-amber-400 rounded-xl shadow-md">
                            <p className="text-[9px] font-black uppercase text-amber-600 mb-1">{j.campaign?.client?.name || 'Klient'}</p>
                            <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                            <div className="mt-3 flex justify-between items-center">
                                <Badge variant="outline" className="border-amber-500 text-amber-600 font-mono text-[9px] uppercase">HORÍ</Badge>
                                <span className="text-[10px] font-bold text-amber-600">ZA {Math.ceil((new Date(j.deadline).getTime() - now.getTime()) / (1000*60*60*24))} DNÍ</span>
                            </div>
                        </div>
                    ))}
                    {overdue.length === 0 && warning.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-emerald-200">
                            <p className="text-emerald-600 font-black italic uppercase text-sm tracking-widest">Všetko je pod kontrolou. Žiadne horiace termíny! 🥂</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}