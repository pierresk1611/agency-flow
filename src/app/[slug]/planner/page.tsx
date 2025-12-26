import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { AddPlannerEntryDialog } from '@/components/add-planner-entry-dialog'
import { PlannerDisplay } from '@/components/planner-display'
import { SubmitPlannerButton } from '@/components/submit-planner-button'

export const dynamic = 'force-dynamic'

export default async function PlannerPage({ params }: { params: { slug: string } }) {
  // ✅ MUSÍ BYŤ await
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  /**
   * 1️⃣ Joby, na ktorých JE kreatívec priradený
   */
  const jobs = await prisma.job.findMany({
    where: {
      archivedAt: null,
      campaign: {
        client: {
          agencyId: agency.id
        }
      },
      assignments: {
        some: { userId: session.userId }
      }
    },
    include: {
      campaign: {
        include: { client: true }
      }
    }
  })

  /**
   * 2️⃣ Planner entries kreatívca
   */
  const entries = await prisma.plannerEntry.findMany({
    where: {
      userId: session.userId
    },
    include: {
      job: {
        include: {
          campaign: {
            include: { client: true }
          }
        }
      }
    },
    orderBy: { date: 'asc' }
  })

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">
          Môj Týždeň
        </h2>

        {/* ✅ CLIENT COMPONENT – server action */}
        {isCreative && <SubmitPlannerButton />}

        <AddPlannerEntryDialog allJobs={jobs} />
      </div>

      <PlannerDisplay
        initialEntries={entries}
        allJobs={jobs}
      />
    </div>
  )
}
