import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { TrafficWorkloadManager } from '@/components/traffic-workload-manager'
import { TrafficRequestsInbox } from '@/components/traffic-requests-inbox'

export const dynamic = 'force-dynamic'

export default async function TrafficPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  // 1. ZÍSKANIE AGENTÚRY
  const agency = await prisma.agency.findUnique({ 
    where: { slug: params.slug } 
  })
  
  if (!agency) return notFound()

  // 2. NAČÍTANIE UŽÍVATEĽOV S KONTROLOU PRÁV
  // Načítame všetkých aktívnych užívateľov agentúry
  const rawUsers = await prisma.user.findMany({
    where: { 
      agencyId: agency.id, 
      active: true 
    },
    orderBy: { position: 'asc' },
    include: {
      assignments: {
        where: { 
          job: { 
            status: { not: 'DONE' }, 
            archivedAt: null 
          } 
        },
        include: { 
          job: { 
            include: { 
              campaign: { 
                include: { client: true } 
              } 
            } 
          } 
        }
      }
    }
  })

  // 3. EXTRÉMNE BEZPEČNÁ SERIALIZÁCIA (Obrana proti Digest Error)
  const sanitizedUsers = rawUsers.map(user => {
    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split('@')[0],
      position: user.position || "Bez pozície",
      role: user.role,
      assignments: (user.assignments || []).map(a => {
        // Tu kontrolujeme každý jeden článok reťazca
        const clientName = a.job?.campaign?.client?.name || "Interný projekt";
        const deadline = a.job?.deadline ? a.job.deadline.toISOString() : new Date().toISOString();
        
        return {
          id: a.id,
          userId: a.userId,
          roleOnJob: a.roleOnJob || "Člen tímu",
          job: {
            id: a.job?.id || "unknown",
            title: a.job?.title || "Nepomenovaná úloha",
            deadline: deadline,
            clientName: clientName
          }
        }
      })
    }
  })

  // 4. ZOSKUPOVANIE PODĽA POZÍCIE
  const groups: Record<string, any[]> = {}
  sanitizedUsers.forEach(u => {
    const pos = u.position || "Ostatní"
    if (!groups[pos]) groups[pos] = []
    groups[pos].push(u)
  })

  const isManager = ['ADMIN', 'TRAFFIC', 'ACCOUNT', 'SUPERADMIN'].includes(session.role)

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Traffic & Kapacita</h2>
        <p className="text-muted-foreground text-sm font-medium">Prehľad vyťaženosti tímu podľa odbornosti.</p>
      </div>

      {/* INBOX ŽIADOSTÍ (Zobrazí sa len ak sú nejaké PENDING) */}
      {isManager && <TrafficRequestsInbox />}

      <div className="space-y-12">
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
                    allUsersList={sanitizedUsers} 
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