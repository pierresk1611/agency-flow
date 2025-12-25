import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { description, title, budget, status } = body

    const updated = await prisma.tender.update({
      where: { id: params.tenderId },
      data: {
        description,
        title,
        status,
        budget: budget ? parseFloat(budget) : undefined
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}