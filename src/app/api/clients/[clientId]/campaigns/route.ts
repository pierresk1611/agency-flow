import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const body = await request.json()
    const { name, description } = body
    if (!name) return NextResponse.json({ error: 'Názov je povinný' }, { status: 400 })

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        clientId: params.clientId
      }
    })
    return NextResponse.json(campaign)
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}