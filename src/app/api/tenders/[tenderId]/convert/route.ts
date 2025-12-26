import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  const session = await getSession()
  
  // Povolené role: ADMIN, TRAFFIC, SUPERADMIN, ACCOUNT
  const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
  if (!session || !allowedRoles.includes(session.role)) {
    return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    // 1. Načítanie tendra
    const tender = await prisma.tender.findUnique({
      where: { id: params.tenderId },
      include: { assignments: true, files: true }
    })

    if (!tender) return NextResponse.json({ error: 'Tender nenájdený' }, { status: 404 })

    // 2. Transakcia: vytvorenie klienta, kampane, jobu a presun dát
    const result = await prisma.$transaction(async (tx) => {
      // A. Vytvorenie klienta
      const newClient = await tx.client.create({
        data: {
          name: tender.title.replace(/^Tender:\s*/i, ''),
          priority: 3,
          agencyId: tender.agencyId,
          scope: 'Získané z tendra'
        }
      })

      // B. Vytvorenie kampane
      const newCampaign = await tx.campaign.create({
        data: {
          name: 'Úvodná kampaň (po výhre)',
          clientId: newClient.id
        }
      })

      // C. Vytvorenie jobu
      const newJob = await tx.job.create({
        data: {
          title: tender.title,
          campaignId: newCampaign.id,
          deadline: tender.deadline,
          budget: tender.budget,
          status: 'IN_PROGRESS'
        }
      })

      // D. Presun assignments
      const tenderAssignments = await tx.tenderAssignment.findMany({
        where: { tenderId: tender.id }
      })

      if (tenderAssignments.length > 0) {
        const jobAssignments = tenderAssignments.map(ta => ({
          jobId: newJob.id,
          userId: ta.userId,
          roleOnJob: ta.roleOnJob
        }))
        await tx.jobAssignment.createMany({ data: jobAssignments })
      }

      // E. Presun súborov
      if (tender.files.length > 0) {
        const fileUpdates = tender.files.map(f => ({
          where: { id: f.id },
          data: { jobId: newJob.id, tenderId: null }
        }))
        for (const update of fileUpdates) {
          await tx.file.update(update)
        }
      }

      // F. Označenie tendra ako vyhratého
      await tx.tender.update({
        where: { id: tender.id },
        data: { isConverted: true, status: 'DONE' }
      })

      return { client: newClient, job: newJob }
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("CONVERT TENDER ERROR:", error)
    return NextResponse.json({ error: 'Chyba pri konverzii: ' + error.message }, { status: 500 })
  }
}
