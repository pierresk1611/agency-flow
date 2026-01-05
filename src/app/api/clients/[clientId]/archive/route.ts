import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    const session = await getSession()
    if (!session || (session.role === 'CREATIVE' && !session.godMode)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const client = await prisma.client.findUnique({ where: { id: params.clientId } })
    if (!client || (client.agencyId !== session.agencyId && session.role !== 'SUPERADMIN' && !session.godMode)) {
      return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
    }

    await prisma.client.update({
      where: { id: params.clientId },
      data: { archivedAt: new Date() }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Chyba' }, { status: 500 })
  }
}