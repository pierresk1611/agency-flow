import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { ClientsList } from '@/components/clients-list'

export const dynamic = 'force-dynamic'

export default async function AgencyClientsPage({ params }: { params: { slug: string } }) {
  // 1️⃣ Session (server-side)
  const session = await getSession()
  if (!session) redirect('/login')

  // 2️⃣ Získanie agentúry podľa slug
  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  // 3️⃣ Zistenie, či je používateľ len na čítanie
  const isReadOnly = session.role === 'CREATIVE'

  // 4️⃣ Posielame role a ID používateľa do komponentu ClientsList, aby vedel filtrovať
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 uppercase italic">Klienti</h2>
        <p className="text-muted-foreground text-sm font-medium">
          Prehľad firiem a klientsky newsfeed {isReadOnly ? '(len na čítanie)' : ''}
        </p>
      </div>
      
      <ClientsList 
        role={session.role} 
        userId={session.userId} 
        agencyId={agency.id} 
        readOnly={isReadOnly} 
      />
    </div>
  )
}
