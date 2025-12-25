import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { format, addDays } from 'date-fns'
import { 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Users, 
  Euro, 
  CheckCircle2, 
  ListChecks, 
  Download, 
  PieChart as PieIcon,
  BarChart3
} from "lucide-react"
import Link from 'next/link'

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

  // 1. Overenie existencie agentúry
  const agency = await prisma.agency.findUnique({ 
    where: { slug: params.slug } 
  })
  if (!agency) return notFound()

  // 2. Bezpečnostná kontrola prístupu (Izolácia)
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    redirect('/login')
  }

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7)

  // 3. NAČÍTANIE JOBOV (Iba aktívne a nearchivované)
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { 
      budgets: true, 
      campaign: { include: { client: true } }
    }
  })

  // 4. TIMING ANALYTIKA
  const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline < now)
  const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline >= now && j.deadline <= criticalThreshold)

  // 5. BUDGET DÁTA (Bezpečné konverzie na čísla)
  const budgetData = jobs
    .filter(j => (j.budget || 0) > 0)
    .slice(0, 6)
    .map(j => ({
        id: j.id,
        name: j.title.length > 12 ? j.title.substring(0, 10) + '..' : j.title,
        plan: Number(j.budget || 0),
        real: Number(j.budgets?.reduce((sum, b) => sum + b.amount, 0) || 0)
    }))

  // 6. VYŤAŽENOSŤ TÍMU (Len pre management)
  let workloadData: any[] = []
  if (!isCreative) {
    const usersWithCounts = await prisma.user.findMany({ 
        where: { agencyId: agency.id, active: true }, 
        include: { 
            _count: { 
                select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } 
            } 
        } 
    })
    workloadData = usersWithCounts.map(u => ({ 
        name: (u.name || u.email.split('@')[0]).substring(0, 10), 
        value: u._count?.assignments || 0 
    })).filter(v => v.value > 0)
  }

  // 7. STATUSY JOBOV (Koláčový graf)
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

  // 8. TIMESHEETY (Schvaľovanie)
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
  const tsData = [{ name: 'Stav výkazov', approved: approvedCount, pending: pendingCount }]

  // 9. FINANČNÝ SUMÁR
  const totalSpentAgg = await prisma.budgetItem.aggregate({
    where: { job: { campaign: { client: { agencyId: agency.id } } } },
    _sum: { amount: true }
  })
  const totalSpent = Number(totalSpentAgg._sum?.amount || 0)
  const teamCount = await prisma.user.count({ where: { agencyId: agency.id, active: true } })

  // 10. OSOBNÁ ANALYTIKA KREATÍVCA
  let creativeTimeData: any[] = []
  if (isCreative) {
    const myTs = await prisma.timesheet.findMany({
        where: { jobAssignment: { userId: session.userId }, endTime: { not: null } },
        orderBy: { startTime: 'asc' },
        take: 10
    })
    creativeTimeData = myTs.map(t => ({ 
        name: format(new Date(t.startTime), 'd.M.'), 
        minutes: t.durationMinutes || 0 
    }))
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
              {isCreative ? 'Môj Výkon' : 'BI Dashboard'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">Agentúra: {agency.name}</p>
        </div>
        {!isCreative && (
            <Link href={`/${params.slug}/timesheets`}>
                <Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300">
                    <Download className="h-4 w-4" /> Exportovať dáta
                </Button>
            </Link>
        )}
      </div>

      {/* KPI SEKICA */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-900 text-white shadow-lg border-none">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-slate-400 uppercase text-[9px] font-black tracking-widest">
                    <span>Aktívne Joby</span>
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black mt-1">{jobs.filter(j => j.status !== 'DONE').length}</div>
            </CardContent>
        </Card>

        <Card className="bg-red-600 text-white shadow-lg border-none">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black tracking-widest">
                    <span>Mešká</span>
                    <AlertCircle className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-black mt-1">{overdue.length}</div>
            </CardContent>
        </Card>

        <Card className="bg-amber-500 text-white shadow-lg border-none">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black tracking-widest">
                    <span>Kritické (7d)</span>
                    <Clock className="h-4 w-4 text-white" />
                </div>
                <div className="text-2xl font-black mt-1">{warning.length}</div>
            </CardContent>
        </Card>

        <Link href={isCreative ? `/${params.slug}/timesheets` : `/${params.slug}/agency`} className="block">
            <Card className="bg-blue-600 text-white h-full shadow-lg border-none hover:bg-blue-700 transition-colors">
                <CardContent className="pt-6">
                    <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black tracking-widest">
                        <span>{isCreative ? 'Môj čas (min)' : 'Tím'}</span>
                        <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-2xl font-black mt-1">
                        {isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : teamCount}
                    </div>
                </CardContent>
            </Card>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* GRAF 1: PLÁN VS REAL (ALEBO ČAS PRE KREATÍVCA) */}
        <Card className="lg:col-span-8 shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    {isCreative ? <Clock className="h-3 w-3" /> : <Euro className="h-3 w-3" />} 
                    {isCreative ? 'Moja časová investícia' : 'Finančný stav projektov (Plán vs Real)'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
                {isCreative ? <PersonalTimeChart data={creativeTimeData} /> : <BudgetChart data={budgetData} slug={params.slug} />}
            </CardContent>
        </Card>

        {/* GRAF 2: STAV ÚLOH */}
        <Card className="lg:col-span-4 shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50 py-3">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <ListChecks className="h-3 w-3" /> Stav úloh
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-6">
                <JobStatusChart data={jobStatusData} />
                <div className="grid grid-cols-3 gap-2 w-full text-center mt-6">
                    <div className="bg-red-50 p-2 rounded-lg text-red-700 font-black"><p className="text-[8px] uppercase">Todo</p>{statusCounts.TODO}</div>
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-700 font-black"><p className="text-[8px] uppercase">Work</p>{statusCounts.IN_PROGRESS}</div>
                    <div className="bg-green-50 p-2 rounded-lg text-green-700 font-black"><p className="text-[8px] uppercase">Done</p>{statusCounts.DONE}</div>
                </div>
            </CardContent>
        </Card>

        {/* GRAFY PRE ADMINA */}
        {!isCreative && (
            <>
                <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
                    <CardHeader className="border-b bg-slate-50/50 py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Users className="h-3 w-3" /> Vyťaženosť tímu (Aktívne joby)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <WorkloadChart data={workloadData} slug={params.slug} />
                    </CardContent>
                </Card>

                <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
                    <CardHeader className="border-b bg-slate-50/50 py-3">
                        <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3" /> Schvaľovanie výkazov
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <TimesheetStatusChart data={tsData} />
                    </CardContent>
                </Card>
            </>
        )}

        {/* URGENTNÉ KARTY */}
        <Card className="lg:col-span-12 border-2 border-red-100 shadow-2xl overflow-hidden">
            <CardHeader className="bg-red-600 text-white py-3">
                <CardTitle className="font-black uppercase text-xs italic tracking-wider flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Pozor! Tieto úlohy vyžadujú okamžitú pozornosť
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 bg-red-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overdue.map(j => (
                        <Link key={j.id} href={`/${params.slug}/jobs/${j.id}`} className="block transform transition hover:scale-[1.02]">
                            <div className="p-4 bg-white border-2 border-red-500 rounded-xl shadow-md">
                                <p className="text-[9px] font-black uppercase text-red-600 mb-1">{j.campaign?.client?.name || 'Interný projekt'}</p>
                                <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                                <div className="mt-3 flex justify-between items-center">
                                    <Badge variant="destructive" className="font-mono text-[9px] uppercase px-2">Mešká</Badge>
                                    <span className="text-[10px] font-bold text-red-600">{format(new Date(j.deadline), 'dd.MM.yyyy')}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {warning.map(j => (
                        <Link key={j.id} href={`/${params.slug}/jobs/${j.id}`} className="block transform transition hover:scale-[1.02]">
                            <div className="p-4 bg-white border-2 border-amber-400 rounded-xl shadow-md">
                                <p className="text-[9px] font-black uppercase text-amber-600 mb-1">{j.campaign?.client?.name || 'Interný projekt'}</p>
                                <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                                <div className="mt-3 flex justify-between items-center">
                                    <Badge variant="outline" className="border-amber-500 text-amber-600 font-mono text-[9px] uppercase px-2">Horí</Badge>
                                    <span className="text-[10px] font-bold text-amber-600">
                                        DORUČIŤ ZA {Math.ceil((new Date(j.deadline).getTime() - now.getTime()) / (1000*60*60*24))} DNÍ
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {overdue.length === 0 && warning.length === 0 && (
                        <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-emerald-200">
                            <p className="text-emerald-600 font-black italic uppercase text-sm tracking-widest">Všetko je v poriadku. Žiadne horiace termíny! 🥂</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}