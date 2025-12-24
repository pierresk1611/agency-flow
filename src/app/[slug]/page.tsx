import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format, addDays } from 'date-fns'
import { Download, AlertCircle, Clock, TrendingUp, Users, Euro, CheckCircle2, ListTodo } from "lucide-react"
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7) // 7 dní pred deadlinom

  // 1. NAČÍTANIE JOBOV
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { budgets: true, campaign: { include: { client: true } }, assignments: { include: { user: true } } }
  })

  // 2. LOGIKA: TIMING (Overdue vs. Warning)
  const overdueJobs = jobs.filter(j => j.status !== 'DONE' && j.deadline < now)
  const warningJobs = jobs.filter(j => j.status !== 'DONE' && j.deadline >= now && j.deadline <= criticalThreshold)

  // 3. LOGIKA: BUDGETY (Plan vs Real)
  const budgetData = jobs.slice(0, 6).map(j => ({
    name: j.title.substring(0, 10) + '...',
    plan: j.budget || 0,
    real: j.budgets.reduce((sum, b) => sum + b.amount, 0)
  }))

  // 4. LOGIKA: VYŤAŽENOSŤ (Užívateľ vs Počet Jobov)
  const workloadData: any[] = []
  if (!isCreative) {
      const allUsers = await prisma.user.findMany({ where: { agencyId: agency.id, active: true }, include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' } } } } } } } })
      allUsers.forEach(u => {
          workloadData.push({ name: u.name || u.email.split('@')[0], value: u._count.assignments })
      })
  }

  // 5. TIMESHEET STATUS (Approved vs Pending)
  const timesheetStats = await prisma.timesheet.groupBy({
      by: ['status'],
      where: { jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } },
      _count: true
  })
  
  const pendingCount = timesheetStats.find(s => s.status === 'PENDING')?._count || 0
  const approvedCount = timesheetStats.find(s => s.status === 'APPROVED')?._count || 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Dashboard</h2>
          <p className="text-slate-500 text-sm">Prehľad agentúry {agency.name}</p>
        </div>
        {!isCreative && (
            <a href="/api/exports/budget" download><Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300"><Download className="h-4 w-4" /> Exportovať výkazy</Button></a>
        )}
      </div>

      {/* KPI KARTY */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500"><CardContent className="pt-6"><div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-500 uppercase">Aktívne úlohy</p><TrendingUp className="h-4 w-4 text-blue-500" /></div><div className="text-2xl font-black mt-1">{jobs.filter(j => j.status !== 'DONE').length}</div></CardContent></Card>
        <Card className="border-l-4 border-l-red-500"><CardContent className="pt-6"><div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-500 uppercase">Mešká / Horí</p><AlertCircle className="h-4 w-4 text-red-500" /></div><div className="text-2xl font-black mt-1">{overdueJobs.length} / {warningJobs.length}</div></CardContent></Card>
        <Card className="border-l-4 border-l-amber-500"><CardContent className="pt-6"><div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-500 uppercase">Čaká na schválenie</p><Clock className="h-4 w-4 text-amber-500" /></div><div className="text-2xl font-black mt-1">{pendingCount}</div></CardContent></Card>
        <Card className="border-l-4 border-l-emerald-500"><CardContent className="pt-6"><div className="flex justify-between items-center"><p className="text-xs font-bold text-slate-500 uppercase">Tím v akcii</p><Users className="h-4 w-4 text-emerald-500" /></div><div className="text-2xl font-black mt-1">{teamCount}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* GRAF 1: BUDGET VS REALITA */}
        {!isCreative && (
            <Card className="shadow-lg">
                <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-sm font-bold uppercase tracking-wider">Rozpočty: Plán vs. Realita (6 najväčších)</CardTitle></CardHeader>
                <CardContent>
                    <BudgetChart data={budgetData} />
                </CardContent>
            </Card>
        )}

        {/* GRAF 2: VYŤAŽENOSŤ TÍMU */}
        {!isCreative && (
            <Card className="shadow-lg">
                <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-sm font-bold uppercase tracking-wider">Distribúcia práce v tíme</CardTitle></CardHeader>
                <CardContent>
                    <WorkloadChart data={workloadData} />
                </CardContent>
            </Card>
        )}

        {/* SEKICA: KRITICKÝ TIMING - DETAIL */}
        <Card className={`shadow-lg ${isCreative ? 'lg:col-span-2' : ''}`}>
            <CardHeader className="border-b bg-red-50/30"><CardTitle className="text-sm font-bold uppercase text-red-900 flex items-center gap-2"><Clock className="h-4 w-4" /> Kritické termíny</CardTitle></CardHeader>
            <CardContent className="pt-4 space-y-4">
                {overdueJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-red-100/50 border border-red-200 rounded-lg">
                        <div className="flex flex-col"><span className="text-sm font-bold text-red-900">{job.title}</span><span className="text-[10px] text-red-700 font-bold uppercase">{job.campaign.client.name}</span></div>
                        <Badge variant="destructive" className="font-mono">PO TERMÍNE</Badge>
                    </div>
                ))}
                {warningJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex flex-col"><span className="text-sm font-bold text-amber-900">{job.title}</span><span className="text-[10px] text-amber-700 font-bold uppercase">{job.campaign.client.name}</span></div>
                        <Badge variant="outline" className="border-amber-500 text-amber-600 font-mono">DORUČIŤ DO 7 DNÍ</Badge>
                    </div>
                ))}
                {overdueJobs.length === 0 && warningJobs.length === 0 && <p className="text-center py-10 text-slate-400 text-sm italic">Všetky termíny sú v bezpečnej zóne. ✅</p>}
            </CardContent>
        </Card>

        {/* KREATÍVCOV ŠPECIÁL: ČAS STRÁVENÝ NA PROJEKTOCH */}
        {isCreative && (
            <Card className="shadow-lg lg:col-span-2">
                <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-sm font-bold uppercase tracking-wider">Moja efektivita a čas</CardTitle></CardHeader>
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground text-center py-10 italic">Tu sa zajtra zobrazí graf vášho času rozdelený podľa kategórií prác. 📊</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}