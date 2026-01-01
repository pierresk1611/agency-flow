import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { AddPlannerEntryDialog } from '@/components/add-planner-entry-dialog'
import { PlannerDisplay } from '@/components/planner-display'
import { TeamPlannerDisplay } from '@/components/team-planner-display'
import { SubmitPlannerButton } from '@/components/ui/planner-button'

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'
  const canViewTeam = ['ADMIN', 'TRAFFIC', 'ACCOUNT', 'SUPERADMIN'].includes(session.role)

  // 1. Spoločné dáta: Jobs (pre dropdowny a priradenia)
  // Pre team view potrebujeme vidieť VŠETKY joby agentúry, nielen priradené userovi
  const jobWhere = isCreative
    ? {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: { some: { userId: session.userId } }
    }
    : {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } }
    }

  const jobs = await prisma.job.findMany({
    where: jobWhere,
    include: {
      campaign: { include: { client: true } }
    }
  })

  // 2. CREATIVE MODE: Len moje dáta
  if (isCreative || !canViewTeam) {
    const entries = await prisma.plannerEntry.findMany({
      where: { userId: session.userId },
      include: { job: { include: { campaign: { include: { client: true } } } } },
      orderBy: { date: 'asc' }
    })

    return (
      <div className="space-y-6 pb-20">
        <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
            Môj Týždeň
          </h2>
          <div className="flex items-center gap-2">
            <SubmitPlannerButton />
            <AddPlannerEntryDialog allJobs={jobs} />
          </div>
        </div>

        <PlannerDisplay
          initialEntries={entries}
          allJobs={jobs}
        />
      </div>
    )
  }

  // 3. TEAM MODE (Admin/Traffic/Account)
  // Fetch all active users + positions + entries
  const users = await prisma.user.findMany({
    where: {
      agencyId: agency.id,
      active: true
    },
    include: {
      plannerEntries: {
        where: {
          // Optimalizácia: Fetch len tento týždeň? 
          // Zatiaľ fetch all, Client-side filter to rieši v PlannerDisplay
          // TODO: Add date filter for performance later
        },
        include: { job: { include: { campaign: { include: { client: true } } } } },
        orderBy: { date: 'asc' }
      }
    }
  })

  const positions = await prisma.agencyPosition.findMany({
    where: { agencyId: agency.id }
  })

  // Group users by category
  const groupedMap = new Map<string, any[]>()
  const DEFAULT_CAT = "Ostatné"

  users.forEach(user => {
    // Find category based on position name
    const pos = positions.find(p => p.name === user.position)
    const category = pos?.category || DEFAULT_CAT

    if (!groupedMap.has(category)) groupedMap.set(category, [])
    groupedMap.get(category)?.push({
      user: { id: user.id, name: user.name, position: user.position },
      entries: user.plannerEntries
    })
  })

  // Sort categories (custom logic if needed, now alphabetical or pre-defined)
  const sortedCategories = Array.from(groupedMap.keys()).sort()

  // Custom sort to put "Vedenie" first if exists, etc.
  // Zatiaľ jednoducho podľa abecedy, ale "Vedenie" býva zvyčajne číslované v seed.ts (1. Vedenie...)

  const groupedPlanners = sortedCategories.map(cat => ({
    category: cat,
    users: groupedMap.get(cat) || []
  }))

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
          Plánovanie Tímu
        </h2>
        {/* Admin môže tiež pridávať sebe? Zatiaľ nie je v zadaní, skryjem */}
      </div>

      <TeamPlannerDisplay
        groupedPlanners={groupedPlanners}
        allJobs={jobs}
      />
    </div>
  )
}
