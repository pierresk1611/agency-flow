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

  // 1. NAČÍTANIE ÚDAJOV O VYŤAŽENOSTI (Zložité include)
  const usersWithJobs = await prisma.user.findMany({
    where: { agencyId: agency.id, active: true },
    orderBy: { position: 'asc' },
    include: {
      assignments: {
        where: { job: { status: { not: 'DONE' }, archivedAt: null } },
        include: { job: { include: { campaign: { include: { client: true } } } } }
      }
    }
  })

  // 2. NAČÍTANIE JEDNODUCHÉHO ZOZNAMU ĽUDÍ (Pre dropdown menu)
  const allActiveUsers = await prisma.user.findMany({
      where: { agencyId: agency.id, active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, position: true } // Stačí nám toto
  })

  // 3. LOGIKA ZOSKUPOVANIA
  const groups: Record<string, any[]> = {}
  usersWithJobs.forEach(u => {
    const pos = u.position || "Ostatní / Nezaradení"
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(u)
  })

  // Zabezpečenie: Ak je to kreatívec, nemá prístup k Inboxu (v komponente to je ošetrené, ale tu posielame rolu)

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Traffic & Kapacita</h2>
        <p className="text-muted-foreground text-sm font-medium">Prehľad vyťaženosti tímu podľa odbornosti.</p>
      </div>

      {Object.entries(groups).map(([groupName, members]) => (
        <div key={groupName} className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-4 py-1 border rounded-full">
                    {groupName} ({members.length})
                </h3>
                <div className="h-px flex-1 bg-slate-200" />
            </div>
            
            <TrafficWorkloadManager 
                initialUsers={members}
                allActiveUsers={allActiveUsers} // <--- TOTO TU CHÝBALO A ZHAĎOVALO TO!
                role={session.role} 
                slug={params.slug} 
            />
        </div>
      ))}
    </div>
  )
}