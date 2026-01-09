import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession() // nezabudni await
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, deadline, budget, campaignId, externalLink, creativeIds, creativeAssignments } = body

    // Overenie povinných polí
    if (!title || !deadline || !campaignId) {
      return NextResponse.json({ error: 'Názov, termín a kampaň sú povinné' }, { status: 400 })
    }

    const parsedDate = new Date(deadline)
    if (isNaN(parsedDate.getTime())) {
      console.error("Invalid date format:", deadline)
      return NextResponse.json({ error: 'Neplatný formát dátumu' }, { status: 400 })
    }

    // 0. Verify Campaign belongs to session Agency
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { client: true }
    })

    if (!campaign || campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 })
    }

    // 1. Nájdi Traffic Managera alebo Admina pre automatické priradenie
    let trafficUser = await prisma.user.findFirst({
      where: { agencyId: session.agencyId, role: 'TRAFFIC', active: true }
    })

    if (!trafficUser) {
      trafficUser = await prisma.user.findFirst({
        where: { agencyId: session.agencyId, role: 'ADMIN', active: true }
      })
    }

    // 2. Priprav priradenia
    const currentUser = await prisma.user.findUnique({ where: { id: session.userId } })
    const assignmentsToCreate: any[] = [
      // Creator je vždy ACCOUNT
      {
        userId: session.userId,
        roleOnJob: 'ACCOUNT',
        assignedCostType: 'hourly',
        assignedBillingValue: currentUser?.hourlyRate || 0,
        assignedCostValue: currentUser?.costRate || currentUser?.hourlyRate || 0
      }
    ]

    // Ak existuje Traffic/Admin a nie je to ten istý človek ako Creator, pridáme ho
    if (trafficUser && trafficUser.id !== session.userId) {
      assignmentsToCreate.push({
        userId: trafficUser.id,
        roleOnJob: 'TRAFFIC',
        assignedCostType: 'hourly',
        assignedBillingValue: trafficUser.hourlyRate || 0,
        assignedCostValue: trafficUser.costRate || trafficUser.hourlyRate || 0
      })
    }

    // 3. Pridaj kreatívcov (ak sú poslaní, sú v TEJ ISTEJ AGENTÚRE a ešte nie sú v zozname)
    if (Array.isArray(creativeIds)) {
      const validCreatives = await prisma.user.findMany({
        where: {
          id: { in: creativeIds },
          agencyId: session.agencyId
        },
        select: { id: true, hourlyRate: true, defaultTaskRate: true, costRate: true } as any
      })

      const validIds = validCreatives.map(u => u.id)

      validIds.forEach(cId => {
        const isAlreadyAdded = assignmentsToCreate.some(a => a.userId === cId)
        if (!isAlreadyAdded) {
          // Check if we have detailed assignment info
          const override = Array.isArray(creativeAssignments) ? creativeAssignments.find((a: any) => a.userId === cId) : null
          const user = validCreatives.find(u => u.id === cId)

          assignmentsToCreate.push({
            userId: cId,
            roleOnJob: 'CREATIVE',
            assignedCostType: override?.costType || ((user as any)?.defaultTaskRate && (user as any).defaultTaskRate > 0 && (!user?.hourlyRate || user?.hourlyRate === 0) ? 'task' : 'hourly'),
            assignedCostValue: override?.costValue != null ? parseFloat(override.costValue) : (override?.costType === 'task' ? (user as any)?.defaultTaskRate : user?.costRate || user?.hourlyRate) ?? 0,
            assignedBillingValue: override?.billingValue != null ? parseFloat(override.billingValue) : user?.hourlyRate ?? 0
          })
        }
      })
    }

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId,
        status: 'TODO',
        externalLink: externalLink || null, // Explicitly handle null/undefined for optional fields
        assignments: {
          create: assignmentsToCreate
        }
      },
      include: {
        campaign: { include: { client: true } }
      }
    })

    // 4. Pošlime notifikácie všetkým okrem seba
    const { createNotification } = await import('@/lib/notifications')

    const notificationPromises = assignmentsToCreate
      .filter(a => a.userId !== session.userId) // Neposielať sebe
      .map(a => {
        return createNotification(
          a.userId,
          'Nová úloha',
          `Bola ti pridelená úloha "${title}" v kampani ${job.campaign.name} (${job.campaign.client.name})`,
          `/jobs/${job.id}`
        )
      })

    await Promise.all(notificationPromises)

    return NextResponse.json(job)

  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}
