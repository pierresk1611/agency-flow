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
  params: { slug: string }
}) {
  const session = getSession()
  if (!session) redirect('/login')

  // Overenie existencie agentúry podľa slugu
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })

  if (!agency) return notFound()

  // Izolácia: Prístup má Superadmin alebo člen danej agentúry
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    redirect('/login')
  }

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-slate-900">
        <Sidebar slug={params.slug} />
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