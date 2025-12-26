import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession() // ✔ správne await
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { assignmentId, targetUserId, reason } = body

    // Validácia vstupu
    if (!assignmentId || !targetUserId || !reason) {
      return NextResponse.json({ error: 'Chýbajúce údaje (assignment, cieľ, dôvod)' }, { status: 400 })
    }

    // Overenie, že assignment patrí k používateľovi alebo že je Creative
    const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } })
    if (!assignment) {
      return NextResponse.json({ error: 'Neplatný assignment' }, { status: 404 })
    }

    // Len Creative môže podávať reassign request (prípadne pridaj logiku pre adminov)
    if (session.role !== 'CREATIVE' && session.role !== 'ADMIN' && session.role !== 'TRAFFIC') {
      return NextResponse.json({ error: 'Nemáte oprávnenie podať žiadosť' }, { status: 403 })
    }

    const newRequest = await prisma.reassignmentRequest.create({
      data: {
        assignmentId,
        targetUserId,
        requestByUserId: session.userId,
        reason,
        status: 'PENDING'
      }
    })

    return NextResponse.json(newRequest)
  } catch (error) {
    console.error("REASSIGN REQUEST ERROR:", error)
    return NextResponse.json({ error: 'Chyba servera pri vytváraní žiadosti' }, { status: 500 })
  }
}
