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

  // NAČÍTAME ZÁKLADNÝ ZOZNAM UŽÍVATEĽOV A POZÍCIE BEZ KOMPLIKOVANÝCH JOBOV
  const users = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    orderBy: { position: 'asc' },
    select: {
      id: true,
      name: true,
      email: true,
      position: true,
      role: true
    }
  })

  const groups: Record<string, any[]> = {}
  users.forEach(u => {
    const pos = u.position || "Ostatní"
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(u)
  })
  
  const allUsersSimpleList = users.map(u => ({ id: u.id, name: u.name, email: u.email }))

  return (
    <div className="space-y-8 pb-20">
      {/* ... ostáva UI kód (TrafficWorkloadManager) ... */}
      
      {/* V tomto prípade TrafficWorkloadManager teraz musí použiť nové API */}
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
                    allUsersList={allUsersSimpleList} // Používame len zoznam (ID, Name)
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