import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { TrafficWorkloadManager } from '@/components/traffic-workload-manager'

export const dynamic = 'force-dynamic'

export default async function TrafficPage({ params }: { params: { slug: string } }) {
  // ✅ await pre session
  const session = await getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // Načítame užívateľov s ich priradeniami k jobom
  const usersRaw = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    orderBy: { position: 'asc' },
    include: {
      assignments: {
        where: {
          job: {
            archivedAt: null
          }
        },
        include: {
          job: {
            include: {
              campaign: { include: { client: true } }
            }
          },
          reassignmentRequests: {
            where: { status: 'PENDING' },
            select: { id: true }
          }
        },
        orderBy: {
          job: { deadline: 'asc' }
        }
      }
    }
  })

  // Sanitize and shape data
  const users = usersRaw.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    position: u.position,
    role: u.role,
    assignments: u.assignments
  }))

  // Skupiny podľa pozície
  const groups: Record<string, typeof users> = {}
  users.forEach(u => {
    const pos = u.position || "Ostatní"
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(u)
  })

  // Jednoduchý zoznam pre TrafficWorkloadManager (ID, Name, Email)
  const allUsersSimpleList = users.map(u => ({ id: u.id, name: u.name, email: u.email }))

  return (
    <div className="space-y-8 pb-20">
      {/* Pre každý groupName renderujeme TrafficWorkloadManager */}
      <div className="space-y-12">
        {Object.entries(groups).map(([groupName, members]) => (
          <div key={groupName} className="space-y-4">
            <div className="h-px flex-1 bg-slate-200" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-4 py-1 border rounded-full whitespace-nowrap">
              {groupName} ({members.length})
            </h3>
            <div className="h-px flex-1 bg-slate-200" />

            <TrafficWorkloadManager
              initialUsers={members}
              allUsersList={allUsersSimpleList} // len ID, Name, Email
              role={session.role}
              currentUserId={session.userId}
              slug={params.slug}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
