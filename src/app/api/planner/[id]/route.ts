import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    await prisma.plannerEntry.delete({
      where: { id: params.id, userId: session.userId } 
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
// NOVÉ: PATCH (pre úpravu)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        
        const body = await request.json()
        const { jobId, date, minutes, title } = body

        const finalJobId = jobId && jobId !== 'INTERNAL' ? jobId : null;

        const updated = await prisma.plannerEntry.update({
            where: { id: params.id, userId: session.userId },
            data: {
                jobId: finalJobId,
                date: new Date(date),
                minutes: parseInt(minutes),
                title: title
            }
        })
        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }
}