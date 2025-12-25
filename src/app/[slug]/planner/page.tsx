import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { format, startOfWeek, addDays, isValid } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, TrendingUp, Clock } from 'lucide-react'
import { AddPlannerEntryDialog } from '@/components/add-planner-entry-dialog' 
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, Bar } from 'recharts' // <--- IMPORT

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // NAČÍTANIE DÁT
  const entries = await prisma.plannerEntry.findMany({
    where: { userId: session.userId },
    include: { job: { include: { campaign: { include: { client: true } } } } },
    orderBy: { date: 'asc' }
  })
  
  // NAČÍTANIE VŠETKÝCH JOBOV PRE PLÁNOVAČ
  const allJobs = await prisma.job.findMany({
      where: { archivedAt: null, campaign: { client: { agencyId: agency.id } } }, // VŠETKY JOBY
      include: { campaign: { include: { client: true } } }
  })

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // LOGIKA GRAFU: SUMARIZÁCIA NAPLÁNOVANÉHO ČASU
  const plannedHoursData = days.map(day => {
    const totalMinutes = entries
      .filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
      .reduce((sum, e) => sum + e.minutes, 0)
    
    return { 
        name: format(day, 'E'), 
        hodiny: totalMinutes / 60,
        minutes: totalMinutes
    }
  })

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Môj Týždeň</h2>
        {/* TLAČIDLO TERAZ POSIELA VŠETKY JOBY */}
        <AddPlannerEntryDialog allJobs={allJobs} /> 
      </div>

      {/* GRAF VYŤAŽENOSTI NA TÝŽDEŇ */}
      <Card className="shadow-lg border-none ring-1 ring-slate-200 overflow-hidden">
          <CardHeader className="p-4 bg-slate-900 text-white"><CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Clock className="h-4 w-4" /> Naplánovaný čas (Hodiny)</CardTitle></CardHeader>
          <CardContent className="pt-4 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={plannedHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="hodiny" name="Naplánované hodiny" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </CardContent>
      </Card>


      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map(day => {
          const dayEntries = entries.filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
          const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0)

          return (
            <Card key={day.toString()} className={`min-h-[250px] shadow-md ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="p-3 border-b bg-slate-50/50">
                <p className="text-[10px] font-black uppercase text-slate-400">{format(day, 'EEEE')}</p>
                <p className="text-sm font-bold">{format(day, 'd. MMMM')}</p>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {dayEntries.length === 0 ? (
                    <p className="text-center py-6 text-slate-400 text-xs italic">Voľný deň.</p>
                ) : (
                    dayEntries.map(e => (
                        <div key={e.id} className="p-2 bg-white border rounded text-[10px] shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold text-blue-600 uppercase">{e.job?.campaign?.client?.name || 'Interná práca'}</p>
                                <p className="font-medium truncate">{e.title}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <Badge variant="outline" className="text-[8px] h-4 mb-1">{e.minutes}m</Badge>
                                <Trash2 className="h-3 w-3 text-red-400 cursor-pointer hover:text-red-600" />
                            </div>
                        </div>
                    ))
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}