import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { format, startOfWeek, addDays, differenceInDays } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CalendarDays, Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // NAČÍTANIE DÁT (Priamy dopyt)
  const entries = await prisma.plannerEntry.findMany({
    where: { userId: session.userId },
    include: { job: { include: { campaign: { include: { client: true } } } } },
    orderBy: { date: 'asc' }
  })

  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900 uppercase italic">Môj Pracovný Týždeň</h2>
        <Button className="bg-emerald-600 hover:bg-emerald-700"><Plus className="h-4 w-4 mr-2" /> Naplánovať prácu</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map(day => {
          const dayEntries = entries.filter(e => isValid(new Date(e.date)) && format(new Date(e.date), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
          const isToday = format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
          const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0)

          return (
            <Card key={day.toString()} className={`min-h-[250px] shadow-md ${isToday ? 'ring-2 ring-blue-500' : ''}`}>
              <CardHeader className="p-3 border-b bg-slate-50/50 flex flex-row justify-between items-center">
                <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase text-slate-400">{format(day, 'EEEE')}</p>
                    <p className="text-sm font-bold">{format(day, 'd. MMMM')}</p>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700 font-bold text-[10px]">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</Badge>
              </CardHeader>
              <CardContent className="p-2 space-y-2">
                {dayEntries.map(e => (
                  <div key={e.id} className="p-2 bg-white border rounded text-[10px] shadow-sm">
                    <p className="font-bold text-blue-600 uppercase">{e.job.campaign.client.name}</p>
                    <p className="font-medium truncate">{e.job.title}</p>
                    <div className="mt-1 flex justify-between">
                        <Badge variant="outline" className="text-[8px] h-4">{e.minutes}m</Badge>
                        {e.isDone && <Badge className="bg-green-500 h-4">OK</Badge>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}