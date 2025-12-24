import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, Euro, AlertTriangle, Clock, TrendingUp, Download, PieChart } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  // 1. Zistenie ID agentúry podľa slugu
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const now = new Date()

  // 2. NAČÍTANIE JOBOV AGENTÚRY
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

  // 3. NÁKLADY PODĽA KLIENTOV
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
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Manažérsky Prehľad: {agency.name}</h2>
        <a href="/api/exports/budget" download><Button variant="outline" className="gap-2 shadow-sm"><Download className="h-4 w-4" /> Export CSV</Button></a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-b-4 border-b-blue-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Celkové Náklady</CardTitle><Euro className="h-4 w-4 text-blue-500" /></CardHeader><CardContent><div className="text-2xl font-black">{totalSpent.toFixed(2)} €</div></CardContent></Card>
        <Card className="border-b-4 border-b-violet-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Aktívna Výroba</CardTitle><TrendingUp className="h-4 w-4 text-violet-500" /></CardHeader><CardContent><div className="text-2xl font-black">{activeCount} Jobov</div></CardContent></Card>
        <Card className="border-b-4 border-b-emerald-500 shadow-sm"><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-bold text-muted-foreground uppercase">Tím</CardTitle><Users className="h-4 w-4 text-emerald-500" /></CardHeader><CardContent><div className="text-2xl font-black">{teamCount} {teamCount === 1 ? 'Kolega' : 'Kolegovia'}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
        <Card className="col-span-4 shadow-md border-slate-200">
          <CardHeader className="bg-red-50/50 border-b"><div className="flex items-center gap-2"><Clock className="h-5 w-5 text-red-600" /><CardTitle className="text-red-900 font-bold uppercase text-xs">Kritický Timing</CardTitle></div></CardHeader>
          <CardContent className="pt-4"><div className="space-y-4">
            {overdueJobs.length === 0 ? <p className="text-sm text-emerald-600 text-center py-10 font-bold italic">VŠETKO V TERMÍNE ✅</p> : 
              overdueJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-white border-l-4 border-l-red-500 border rounded shadow-sm">
                  <div className="flex flex-col"><span className="text-sm font-black text-slate-800">{job.title}</span><span className="text-[10px] text-red-600 uppercase font-black">{job.campaign.client.name}</span></div>
                  <Badge variant="destructive" className="font-mono text-[11px]">MEŠKÁ: {format(new Date(job.deadline), 'dd.MM')}</Badge>
                </div>
              ))}
          </div></CardContent>
        </Card>

        <Card className="col-span-3 shadow-md border-slate-200">
          <CardHeader className="border-b bg-slate-50/50"><CardTitle className="text-xs font-black uppercase flex items-center gap-2"><PieChart className="h-4 w-4" /> Distribúcia nákladov</CardTitle></CardHeader>
          <CardContent className="pt-6"><div className="space-y-6">
            {topClients.map((client) => (
              <div key={client.name} className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700"><span className="truncate uppercase">{client.name}</span><span>{client.amount.toFixed(0)} €</span></div>
                <Progress value={totalSpent > 0 ? (client.amount / totalSpent) * 100 : 0} className="h-2" />
              </div>
            ))}
          </div></CardContent>
        </Card>

        <Card className="col-span-7 shadow-md border-orange-200">
          <CardHeader className="bg-orange-50/50 border-b py-3"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /><CardTitle className="text-orange-900 text-sm font-black uppercase">Budget Alerts</CardTitle></div></CardHeader>
          <CardContent className="pt-6 px-6 pb-8"><div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {budgetAlerts.map(job => (
              <div key={job.id} className="p-5 border-2 border-orange-100 rounded-2xl bg-white shadow-sm hover:border-orange-300 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0"><h4 className="font-bold text-slate-900 truncate">{job.title}</h4><p className="text-[10px] text-slate-400 font-bold uppercase">{job.campaign.client.name}</p></div>
                  <span className={`text-2xl font-black ${job.percentage > 100 ? 'text-red-600' : 'text-orange-600'}`}>{job.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={job.percentage} className={`h-3 ${job.percentage > 100 ? '[&>div]:bg-red-600' : '[&>div]:bg-orange-500'}`} />
              </div>
            ))}
          </div></CardContent>
        </Card>
      </div>
    </div>
  )
}