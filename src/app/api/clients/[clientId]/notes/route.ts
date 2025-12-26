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
    const { text, isPinned } = body

    if (!text) return NextResponse.json({ error: 'Text je povinný' }, { status: 400 })

    const note = await prisma.clientNote.create({
      data: {
        text,
        isPinned: isPinned || false,
        clientId: params.clientId,
        userId: session.userId
      },
      include: { user: true }
    })

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}