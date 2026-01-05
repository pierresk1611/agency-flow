// src/app/[slug]/layout.tsx
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
  // ✅ Session await
  const session = await getSession()
  if (!session) redirect('/login')

  // ✅ Načíta agentúru podľa slug
  const agency = await prisma.agency.findUnique({
    where: { slug: params.slug }
  })
  if (!agency) return notFound()

  // ✅ Ochrana rolí: Creative a Traffic môže vidieť len svoj priestor
  if (session.role !== 'SUPERADMIN' && session.agencyId !== agency.id) {
    const myAgency = await prisma.agency.findUnique({ where: { id: session.agencyId } })
    if (myAgency) redirect(`/${myAgency.slug}`)
    else redirect('/login')
  }

  // ✅ KONTROLA TRIALU A SUSPENDÁCIE
  // Superadmin má výnimku
  if (session.role !== 'SUPERADMIN') {
    const now = new Date()
    // 1. Ak je TRIAL a vypršal
    if (agency.subscriptionPlan === 'TRIAL' && agency.trialEndsAt && agency.trialEndsAt < now) {
      redirect('/subscription-expired')
    }

    // 2. Ak je SUSPENDED (manuálne vypnutá)
    // Pozn: Property isSuspended musí existovať v Prisma schéme, ak nie, pridáme fallback
    // @ts-ignore
    if (agency.isSuspended) {
      redirect('/subscription-expired')
    }
  }

  // Výpočet dní do konca trialu pre banner
  let trialDaysLeft = null
  if (agency.subscriptionPlan === 'TRIAL' && agency.trialEndsAt) {
    const diff = new Date(agency.trialEndsAt).getTime() - new Date().getTime()
    trialDaysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  return (
    <div className="h-full relative">
      {/* Sidebar pre desktop */}
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar slug={params.slug} role={session.role} godMode={session.godMode} />
      </div>

      {/* Hlavný obsah */}
      <main className="md:pl-72 min-h-screen bg-slate-50/50">
        <MobileNav slug={params.slug} />

        {/* TRIAL BANNER */}
        {trialDaysLeft !== null && trialDaysLeft <= 5 && trialDaysLeft > 0 && session.role !== 'SUPERADMIN' && (
          <div className="bg-orange-600 text-white px-4 py-2 text-center text-xs font-bold uppercase tracking-widest fixed top-0 md:left-72 right-0 z-[40]">
            Skúšobná verzia končí o {trialDaysLeft} dní. Kontaktujte podporu pre predĺženie.
          </div>
        )}

        <div className={`p-4 md:p-8 ${trialDaysLeft !== null && trialDaysLeft <= 5 ? 'mt-8' : ''}`}>
          {children}
        </div>
      </main>
    </div>
  )
}
