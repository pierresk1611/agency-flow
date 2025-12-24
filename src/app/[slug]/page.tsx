import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format, addDays } from 'date-fns'
import { AlertCircle, Clock, TrendingUp, Users, Euro, CheckCircle2, ListChecks, Download, PieChart as PieIcon } from "lucide-react"
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

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7)

  // 1. DATA FETCH
  const jobs = await prisma.job.findMany({
    where: { archivedAt: null, campaign: { client: { agencyId: agency.id } }, assignments: isCreative ? { some: { userId: session.userId } } : undefined },
    include: { budgets: true, campaign: { include: { client: true } }, assignments: { include: { user: true } } }
  })

  // 2. ANALYTIKA
  const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline < now)
  const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline >= now && j.deadline <= criticalThreshold)

  const budgetData = jobs.filter(j => (j.budget || 0) > 0).slice(0, 5).map(j => ({
    id: j.id, // Pridané pre preklik
    name: j.title.substring(0, 10),
    plan: Number(j.budget),
    real: Number(j.budgets.reduce((sum, b) => sum + b.amount, 0))
  }))

  const users = await prisma.user.findMany({ 
    where: { agencyId: agency.id, active: true }, 
    include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } } } 
  })
  const workloadData = users.map(u => ({ name: u.name || u.email.split('@')[0], value: u._count.assignments })).filter(v => v.value > 0)

  const statusCounts = { TODO: jobs.filter(j => j.status === 'TODO').length, IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length, DONE: jobs.filter(j => j.status === 'DONE').length }
  const jobStatusData = Object.entries(statusCounts).map(([name, value]) => ({ name, value }))

  const pendingCount = await prisma.timesheet.count({ where: { status: 'PENDING', endTime: { not: null }, jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } } })
  const approvedCount = await prisma.timesheet.count({ where: { status: 'APPROVED', jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } } })
  const tsData = [{ name: 'Výkazy', approved: approvedCount, pending: pendingCount }]

  const totalSpentAgg = await prisma.budgetItem.aggregate({ where: { job: { campaign: { client: { agencyId: agency.id } } } }, _sum: { amount: true } })
  const totalSpent = Number(totalSpentAgg._sum.amount || 0)

  let creativeTimeData: any[] = []
  if (isCreative) {
    const myTs = await prisma.timesheet.findMany({ where: { jobAssignment: { userId: session.userId }, endTime: { not: null } }, orderBy: { startTime: 'asc' }, take: 10 })
    creativeTimeData = myTs.map(t => ({ name: format(new Date(t.startTime), 'dd.MM'), minutes: t.durationMinutes || 0 }))
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic">{isCreative ? 'Môj Výkon' : 'BI Dashboard'}</h2>
        {!isCreative && (
            <Link href={`/${params.slug}/timesheets`}>
                <Button variant="outline" className="gap-2 border-slate-300 shadow-sm"><Download className="h-4 w-4" /> Export CSV</Button>
            </Link>
        )}
      </div>

      {/* KPI KARTY */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Link href={`/${params.slug}/jobs`} className="block transform transition hover:scale-105">
            <Card className="bg-slate-900 text-white h-full"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Aktívne Joby</p><div className="text-2xl font-black">{jobs.filter(j => j.status !== 'DONE').length}</div></CardContent></Card>
        </Link>
        <Card className="bg-red-600 text-white shadow-lg"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Mešká</p><div className="text-2xl font-black">{overdue.length}</div></CardContent></Card>
        <Card className="bg-amber-500 text-white shadow-lg"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Kritické (7d)</p><div className="text-2xl font-black">{warning.length}</div></CardContent></Card>
        <Link href={`/${params.slug}/agency`} className="block transform transition hover:scale-105">
            <Card className="bg-blue-600 text-white h-full"><CardContent className="pt-4"><p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">{isCreative ? 'Môj čas (min)' : 'Tím'}</p><div className="text-2xl font-black">{isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : users.length}</div></CardContent></Card>
        </Link>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* GRAF 1: PLÁN VS REAL */}
        <Card className="lg:col-span-8 shadow-xl border-none ring-1 ring-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    {/* OPRAVENÁ IKONKA PRE KREATÍVCA (KROK 4) */}
                    {isCreative ? <Clock className="h-3 w-3" /> : <Euro className="h-3 w-3" />} 
                    {isCreative ? 'Moja časová investícia' : 'Finančný stav projektov (Klik na bar pre detail)'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isCreative ? <PersonalTimeChart data={creativeTimeData} /> : <BudgetChart data={budgetData} slug={params.slug} />}
            </CardContent>
        </Card>

        {/* GRAF 2: STAV ÚLOH */}
        <Link href={`/${params.slug}/jobs`} className="lg:col-span-4 block group">
            <Card className="h-full shadow-xl border-none ring-1 ring-slate-200 group-hover:ring-blue-500 transition-all">
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
        </Link>

        {/* GRAFY PRE ADMINA */}
        {!isCreative && (
            <>
                <Card className="lg:col-span-6 shadow-xl border-none ring-1 ring-slate-200">
                    <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Users className="h-3 w-3" /> Vyťaženosť tímu (Klik pre manažment)</CardTitle></CardHeader>
                    <CardContent className="pt-6"><WorkloadChart data={workloadData} slug={params.slug} /></CardContent>
                </Card>

                <Link href={`/${params.slug}/timesheets`} className="lg:col-span-6 block group">
                    <Card className="h-full shadow-xl border-none ring-1 ring-slate-200 group-hover:ring-amber-500 transition-all">
                        <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Schvaľovanie výkazov</CardTitle></CardHeader>
                        <CardContent className="pt-6"><TimesheetStatusChart data={tsData} /></CardContent>
                    </Card>
                </Link>
            </>
        )}

        {/* URGENTNÉ KARTY (S PREKLIKOM) */}
        <Card className="lg:col-span-12 border-2 border-red-100 shadow-2xl overflow-hidden">
            <CardHeader className="bg-red-600 text-white py-3"><CardTitle className="font-black uppercase text-xs italic tracking-wider flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Urgentné úlohy (Klik pre detail)</CardTitle></CardHeader>
            <CardContent className="pt-6 bg-red-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {overdue.map(j => (
                        <Link key={j.id} href={`/${params.slug}/jobs/${j.id}`} className="block transform transition hover:scale-105">
                            <div className="p-4 bg-white border-2 border-red-500 rounded-xl shadow-md">
                                <p className="text-[9px] font-black uppercase text-red-600 mb-1">{j.campaign?.client?.name}</p>
                                <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                                <div className="mt-3 flex justify-between items-center">
                                    <Badge variant="destructive" className="font-mono text-[9px]">MEŠKÁ</Badge>
                                    <span className="text-[10px] font-bold text-red-600">{format(new Date(j.deadline), 'dd.MM')}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {warning.map(j => (
                        <Link key={j.id} href={`/${params.slug}/jobs/${j.id}`} className="block transform transition hover:scale-105">
                            <div className="p-4 bg-white border-2 border-amber-400 rounded-xl shadow-md">
                                <p className="text-[9px] font-black uppercase text-amber-600 mb-1">{j.campaign?.client?.name}</p>
                                <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                                <div className="mt-3 flex justify-between items-center">
                                    <Badge variant="outline" className="border-amber-500 text-amber-600 font-mono text-[9px]">HORÍ</Badge>
                                    <span className="text-[10px] font-bold text-amber-600">{format(new Date(j.deadline), 'dd.MM')}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}