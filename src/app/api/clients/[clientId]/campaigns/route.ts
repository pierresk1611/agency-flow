import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, description } = body

    if (!name) return NextResponse.json({ error: 'Názov kampane je povinný' }, { status: 400 })

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        clientId: params.clientId
      }
    })

    return NextResponse.json(campaign)
  } catch (error) {
    return NextResponse.json({ error: 'Chyba pri vytváraní kampane' }, { status: 500 })
  }
}