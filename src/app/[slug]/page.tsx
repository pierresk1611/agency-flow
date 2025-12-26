import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { TrafficWorkloadManager } from '@/components/traffic-workload-manager'

export const dynamic = 'force-dynamic'

export default async function TrafficPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  const users = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    orderBy: { position: 'asc' },
    include: {
      assignments: {
        where: { job: { status: { not: 'DONE' }, archivedAt: null } },
        include: { job: { include: { campaign: { include: { client: true } } } } }
      }
    }
  })

  const groups: Record<string, any[]> = {}
  users.forEach(u => {
    const pos = u.position || "Ostatní"
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(u)
  })

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Traffic & Kapacita</h2>
      </div>
      {Object.entries(groups).map(([groupName, members]) => (
        <div key={groupName} className="space-y-4">
            <h3 className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-1 border rounded-full w-fit">
                {groupName} ({members.length})
            </h3>
            <TrafficWorkloadManager initialUsers={members} role={session.role} slug={params.slug} />
        </div>
      ))}
    </div>
  )
}