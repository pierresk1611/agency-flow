import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    // Obnovenie = nastavenie archivedAt na null
    await prisma.client.update({
      where: { id: params.clientId },
      data: { archivedAt: null }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Chyba pri obnovovaní' }, { status: 500 })
  }
}