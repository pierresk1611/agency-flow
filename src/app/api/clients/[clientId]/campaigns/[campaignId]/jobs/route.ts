import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { campaignId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify campaign belongs to agency
    const campaign = await prisma.campaign.findUnique({
      where: { id: params.campaignId },
      include: { client: true }
    })

    if (!campaign || campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Campaign not found or access denied' }, { status: 404 })
    }

    const body = await request.json()
    const { title, deadline, budget } = body

    if (!title || !deadline) return NextResponse.json({ error: 'Názov a termín sú povinné' }, { status: 400 })

    const job = await prisma.job.create({
      data: {
        title,
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        campaignId: params.campaignId,
        status: 'TODO'
      }
    })

    return NextResponse.json(job)

  } catch (error) {
    return NextResponse.json({ error: 'Chyba pri vytváraní jobu' }, { status: 500 })
  }
}