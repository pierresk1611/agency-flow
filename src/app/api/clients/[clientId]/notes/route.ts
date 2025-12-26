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
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text, isPinned } = await request.json()

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Text poznámky je povinný' }, { status: 400 })
    }

    // Overíme, že klient patrí do agentúry session
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const note = await prisma.clientNote.create({
      data: {
        text: text.trim(),
        isPinned: Boolean(isPinned),
        clientId: params.clientId,
        userId: session.userId
      },
      include: { user: true } // Zahrnutie informácií o užívateľovi
    })

    return NextResponse.json(note)
  } catch (error: any) {
    console.error('CREATE_CLIENT_NOTE_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Chyba servera' }, { status: 500 })
  }
}
