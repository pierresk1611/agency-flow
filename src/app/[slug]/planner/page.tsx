import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { format, startOfWeek, addDays, isValid } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trash2, Clock, CalendarDays } from 'lucide-react'
import { AddPlannerEntryDialog } from '@/components/add-planner-entry-dialog' 
import { PlannerDisplay } from '@/components/planner-display' // <--- VŠETKO JE TU

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // NAČÍTANIE ZÁZNAMOV
  const entries = await prisma.plannerEntry.findMany({
    where: { userId: session.userId },
    include: { job: { include: { campaign: { include: { client: true } } } } },
    orderBy: { date: 'asc' }
  })
  
  // NAČÍTANIE VŠETKÝCH JOBOV PRE DIALÓG
  const allJobs = await prisma.job.findMany({
      where: { 
          archivedAt: null, 
          campaign: { client: { agencyId: agency.id } },
      }, 
      include: { 
          campaign: { include: { client: true } },
          assignments: { where: { userId: session.userId } }
      }
  })
  const usersJobs = allJobs.filter(job => job.assignments.length > 0);


  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Môj Týždeň</h2>
        <AddPlannerEntryDialog allJobs={usersJobs} />
      </div>

      <PlannerDisplay initialEntries={entries} />
    </div>
  )
}