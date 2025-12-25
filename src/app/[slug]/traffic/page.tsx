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

  // Kontrola práv (Traffic menu je pre všetkých, ale iba na pozeranie/žiadanie)
  // Traffic Workload Manager sa postará o zoskupenie dát
  
  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Traffic & Kapacita</h2>
        <p className="text-muted-foreground text-sm font-medium">Prehľad vyťaženosti tímu podľa odbornosti. Klik pre presun úloh.</p>
      </div>

      <TrafficWorkloadManager role={session.role} slug={params.slug} />

    </div>
  )
}