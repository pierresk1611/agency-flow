import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  const session = getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'TRAFFIC')) {
    return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    // 1. Načítame dáta tendra
    const tender = await prisma.tender.findUnique({
      where: { id: params.tenderId },
      include: { assignments: true, files: true }
    })

    if (!tender) return NextResponse.json({ error: 'Tender nenájdený' }, { status: 404 })

    // 2. TRANSAKCIA: Vytvoríme klienta a všetko pod ním
    const result = await prisma.$transaction(async (tx) => {
      // A. Vytvoríme klienta (použijeme názov tendra ako dočasný názov firmy)
      const newClient = await tx.client.create({
        data: {
          name: tender.title.replace('Tender: ', ''),
          priority: 3,
          agencyId: tender.agencyId,
          scope: 'Získané z tendra'
        }
      })

      // B. Vytvoríme kampaň
      const newCampaign = await tx.campaign.create({
        data: {
          name: 'Úvodná kampaň (po výhre)',
          clientId: newClient.id
        }
      })

      // C. Vytvoríme Job
      const newJob = await tx.job.create({
        data: {
          title: tender.title,
          campaignId: newCampaign.id,
          deadline: tender.deadline,
          budget: tender.budget,
          status: 'IN_PROGRESS'
        }
      })

      // D. Presunieme priradených ľudí (TenderAssignment -> JobAssignment)
      for (const ta of tender.assignments) {
        await tx.jobAssignment.create({
          data: {
            jobId: newJob.id,
            userId: ta.userId,
            roleOnJob: ta.roleOnJob
          }
        })
      }

      // E. Presunieme súbory
      for (const file of tender.files) {
          await tx.file.update({
              where: { id: file.id },
              data: { jobId: newJob.id, tenderId: null }
          })
      }

      // F. Označíme tender ako vyhraný/skonvertovaný
      await tx.tender.update({
        where: { id: tender.id },
        data: { isConverted: true, status: 'DONE' }
      })

      return { client: newClient, job: newJob }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Chyba pri konverzii' }, { status: 500 })
  }
}