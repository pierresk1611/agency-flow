import { Sidebar } from '@/components/sidebar'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function AgencyLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const session = getSession()
  
  // 1. Ak nie je prihlásený, smeruj na login
  if (!session) redirect('/login')

  // 2. Overenie existencie agentúry podľa SLUGU v URL
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })

  if (!agency) return notFound()

  // 3. IZOLÁCIA: Má tento užívateľ právo vidieť túto agentúru?
  // Superadmin môže všade, bežný user len do svojej
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    // Ak sa snaží vliezť do cudzej, vrátime ho do jeho vlastnej (ak ju má)
    const myAgency = await prisma.agency.findUnique({ where: { id: session.agencyId } })
    if (myAgency) redirect(`/${myAgency.slug}`)
    else redirect('/login')
  }

  return (
    <div className="h-full relative">
      {/* Ľavý panel (Sidebar) - posielame slug na generovanie linkov */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar slug={params.slug} />
      </div>
      
      {/* Hlavný obsah */}
      <main className="md:pl-72 pb-10">
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  )
}