import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, deadline, budget, description } = body

    if (!title || !deadline) {
        return NextResponse.json({ error: 'Názov a deadline sú povinné' }, { status: 400 })
    }

    const tender = await prisma.tender.create({
      data: {
        title,
        description: description || "",
        deadline: new Date(deadline),
        budget: parseFloat(budget || '0'),
        agencyId: session.agencyId,
        status: 'TODO'
      }
    })

    return NextResponse.json(tender)
  } catch (error: any) {
    console.error("TENDER CREATE ERROR:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}