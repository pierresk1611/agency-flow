import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { AddPlannerEntryDialog } from '@/components/add-planner-entry-dialog'
import { PlannerDisplay } from '@/components/planner-display'
import { Button } from '@/components/ui/button'
import { Trash2, Clock, CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  // 1. NAČÍTANIE JOBOV pre konkrétneho kreatívca
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

  const usersJobs = allJobs.filter(job => job.assignments.length > 0)

  // 2. NAČÍTANIE PLÁNOVAČA pre používateľa
  const entries = await prisma.plannerEntry.findMany({
    where: { userId: session.userId },
    include: { job: { include: { campaign: { include: { client: true } } } } },
    orderBy: { date: 'asc' }
  })

  // 3. ODOSLANIE NA SCHVÁLENIE
  async function submitForApproval() {
    if (!isCreative) return

    await prisma.plannerEntry.updateMany({
      where: { userId: session.userId, status: 'DRAFT' },
      data: { status: 'PENDING_APPROVAL' }
    })

    // Tu by sme mohli tiež vytvoriť notifikáciu pre ACCOUNT/TRAFFIC/ADMIN
  }

  // 4. Automatické priradenie jobov podľa nastavenia (ak nie sú priradené)
  const unassignedJobs = allJobs.filter(job => job.assignments.length === 0)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Môj Týždeň</h2>
        {isCreative && (
          <Button onClick={submitForApproval} className="bg-green-600 text-white hover:bg-green-700">
            Odoslať na schválenie
          </Button>
        )}
        <AddPlannerEntryDialog allJobs={usersJobs} />
      </div>

      <PlannerDisplay initialEntries={entries} allJobs={usersJobs} unassignedJobs={unassignedJobs} />
    </div>
  )
}
