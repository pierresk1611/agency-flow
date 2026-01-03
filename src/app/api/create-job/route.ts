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

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId,
        status: 'TODO',
        externalLink
      }
    })

    return NextResponse.json(job)

  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}
