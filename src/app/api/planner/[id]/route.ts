import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Zabezpečenie: Maže len ten, kto záznam vytvoril
    await prisma.plannerEntry.delete({
      where: { id: params.id, userId: session.userId } 
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}