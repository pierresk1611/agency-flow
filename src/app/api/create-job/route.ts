import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession() // nezabudni await
    if (!session)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, deadline, budget, campaignId, externalLink } = await request.json()

    // Overenie povinných polí
    if (!title || !deadline || !campaignId) {
      return NextResponse.json({ error: 'Názov, termín a kampaň sú povinné' }, { status: 400 })
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
    const assignmentsToCreate = [
      // Creator je vždy ACCOUNT
      { userId: session.userId, roleOnJob: 'ACCOUNT' }
    ]

    // Ak existuje Traffic/Admin a nie je to ten istý človek ako Creator, pridáme ho
    if (trafficUser && trafficUser.id !== session.userId) {
      assignmentsToCreate.push({
        userId: trafficUser.id,
        roleOnJob: 'TRAFFIC'
      })
    }

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId,
        status: 'TODO',
        externalLink,
        assignments: {
          create: assignmentsToCreate
        }
      }
    })

    return NextResponse.json(job)

  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}
