import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request, { params }: { params: { clientId: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { text, isPinned } = body

    const note = await prisma.clientNote.create({
      data: {
        clientId: params.clientId,
        userId: session.userId,
        text,
        isPinned: isPinned || false
      },
      include: { user: true }
    })

    return NextResponse.json(note)
  } catch (error) {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}