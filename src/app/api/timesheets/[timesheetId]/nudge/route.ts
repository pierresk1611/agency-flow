import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { createNotification } from '@/lib/notifications'

export async function PATCH(
  request: Request,
  { params }: { params: { timesheetId: string } }
) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // 1. Verify ownership/agency
    const timesheet = await prisma.timesheet.findUnique({
      where: { id: params.timesheetId },
      include: { jobAssignment: { include: { job: { include: { campaign: { include: { client: true } } } } } } }
    })

    if (!timesheet || timesheet.jobAssignment.job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Timesheet not found or access denied' }, { status: 404 })
    }

    // Optional: Only the owner can nudge
    if (session.role === 'CREATIVE' && timesheet.jobAssignment.userId !== session.userId) {
      return NextResponse.json({ error: 'You can only nudge your own timesheets' }, { status: 403 })
    }

    // 2. Update status
    const updated = await prisma.timesheet.update({
      where: { id: params.timesheetId },
      data: { isUrgent: true }
    })

    // 2. Fetch agency info for slug
    const agency = await prisma.agency.findUnique({
      where: { id: session.agencyId },
      select: { slug: true }
    })

    if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

    // 3. Find managers
    const managers = await prisma.user.findMany({
      where: {
        agencyId: session.agencyId,
        role: { in: ['ACCOUNT', 'TRAFFIC', 'ADMIN'] },
        active: true
      }
    })

    // 4. Notify all managers
    for (const manager of managers) {
      await createNotification(
        manager.id,
        "URGENT: Schválenie výkazu",
        "Kreatívec žiada o urgentné schválenie timesheetu.",
        `/${agency.slug}/timesheets`
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Nudge error:", error)
    return NextResponse.json({ error: 'Nudge failed' }, { status: 500 })
  }
}