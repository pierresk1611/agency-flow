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

    // 1. Update status
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