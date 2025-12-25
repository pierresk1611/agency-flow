import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { redirect, notFound } from 'next/navigation'
import { ClientsList } from '@/components/clients-list'

export const dynamic = 'force-dynamic'

export default async function AgencyClientsPage({ params }: { params: { slug: string } }) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({ where: { slug: params.slug } })
  if (!agency) return notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-slate-900 uppercase italic">Klienti</h2>
        <p className="text-muted-foreground text-sm font-medium">Prehľad firiem a klientsky newsfeed.</p>
      </div>
      
      {/* Komponentu posielame rolu a ID, aby vedela filtrovať vnútri (v ďalšom kroku) */}
      <ClientsList />
    </div>
  )
}