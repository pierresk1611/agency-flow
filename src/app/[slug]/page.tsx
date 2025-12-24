import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format, addDays } from 'date-fns'
import { Download, AlertCircle, Clock, TrendingUp, Users, Euro, PieChart } from "lucide-react"
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"

// Vynútime dynamické načítanie, aby Vercel nepadal pri builde
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  // 1. Overenie agentúry
  const agency = await prisma.agency.findUnique({ 
    where: { slug: params.slug } 
  })
  
  if (!agency) return notFound()

  // Zabezpečenie izolácie - ak nie si Superadmin, musíš patriť do tejto agentúry
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    redirect('/login')
  }

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7) 

  // 2. NAČÍTANIE JOBOV (Filtrované cez klienta na agencyId)
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      // Ak je creative, vidí len svoje
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: { 
      budgets: true, 
      campaign: { include: { client: true } }, 
      assignments: { include: { user: true } } 
    }
  })

  // 3. LOGIKA: TIMING (Overdue vs. Warning)
  const overdueJobs = jobs.filter(j => j.status !== 'DONE' && j.deadline < now)
  const warningJobs = jobs.filter(j => j.status !== 'DONE' && j.deadline >= now && j.deadline <= criticalThreshold)

  // 4. LOGIKA: BUDGETY PRE GRAF (Plan vs Real)
  // Konvertujeme na čisté čísla, aby Recharts nepadol
  const budgetData = jobs
    .filter(j => (j.budget || 0) > 0)
    .slice(0, 6)
    .map(j => ({
        name: j.title.length > 12 ? j.title.substring(0, 10) + '...' : j.title,
        plan: Number(j.budget || 0),
        real: Number(j.budgets.reduce((sum, b) => sum + b.amount, 0))
    }))

  // 5. LOGIKA: VYŤAŽENOSŤ (Iba pre Admin/Traffic/Account)
  let workloadData: any[] = []
  if (!isCreative) {
      const allUsers = await prisma.user.findMany({ 
        where: { agencyId: agency.id, active: true }, 
        include: { 
            _count: { 
                select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } 
            } 
        } 
      })
      workloadData = allUsers.map(u => ({
          name: u.name || u.email.split('@')[0],
          value: u._count.assignments
      })).filter(v => v.value > 0)
  }

  // 6. TIMESHEET STATUSY (Počítame samostatne pre stabilitu)
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

  // Celkové schválené náklady
  const totalSpentAgg = await prisma.budgetItem.aggregate({
      where: { job: { campaign: { client: { agencyId: agency.id } } } },
      _sum: { amount: true }
  })
  const totalSpent = Number(totalSpentAgg._sum.amount || 0)

  const teamCount = await prisma.user.count({ where: { active: true, agencyId: agency.id } })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Manažérsky Panel</h2>
          <p className="text-slate-500 text-sm">Agentúra: {agency.name}</p>
        </div>
        {!isCreative && (
            <a href="/api/exports/budget" download>
                <Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300">
                    <Download className="h-4 w-4" /> Export CSV
                </Button>
            </a>
        )}
      </div>

      {/* KPI KARTY */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-600 shadow-sm">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <span>{isCreative ? 'Moje úlohy' : 'Aktívne úlohy'}</span>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black mt-1">{jobs.filter(j => j.status !== 'DONE').length}</div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-600 shadow-sm">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <span>Mešká / Horí</span>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="text-2xl font-black mt-1">{overdueJobs.length} / {warningJobs.length}</div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <span>K schváleniu</span>
                    <Clock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black mt-1">{pendingCount}</div>
            </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center text-slate-500 uppercase text-[10px] font-black tracking-widest">
                    <span>{isCreative ? 'Schválené' : 'Tím v akcii'}</span>
                    <Users className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black mt-1">{isCreative ? approvedCount : teamCount}</div>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* GRAFY PRE MANAGMENT */}
        {!isCreative && budgetData.length > 0 && (
            <Card className="shadow-lg border-none ring-1 ring-slate-200">
                <CardHeader className="border-b bg-slate-50/50 py-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Rozpočty: Plán vs. Realita</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <BudgetChart data={budgetData} />
                </CardContent>
            </Card>
        )}

        {!isCreative && workloadData.length > 0 && (
            <Card className="shadow-lg border-none ring-1 ring-slate-200">
                <CardHeader className="border-b bg-slate-50/50 py-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Vyťaženosť kolegov</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <WorkloadChart data={workloadData} />
                </CardContent>
            </Card>
        )}

        {/* KRITICKÉ TERMÍNY */}
        <Card className={`shadow-lg border-none ring-1 ring-slate-200 ${isCreative || budgetData.length === 0 ? 'lg:col-span-2' : ''}`}>
            <CardHeader className="border-b bg-red-50/50 py-3">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-red-900 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Kritické termíny
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {overdueJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-red-900">{job.title}</span>
                            <span className="text-[10px] text-red-700 font-bold uppercase">{job.campaign.client.name}</span>
                        </div>
                        <Badge variant="destructive" className="font-mono text-[10px]">PO TERMÍNE</Badge>
                    </div>
                ))}
                {warningJobs.map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-amber-900">{job.title}</span>
                            <span className="text-[10px] text-amber-700 font-bold uppercase">{job.campaign.client.name}</span>
                        </div>
                        <Badge variant="outline" className="border-amber-400 text-amber-700 font-mono text-[10px]">HORÍ (7 DNÍ)</Badge>
                    </div>
                ))}
                {overdueJobs.length === 0 && warningJobs.length === 0 && (
                    <div className="text-center py-10 text-slate-400 italic text-sm">Žiadne kritické termíny. ✅</div>
                )}
            </CardContent>
        </Card>

        {/* FINANČNÝ SUMÁR (Iba Admin) */}
        {!isCreative && (
            <Card className="shadow-lg border-none ring-1 ring-slate-200 lg:col-span-2">
                <CardHeader className="border-b bg-slate-900 text-white py-3">
                    <CardTitle className="text-xs font-black uppercase tracking-widest">Finančný Sumár Agentúry</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm text-slate-500 font-medium">Celková hodnota schválenej práce</p>
                            <p className="text-4xl font-black text-slate-900">{totalSpent.toFixed(2)} €</p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Schválené výkazy</p>
                            <p className="text-xl font-bold text-emerald-600">{approvedCount} ks</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}