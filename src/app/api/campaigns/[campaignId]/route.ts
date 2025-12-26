import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { title, deadline, budget } = await request.json()

    if (!title || !deadline) {
      return NextResponse.json({ error: 'Názov a termín sú povinné' }, { status: 400 })
    }

    const parsedDeadline = new Date(deadline)
    if (isNaN(parsedDeadline.getTime())) {
      return NextResponse.json({ error: 'Neplatný dátum' }, { status: 400 })
    }

    const parsedBudget = parseFloat(budget)
    const job = await prisma.job.create({
      data: {
        title,
        deadline: parsedDeadline,
        budget: isNaN(parsedBudget) ? 0 : parsedBudget,
        campaignId: params.campaignId,
        status: 'TODO',
        createdById: session.userId,
        agencyId: session.agencyId
      }
    })

    return NextResponse.json(job)
  } catch (error: any) {
    console.error("CREATE JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba servera pri vytváraní jobu.' }, { status: 500 })
  }
}