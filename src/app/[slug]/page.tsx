import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format, addDays, differenceInDays } from 'date-fns'
import { 
  AlertCircle, Clock, TrendingUp, Users, Euro, 
  CheckCircle2, ListChecks, Download, PieChart as PieIcon, BarChart3, Trophy
} from "lucide-react"
import Link from 'next/link'

// Importy našich grafov
import { BudgetChart } from "@/components/charts/budget-chart"
import { WorkloadChart } from "@/components/charts/workload-chart"
import { TimesheetStatusChart } from "@/components/charts/timesheet-status-chart"
import { JobStatusChart } from "@/components/charts/job-status-chart"
import { PersonalTimeChart } from "@/components/charts/personal-time-chart"

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  // 1. Zabezpečenie agentúry
  const agency = await prisma.agency.findUnique({ 
    where: { slug: params.slug },
    include: { _count: { select: { users: true } } }
  })
  if (!agency) return notFound()
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

  const isCreative = session.role === 'CREATIVE'
  const now = new Date()
  const criticalThreshold = addDays(now, 7)

  try {
    // 2. NAČÍTANIE JOBOV (Iba aktívne a patriace k agentúre)
    const jobs = await prisma.job.findMany({
      where: { 
        archivedAt: null,
        campaign: { client: { agencyId: agency.id } },
        assignments: isCreative ? { some: { userId: session.userId } } : undefined
      },
      include: { 
        budgets: true, 
        campaign: { include: { client: true } }, 
        assignments: { include: { user: true } } 
      }
    }) || []

    // 3. NAČÍTANIE TENDROV (ZAPOJENÉ vs VYHRANÉ)
    const tenders = await prisma.tender.findMany({
      where: { agencyId: agency.id }
    }) || []

    const wonTenders = tenders.filter(t => t.isConverted).length
    const activeTenders = tenders.filter(t => !t.isConverted).length

    // 4. TIMING ANALYTIKA
    const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline < now)
    const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline && j.deadline >= now && j.deadline <= criticalThreshold)

    // 5. BUDGET DÁTA (Pre graf)
    const budgetData = jobs
      .filter(j => (j.budget || 0) > 0)
      .slice(0, 5)
      .map(j => ({
          id: j.id,
          name: j.title.substring(0, 10),
          plan: Number(j.budget || 0),
          real: Number(j.budgets?.reduce((sum, b) => sum + b.amount, 0) || 0)
      }))

    // 6. VYŤAŽENOSŤ (Užívateľ vs Počet Jobov)
    let workloadData: any[] = []
    if (!isCreative) {
      const allUsers = await prisma.user.findMany({ 
        where: { agencyId: agency.id, active: true }, 
        include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } } } 
      })
      workloadData = allUsers
        .map(u => ({ name: u.name || u.email.split('@')[0], value: u._count?.assignments || 0 }))
        .filter(v => v.value > 0)
    }

    // 7. TIMESHEET ANALYTIKA (Approved vs Pending)
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

    // 8. FINANČNÝ SUMÁR
    const totalSpentAgg = await prisma.budgetItem.aggregate({
      where: { job: { campaign: { client: { agencyId: agency.id } } } },
      _sum: { amount: true }
    })
    const totalSpent = Number(totalSpentAgg._sum?.amount || 0)

    // 9. KREATÍVCOVA ŠPECIÁLNA ANALYTIKA
    let creativeTimeData: any[] = []
    if (isCreative) {
      const myTs = await prisma.timesheet.findMany({
          where: { jobAssignment: { userId: session.userId }, endTime: { not: null } },
          orderBy: { startTime: 'asc' },
          take: 10
      })
      creativeTimeData = myTs.map(t => ({ 
        name: format(new Date(t.startTime), 'd.M.'), 
        minutes: Number(t.durationMinutes || 0) 
      }))
    }

    const statusCounts = {
        TODO: jobs.filter(j => j.status === 'TODO').length,
        IN_PROGRESS: jobs.filter(j => j.status === 'IN_PROGRESS').length,
        DONE: jobs.filter(j => j.status === 'DONE').length
    }

    return (
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">
                {isCreative ? 'Môj Výkon' : 'BI Dashboard'}
            </h2>
            <p className="text-slate-500 text-sm font-medium">Agentúra: {agency.name}</p>
          </div>
          {!isCreative && (
              <Link href={`/${params.slug}/timesheets`}>
                  <Button variant="outline" className="gap-2 shadow-sm font-bold border-slate-300">
                      <Download className="h-4 w-4" /> Exportovať výkazy
                  </Button>
              </Link>
          )}
        </div>

        {/* KPI SEKICA */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-slate-400 uppercase text-[9px] font-black tracking-widest">
                      <span>Aktívne Joby</span>
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black mt-1">{jobs.filter(j => j.status !== 'DONE').length}</div>
              </CardContent>
          </Card>

          <Card className="bg-red-600 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black tracking-widest">
                      <span>Mešká</span>
                      <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-black mt-1">{overdue.length}</div>
              </CardContent>
          </Card>

          <Card className="bg-amber-500 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black tracking-widest">
                      <span>Kritické (7d)</span>
                      <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-black mt-1">{warning.length}</div>
              </CardContent>
          </Card>

          <Card className="bg-blue-600 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black tracking-widest">
                      <span>{isCreative ? 'Môj čas (min)' : 'Tím'}</span>
                      <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-black mt-1">
                      {isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : agency._count.users}
                  </div>
              </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          
          {/* GRAF 1: PLÁN VS REAL (ALEBO ČAS PRE KREATÍVCA) */}
          <Card className="lg:col-span-8 shadow-xl border-none ring-1 ring-slate-200">
              <CardHeader className="border-b bg-slate-50/50 py-3">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                      {isCreative ? <Clock className="h-3 w-3" /> : <Euro className="h-3 w-3" />} 
                      {isCreative ? 'Moja časová investícia' : 'Finančný stav projektov (Klik na bar)'}
                  </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                  {isCreative ? <PersonalTimeChart data={creativeTimeData} /> : <BudgetChart data={budgetData} slug={params.slug} />}
              </CardContent>
          </Card>

          {/* GRAF 2: STAV TENDROV (NOVINKA) */}
          {!isCreative && (
            <Card className="lg:col-span-4 shadow-xl border-none ring-1 ring-slate-200">
                <CardHeader className="border-b bg-slate-50/50 py-3">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                        <Trophy className="h-3 w-3" /> Tendre (Vyhrané vs Pitch)
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-8">
                    <JobStatusChart data={[
                        { name: 'VYHRANÉ', value: wonTenders },
                        { name: 'TODO', value: activeTenders }
                    ]} />
                    <div className="mt-6 text-center">
                        <p className="text-2xl font-black text-slate-900">{wonTenders}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Vyhrané Tendre</p>
                    </div>
                </CardContent>
            </Card>
          )}

          {/* DRUHÝ RAD GRAFOV PRE ADMINA */}
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

          {/* URGENTNÉ KARTY */}
          <Card className="lg:col-span-12 border-2 border-red-100 shadow-2xl overflow-hidden">
              <CardHeader className="bg-red-600 text-white py-3">
                  <CardTitle className="font-black uppercase text-xs italic tracking-wider flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Urgentné úlohy (Klik pre detail)
                  </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-red-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overdue.length === 0 && warning.length === 0 ? (
                          <div className="col-span-full py-10 text-center bg-white rounded-lg border border-dashed border-emerald-200 text-emerald-600 font-bold italic">Všetko je v termíne! 🥂</div>
                      ) : (
                          <>
                              {overdue.map(j => {
                                const days = differenceInDays(now, new Date(j.deadline))
                                return (
                                  <Link key={j.id} href={`/${params.slug}/jobs/${j.id}`} className="block transform transition hover:scale-[1.02]">
                                      <div className="p-4 bg-white border-2 border-red-500 rounded-xl shadow-md">
                                          <p className="text-[9px] font-black uppercase text-red-600 mb-1">{j.campaign?.client?.name || 'Interný Job'}</p>
                                          <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                                          <div className="mt-3 flex justify-between items-center">
                                              <Badge variant="destructive" className="font-black text-[9px] uppercase px-2">Mešká {days}d</Badge>
                                              <span className="text-[10px] font-bold text-red-600">{format(new Date(j.deadline), 'dd.MM.yyyy')}</span>
                                          </div>
                                      </div>
                                  </Link>
                                )
                              })}
                              {warning.map(j => {
                                const days = differenceInDays(new Date(j.deadline), now)
                                return (
                                  <Link key={j.id} href={`/${params.slug}/jobs/${j.id}`} className="block transform transition hover:scale-[1.02]">
                                      <div className="p-4 bg-white border-2 border-amber-400 rounded-xl shadow-md">
                                          <p className="text-[9px] font-black uppercase text-amber-600 mb-1">{j.campaign?.client?.name || 'Interný Job'}</p>
                                          <h4 className="font-bold text-slate-900 truncate">{j.title}</h4>
                                          <div className="mt-3 flex justify-between items-center">
                                              <Badge variant="outline" className="border-amber-500 text-amber-600 font-black text-[9px] uppercase px-2">Doručiť o {days}d</Badge>
                                              <span className="text-[10px] font-bold text-amber-600">{format(new Date(j.deadline), 'dd.MM.yyyy')}</span>
                                          </div>
                                      </div>
                                  </Link>
                                )
                              })}
                          </>
                      )}
                  </div>
              </CardContent>
          </Card>
        </div>
      </div>
    )
  } catch (error) {
    console.error("DASHBOARD ERROR:", error)
    return (
        <div className="p-10 text-center">
            <h2 className="text-red-500 font-bold">Chyba pri načítaní prehľadu</h2>
            <p className="text-sm text-slate-500 mt-2">Prosím, skúste obnoviť stránku alebo kontaktujte technickú podporu.</p>
        </div>
    )
  }
}