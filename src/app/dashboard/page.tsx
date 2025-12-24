import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Activity, Users, Euro, AlertTriangle, Clock, TrendingUp, Download, PieChart } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'

export default async function DashboardPage() {
  const now = new Date()

  // 1. NAČÍTANIE DÁT (Opravená logika dopytu)
  const jobs = await prisma.job.findMany({
    where: { 
      archivedAt: null,
      campaign: {
        client: {
          archivedAt: null // Filtrujeme joby, ktorých klienti nie sú archivovaní
        }
      }
    },
    include: {
      budgets: true,
      campaign: {
        include: { client: true }
      }
    }
  })

  // 2. LOGIKA: MEŠKAJÚCE ÚLOHY (Overdue)
  const overdueJobs = jobs.filter(j => 
    j.status !== 'DONE' && j.deadline < now
  ).sort((a, b) => a.deadline.getTime() - b.deadline.getTime())

  // 3. LOGIKA: OHROZENÉ ROZPOČTY (> 80%)
  const budgetAlerts = jobs.map(job => {
    const spent = job.budgets.reduce((sum, item) => sum + item.amount, 0)
    const budget = job.budget || 0
    const percentage = budget > 0 ? (spent / budget) * 100 : 0
    return { ...job, spent, percentage }
  }).filter(j => j.budget > 0 && j.percentage >= 80)
    .sort((a, b) => b.percentage - a.percentage)

  // 4. LOGIKA: NÁKLADY PODĽA KLIENTOV (Iba nearchivovaní)
  const allApprovedCosts = await prisma.budgetItem.findMany({
    where: {
      job: {
        campaign: {
          client: { archivedAt: null }
        }
      }
    },
    include: {
      job: {
        include: { campaign: { include: { client: true } } }
      }
    }
  })

  const clientStats: Record<string, number> = {}
  allApprovedCosts.forEach(item => {
    const name = item.job.campaign.client.name
    clientStats[name] = (clientStats[name] || 0) + item.amount
  })
  
  const topClients = Object.entries(clientStats)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)

  // KPI METRIKY
  const totalSpent = allApprovedCosts.reduce((sum, i) => sum + i.amount, 0)
  const activeCount = jobs.filter(j => j.status !== 'DONE').length
  const teamCount = await prisma.user.count({ where: { active: true } })

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Manažérsky Prehľad</h2>
        <a href="/api/exports/budget" download>
            <Button variant="outline" className="gap-2 border-slate-300 shadow-sm hover:bg-slate-50">
                <Download className="h-4 w-4" /> Export CSV
            </Button>
        </a>
      </div>

      {/* KPI KARTY */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-b-4 border-b-blue-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase">Celkové Náklady</CardTitle>
            <Euro className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{totalSpent.toFixed(2)} €</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold">SCHVÁLENÉ POLOŽKY</p>
          </CardContent>
        </Card>
        <Card className="border-b-4 border-b-violet-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase">Aktívna Výroba</CardTitle>
            <TrendingUp className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{activeCount} Jobov</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold text-violet-600">PREBIEHAJÚCE</p>
          </CardContent>
        </Card>
        <Card className="border-b-4 border-b-emerald-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase">Tím</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black">{teamCount} Kolegovia</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold text-emerald-600">AKTÍVNY PRÍSTUP</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
        
        {/* 1. OVERDUE JOBS */}
        <Card className="col-span-4 shadow-md border-slate-200">
          <CardHeader className="bg-red-50/50 border-b">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900 font-bold uppercase text-xs tracking-widest">Kritický Timing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {overdueJobs.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-lg bg-emerald-50/30">
                    <p className="text-sm text-emerald-600 font-bold italic">VŠETKO V TERMÍNE ✅</p>
                </div>
              ) : (
                overdueJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between p-4 bg-white border-l-4 border-l-red-500 border rounded-r-lg shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800">{job.title}</span>
                      <span className="text-[10px] text-red-600 uppercase font-black">{job.campaign.client.name}</span>
                    </div>
                    <Badge variant="destructive" className="font-mono text-[11px] px-3">
                      MEŠKÁ: {format(new Date(job.deadline), 'dd.MM')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. CLIENT STATS */}
        <Card className="col-span-3 shadow-md border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <PieChart className="h-4 w-4" /> Distribúcia nákladov
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {topClients.map((client) => (
                <div key={client.name} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="truncate pr-2 uppercase">{client.name}</span>
                    <span>{client.amount.toFixed(0)} €</span>
                  </div>
                  <Progress value={totalSpent > 0 ? (client.amount / totalSpent) * 100 : 0} className="h-2 bg-slate-100" />
                </div>
              ))}
              {topClients.length === 0 && <p className="text-xs text-center py-10 text-slate-400 italic">Zatiaľ žiadne dáta.</p>}
            </div>
          </CardContent>
        </Card>

        {/* 3. BUDGET ALERTS */}
        <Card className="col-span-7 shadow-md border-orange-200">
          <CardHeader className="bg-orange-50/50 border-b py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900 text-sm font-black uppercase tracking-widest">Budget Alerts</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6 px-6 pb-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {budgetAlerts.map(job => (
                <div key={job.id} className="p-5 border-2 border-orange-100 rounded-2xl bg-white shadow-sm hover:border-orange-300 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 truncate leading-tight">{job.title}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{job.campaign.client.name}</p>
                    </div>
                    <span className={`text-2xl font-black shrink-0 ml-2 ${job.percentage > 100 ? 'text-red-600' : 'text-orange-600'}`}>
                      {job.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={job.percentage} 
                    className={`h-3 rounded-full ${job.percentage > 100 ? '[&>div]:bg-red-600' : '[&>div]:bg-orange-500'}`} 
                  />
                  <div className="flex justify-between mt-4 text-[10px] font-black font-mono text-slate-500">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase">Minuté</span>
                        <span>{job.spent.toFixed(2)}€</span>
                    </div>
                    <div className="flex flex-col text-right">
                        <span className="text-[9px] text-slate-400 uppercase">Limit</span>
                        <span>{job.budget?.toFixed(2)}€</span>
                    </div>
                  </div>
                </div>
              ))}
              {budgetAlerts.length === 0 && (
                <div className="col-span-full text-center py-10 text-emerald-600 font-black text-sm uppercase tracking-widest bg-emerald-50 rounded-xl border-2 border-emerald-100">
                  VŠETKY BUDGETY SÚ OK 🚀
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}