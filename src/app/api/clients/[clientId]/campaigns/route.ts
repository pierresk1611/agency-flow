import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getSession()
    if (!session || session.role === 'CREATIVE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Názov kampane je povinný' }, { status: 400 })
    }

    // Skontrolujeme, či klient patrí do agentúry
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        clientId: params.clientId,
        createdById: session.userId
      }
    })

    return NextResponse.json(campaign)
  } catch (error: any) {
    console.error('CREATE_CAMPAIGN_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Chyba pri vytváraní kampane' }, { status: 500 })
  }
}
