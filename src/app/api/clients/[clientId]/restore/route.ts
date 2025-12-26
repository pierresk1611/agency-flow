import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Overenie, že klient patrí do agentúry session
    const client = await prisma.client.findUnique({
      where: { id: params.clientId }
    })
    if (!client || client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Klient nenájdený alebo mimo agentúry' }, { status: 404 })
    }

    const updatedClient = await prisma.client.update({
      where: { id: params.clientId },
      data: { archivedAt: null }
    })

    return NextResponse.json(updatedClient)
  } catch (error: any) {
    console.error('RESTORE_CLIENT_ERROR:', error)
    return NextResponse.json({ error: error.message || 'Chyba pri obnovovaní klienta' }, { status: 500 })
  }
}
