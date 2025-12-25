import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function AgencyLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { slug: string } // <--- Tu je náš slug
}) {
  const session = getSession()
  if (!session) redirect('/login')

  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })

  if (!agency) return notFound()

  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    const myAgency = await prisma.agency.findUnique({ where: { id: session.agencyId } })
    if (myAgency) redirect(`/${myAgency.slug}`)
    else redirect('/login')
  }

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        {/* Posielame slug a rolu do sidebaru */}
        <Sidebar slug={params.slug} role={session.role} /> 
      </div>
      
      <main className="md:pl-72 min-h-screen bg-slate-50/50">
        <MobileNav slug={params.slug} />
        <div className="p-4 md:p-8">
            {children}
        </div>
      </main>
    </div>
  )
}