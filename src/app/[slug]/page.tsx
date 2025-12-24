import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, Euro, AlertTriangle, Clock, PieChart, Download } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const now = new Date()

  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: { client: { agencyId: agency.id, archivedAt: null } }
    },
    include: { budgets: true, campaign: { include: { client: true } } }
  })

  const overdueJobs = jobs.filter(j => j.status !== 'DONE' && j.deadline < now)
  const budgetAlerts = jobs.map(job => {
    const spent = job.budgets.reduce((sum, item) => sum + item.amount, 0)
    const budget = job.budget || 0
    const percentage = budget > 0 ? (spent / budget) * 100 : 0
    return { ...job, spent, percentage }
  }).filter(j => j.budget > 0 && j.percentage >= 80).sort((a, b) => b.percentage - a.percentage)

  const allApprovedCosts = await prisma.budgetItem.findMany({
    where: { job: { campaign: { client: { agencyId: agency.id, archivedAt: null } } } },
    include: { job: { include: { campaign: { include: { client: true } } } } }
  })

  const clientStats: Record<string, number> = {}
  allApprovedCosts.forEach(item => {
    const name = item.job.campaign.client.name
    clientStats[name] = (clientStats[name] || 0) + item.amount
  })
  const topClients = Object.entries(clientStats).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount)

  const totalSpent = allApprovedCosts.reduce((sum, i) => sum + i.amount, 0)
  const activeCount = jobs.filter(j => j.status !== 'DONE').length
  const teamCount = await prisma.user.count({ where: { active: true, agencyId: agency.id } })

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Manažérsky Prehľad</h2>
        <a href="/api/exports/budget" download className="w-full sm:w-auto">
            <Button variant="outline" className="w-full gap-2 shadow-sm"><Download className="h-4 w-4" /> Export CSV</Button>
        </a>
      </div>

      {/* KPI KARTY - Responzívne: 1 stĺpec na mobile, 3 na desktope */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-b-4 border-b-blue-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Celkové Náklady</CardTitle><Euro className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-black">{totalSpent.toFixed(2)} €</div></CardContent></Card>
        <Card className="border-b-4 border-b-violet-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Aktívna Výroba</CardTitle><Activity className="h-4 w-4 text-violet-500" /></CardHeader><CardContent><div className="text-2xl font-black">{activeCount} Jobov</div></CardContent></Card>
        <Card className="border-b-4 border-b-emerald-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-xs font-bold text-muted-foreground uppercase">Tím</CardTitle><Users className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-2xl font-black">{teamCount} {teamCount === 1 ? 'Kolega' : 'Kolegovia'}</div></CardContent></Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        {/* KRITICKÝ TIMING - 100% šírka na mobile, 4/7 na desktope */}
        <Card className="col-span-1 lg:col-span-4 shadow-md">
          <CardHeader className="bg-red-50/50 border-b py-3"><div className="flex items-center gap-2"><Clock className="h-4 w-4 text-red-600" /><CardTitle className="text-red-900 font-bold uppercase text-xs">Kritický Timing</CardTitle></div></CardHeader>
          <CardContent className="pt-4"><div className="space-y-3">
            {overdueJobs.length === 0 ? <p className="text-sm text-emerald-600 text-center py-10 font-bold">VŠETKO V TERMÍNE ✅</p> : 
              overdueJobs.map(job => (
                <div key={job.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white border border-red-100 rounded-lg shadow-sm gap-2">
                  <div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{job.title}</span><span className="text-[10px] text-red-600 uppercase font-black">{job.campaign.client.name}</span></div>
                  <Badge variant="destructive" className="font-mono text-[10px]">MEŠKÁ: {format(new Date(job.deadline), 'dd.MM')}</Badge>
                </div>
              ))}
          </div></CardContent>
        </Card>

        {/* DISTRIBÚCIA NÁKLADOV - 100% šírka na mobile, 3/7 na desktope */}
        <Card className="col-span-1 lg:col-span-3 shadow-md">
          <CardHeader className="border-b bg-slate-50/50 py-3"><CardTitle className="text-xs font-black uppercase flex items-center gap-2"><PieChart className="h-4 w-4" /> Náklady po klientoch</CardTitle></CardHeader>
          <CardContent className="pt-4"><div className="space-y-5">
            {topClients.map((client) => (
              <div key={client.name} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700"><span className="truncate uppercase mr-2">{client.name}</span><span>{client.amount.toFixed(0)} €</span></div>
                <Progress value={totalSpent > 0 ? (client.amount / totalSpent) * 100 : 0} className="h-1.5" />
              </div>
            ))}
          </div></CardContent>
        </Card>

        {/* BUDGET ALERTS - Plná šírka */}
        <Card className="col-span-1 lg:col-span-7 shadow-md border-orange-200">
          <CardHeader className="bg-orange-50/50 border-b py-3"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /><CardTitle className="text-orange-900 text-sm font-black uppercase">Budget Alerts</CardTitle></div></CardHeader>
          <CardContent className="pt-6 pb-6"><div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {budgetAlerts.map(job => (
              <div key={job.id} className="p-4 border border-orange-100 rounded-xl bg-white">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0"><h4 className="font-bold text-slate-900 truncate text-sm">{job.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{job.campaign.client.name}</p></div>
                  <span className={`text-xl font-black ${job.percentage > 100 ? 'text-red-600' : 'text-orange-600'}`}>{job.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={job.percentage} className={`h-2 ${job.percentage > 100 ? '[&>div]:bg-red-600' : '[&>div]:bg-orange-500'}`} />
              </div>
            ))}
            {budgetAlerts.length === 0 && <div className="col-span-full text-center py-6 text-emerald-600 font-bold text-xs uppercase tracking-widest">Budgety sú v poriadku 🚀</div>}
          </div></CardContent>
        </Card>
      </div>
    </div>
  )
}