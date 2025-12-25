import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  const session = getSession()
  
  // OPRAVA: Pridaný ACCOUNT do zoznamu povolených rolí
  const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT'];
  
  if (!session || !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    // 1. Načítame dáta tendra
    const tender = await prisma.tender.findUnique({
      where: { id: params.tenderId },
      include: { assignments: true, files: true }
    })

    if (!tender) return NextResponse.json({ error: 'Tender nenájdený' }, { status: 404 })

    // 2. TRANSAKCIA: Vytvorenie klienta a preklopenie dát
    const result = await prisma.$transaction(async (tx) => {
      // A. Vytvoríme klienta
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
      // Poznámka: Keďže TenderAssignment je iný model, vytvoríme nové záznamy
      const tenderAssignments = await tx.tenderAssignment.findMany({
        where: { tenderId: tender.id }
      })

      for (const ta of tenderAssignments) {
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

      // F. Označíme tender ako vyhraný
      await tx.tender.update({
        where: { id: tender.id },
        data: { isConverted: true, status: 'DONE' }
      })

      return { client: newClient, job: newJob }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("CONVERT ERROR:", error)
    return NextResponse.json({ error: 'Chyba pri konverzii: ' + error.message }, { status: 500 })
  }
}