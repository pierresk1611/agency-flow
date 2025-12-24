import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { clientId: string } }
) {
  try {
    await prisma.client.update({
      where: { id: params.clientId },
      data: { archivedAt: new Date() }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Chyba' }, { status: 500 })
  }
}