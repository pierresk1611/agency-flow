import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { format, addDays, differenceInDays, isValid } from 'date-fns' // <--- OPRAVENÝ IMPORT
import { 
  AlertCircle, Clock, TrendingUp, Users, Euro, 
  CheckCircle2, ListChecks, Download, PieChart as PieIcon, Trophy
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

  try {
    // 1. Overenie agentúry
    const agency = await prisma.agency.findUnique({ 
      where: { slug: params.slug }
    })
    
    if (!agency) return notFound()
    if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) redirect('/login')

    const isCreative = session.role === 'CREATIVE'
    const now = new Date()
    const criticalThreshold = addDays(now, 7)

    // 2. NAČÍTANIE JOBOV (Samostatný dopyt s poistkou)
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
    }) || []

    // 3. NAČÍTANIE TENDROV (Zjednodušené)
    const tenders = await prisma.tender.findMany({
      where: { agencyId: agency.id }
    }) || []

    const wonTenders = tenders.filter(t => t.isConverted).length
    const activeTenders = tenders.filter(t => !t.isConverted).length

    // 4. TIMING ANALYTIKA
    const overdue = jobs.filter(j => j.status !== 'DONE' && j.deadline && new Date(j.deadline) < now)
    const warning = jobs.filter(j => j.status !== 'DONE' && j.deadline && new Date(j.deadline) >= now && new Date(j.deadline) <= criticalThreshold)

    // 5. BUDGET DÁTA PRE GRAF
    const budgetData = jobs
      .filter(j => (j.budget || 0) > 0)
      .slice(0, 6)
      .map(j => ({
          id: j.id,
          name: j.title.substring(0, 10),
          plan: Number(j.budget || 0),
          real: Number(j.budgets?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0)
      }))

    // 6. VYŤAŽENOSŤ TÍMU (Počítame priamo)
    let workloadData: any[] = []
    if (!isCreative) {
      const allUsers = await prisma.user.findMany({ 
        where: { agencyId: agency.id, active: true },
        include: { _count: { select: { assignments: { where: { job: { status: { not: 'DONE' }, archivedAt: null } } } } } }
      })
      workloadData = allUsers
        .map(u => ({ name: (u.name || u.email.split('@')[0]).substring(0, 12), value: u._count?.assignments || 0 }))
        .filter(v => v.value > 0)
    }

    // 7. TIMESHEETY A FINANCIE
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

    const totalSpentAgg = await prisma.budgetItem.aggregate({
      where: { job: { campaign: { client: { agencyId: agency.id } } } },
      _sum: { amount: true }
    })
    const totalSpent = Number(totalSpentAgg._sum?.amount || 0)
    
    const teamCount = await prisma.user.count({ where: { agencyId: agency.id, active: true } })

    // 8. OSOBNÁ ANALYTIKA KREATÍVCA
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

    const tsData = [{ name: 'Stav', approved: approvedCount, pending: pendingCount }]

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
              <Button variant="outline" size="sm" className="gap-2 shadow-sm font-bold">
                <Download className="h-4 w-4" /> Export dát
              </Button>
            </Link>
          )}
        </div>

        {/* KPI KARTY */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="bg-slate-900 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-slate-400 uppercase text-[9px] font-black">
                      <span>Aktívne Joby</span>
                      <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-black mt-1">{jobs.filter(j => j.status !== 'DONE').length}</div>
              </CardContent>
          </Card>
          <Card className="bg-red-600 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black">
                      <span>Mešká</span>
                      <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-black mt-1">{overdue.length}</div>
              </CardContent>
          </Card>
          <Card className="bg-amber-500 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black">
                      <span>Kritické</span>
                      <Clock className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-black mt-1">{warning.length}</div>
              </CardContent>
          </Card>
          <Card className="bg-blue-600 text-white shadow-lg border-none">
              <CardContent className="pt-4">
                  <div className="flex justify-between items-center text-white/70 uppercase text-[9px] font-black">
                      <span>{isCreative ? 'Čas (min)' : 'Tím'}</span>
                      <Users className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-2xl font-black mt-1">
                      {isCreative ? creativeTimeData.reduce((s,i) => s + i.minutes, 0) : teamCount}
                  </div>
              </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
          
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

          {!isCreative && (
            <Card className="lg:col-span-4 shadow-xl border-none ring-1 ring-slate-200">
                <CardHeader className="border-b bg-slate-50/50 py-3">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Trophy className="h-3 w-3" /> Tendre (Vyhrané / Celkom)
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center pt-8">
                    <JobStatusChart data={[
                        { name: 'VYHRANÉ', value: wonTenders },
                        { name: 'TODO', value: activeTenders }
                    ]} />
                    <div className="mt-6 text-center">
                        <p className="text-2xl font-black text-slate-900">{wonTenders}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Úspešné tendre</p>
                    </div>
                </CardContent>
            </Card>
          )}

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
                      <AlertCircle className="h-4 w-4" /> Pozor! Tieto úlohy vyžadujú okamžitú pozornosť
                  </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 bg-red-50/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {overdue.length === 0 && warning.length === 0 ? (
                          <div className="col-span-full py-10 text-center bg-white rounded-lg border border-dashed border-emerald-200 text-emerald-600 font-bold italic">Všetko je v termíne! ✅</div>
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
                                              <Badge variant="outline" className="border-amber-500 text-amber-600 font-black text-[9px] uppercase px-2">HORÍ (ZA {days}d)</Badge>
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
  } catch (error: any) {
    console.error("DASHBOARD CRITICAL ERROR:", error)
    return (
        <div className="p-20 text-center bg-white rounded-xl shadow-lg m-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 uppercase">Chyba dátového modulu</h2>
            <p className="text-sm text-slate-500 mt-2">Server narazil na nekonzistentné dáta v databáze.</p>
            <div className="mt-6 p-4 bg-slate-50 rounded text-left font-mono text-[10px] text-red-400 overflow-auto">
                {error.message}
            </div>
            <Button onClick={() => window.location.reload()} className="mt-8 bg-slate-900 text-white">Skúsiť obnoviť stránku</Button>
        </div>
    )
  }
}