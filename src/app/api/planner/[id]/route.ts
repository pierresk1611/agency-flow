import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function DELETE(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.plannerEntry.deleteMany({
      where: { id: params.id, userId: session.userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("PLANNER DELETE ERROR:", error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}

// NOVÉ: PATCH (pre úpravu)
export async function PATCH(
  request: Request, 
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { jobId, date, minutes, title } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Chýba názov alebo dátum' }, { status: 400 })
    }

    const finalJobId = jobId && jobId !== 'INTERNAL' ? jobId : null;

    const updated = await prisma.plannerEntry.updateMany({
      where: { id: params.id, userId: session.userId },
      data: {
        jobId: finalJobId,
        date: new Date(date),
        minutes: minutes ? parseInt(minutes) : 0,
        title: title
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("PLANNER PATCH ERROR:", error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}
