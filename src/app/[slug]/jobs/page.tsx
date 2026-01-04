// app/[slug]/jobs/page.tsx
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { JobsTabs } from '@/components/jobs-tabs'
import { GlobalNewJobButton } from '@/components/global-new-job-button'

export const dynamic = 'force-dynamic'

export default async function JobsPage({ params }: { params: { slug: string } }) {
  // ✅ Správny await
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const isCreative = session.role === 'CREATIVE'

  // 1️⃣ ACTIVE JOBS
  const jobs = await prisma.job.findMany({
    where: {
      archivedAt: null,
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: { include: { user: true } },
      budgets: true
    }
  })

  // 2️⃣ ARCHIVED JOBS
  const archivedJobs = await prisma.job.findMany({
    where: {
      archivedAt: { not: null },
      campaign: { client: { agencyId: agency.id } },
      assignments: isCreative ? { some: { userId: session.userId } } : undefined
    },
    include: {
      campaign: { include: { client: true } },
      assignments: { include: { user: true } }
    },
    orderBy: { archivedAt: 'desc' }
  })

  // 2.5 COLLEAGUES for reassignment
  const colleagues = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    select: { id: true, name: true, email: true }
  })

  // 2.75 FETCH CLIENTS for Global New Job Button
  const allClients = await prisma.client.findMany({
    where: { agencyId: agency.id, archivedAt: null },
    select: {
      id: true,
      name: true,
      campaigns: {
        select: { id: true, name: true },
        where: { archivedAt: null }
      },
      defaultAssignees: { select: { id: true } }
    },
    orderBy: { name: 'asc' }
  })

  // 3️⃣ TENDERS (ak existuje model)
  const tenders = await prisma.tender?.findMany
    ? await prisma.tender.findMany({
      where: {
        agencyId: agency.id,
        isConverted: false,
        status: { not: 'DONE' } // Exclude archived/lost tenders
      },
      orderBy: { deadline: 'asc' }
    })
    : []

  // 4️⃣ MERGE + SORT podľa priority a deadline
  const activeItems = [
    ...jobs.map(j => ({
      id: j.id,
      title: j.title,
      type: 'JOB',
      status: j.status,
      priority: j.campaign?.client?.priority || 0,
      client: j.campaign?.client?.name || 'N/A',
      campaign: j.campaign?.name || '',
      deadline: j.deadline,
      plan: j.budget || 0,
      real: j.budgets?.reduce((acc, b) => acc + b.amount, 0) || 0,
      assignments: j.assignments
    })),
    ...tenders.map(t => ({
      id: t.id,
      title: t.title,
      type: 'TENDER',
      status: t.status,
      priority: 6,
      client: 'PITCH / TENDER',
      campaign: 'New Business',
      deadline: t.deadline,
      plan: t.budget || 0,
      real: 0,
      assignments: [] as any[]
    }))
  ].sort((a, b) => {
    // 1. DEADLINE (Najskôr tie čo horia)
    const timeA = new Date(a.deadline).getTime()
    const timeB = new Date(b.deadline).getTime()
    if (timeA !== timeB) return timeA - timeB

    // 2. PRIORITY (Ak majú rovnaký deadline, tak podľa priority)
    return b.priority - a.priority
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            {isCreative ? 'Moje Zadaniá' : 'Projekty & Tasky'}
          </h2>
        </div>
        {!isCreative && (
          <GlobalNewJobButton clients={allClients as any} colleagues={colleagues} agencyId={agency.id} />
        )}
      </div>

      <JobsTabs
        activeJobs={activeItems}
        archivedJobs={archivedJobs}
        tenders={tenders}
        colleagues={colleagues}
        slug={params.slug}
        isCreative={isCreative}
        session={session}
      />
    </div>
  )
}
