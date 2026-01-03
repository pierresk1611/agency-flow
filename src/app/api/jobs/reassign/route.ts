import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(request: Request) {
  try {
    const session = await getSession()
    if (!session || !['ADMIN', 'TRAFFIC', 'SUPERADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
    }

    const body = await request.json()
    const { assignmentId, newUserId } = body

    if (!assignmentId || !newUserId) {
      return NextResponse.json({ error: 'Chýbajúce údaje' }, { status: 400 })
    }

    // Overenie, či priradenie existuje
    const existingAssignment = await prisma.jobAssignment.findUnique({
      where: { id: assignmentId }
    })
    if (!existingAssignment) {
      return NextResponse.json({ error: 'Priradenie neexistuje' }, { status: 404 })
    }

    // Aktualizácia priradenia
    const updated = await prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { userId: newUserId },
      include: { job: true } // Fetch job to get title
    })

    // Ak existovali pending requesty pre tento assignment, označíme ich ako APPROVED
    const updateResult = await prisma.reassignmentRequest.updateMany({
      where: { assignmentId, status: 'PENDING' },
      data: { status: 'APPROVED' }
    })
    console.log(`REASSIGN SUCCESS: Assign ${assignmentId} moved to ${newUserId}. Requests approved: ${updateResult.count}`)

    // CLEANUP: Mark related notifications as READ for everyone
    // (To prevent stale notifications for other admins/traffic managers)
    try {
      await prisma.notification.updateMany({
        where: {
          title: `Žiadosť o presun: ${updated.job.title}`,
          isRead: false
        },
        data: { isRead: true }
      })
    } catch (err) {
      console.error("Failed to cleanup notifications:", err)
    }

    return NextResponse.json(updated)

  } catch (error: any) {
    console.error("REASSIGN JOB ERROR:", error)
    return NextResponse.json({ error: error.message || 'Chyba pri prehadzovaní jobu' }, { status: 500 })
  }
}
