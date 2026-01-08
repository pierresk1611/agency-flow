import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session || (!['ADMIN', 'ACCOUNT', 'TRAFFIC', 'SUPERADMIN'].includes(session.role) && !session.godMode)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const currentUserId = session.userId

    const { timesheetId, status } = await request.json()
    if (!timesheetId || !['APPROVED', 'REJECTED'].includes(status))
      return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 })

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: {
        jobAssignment: {
          include: {
            user: true,
            job: { include: { campaign: { include: { client: true } } } }
          }
        }
      }
    })

    if (!timesheet || timesheet.jobAssignment.job.campaign.client.agencyId !== session.agencyId) {
      return NextResponse.json({ error: 'Timesheet nenájdený alebo nedostupný' }, { status: 404 })
    }

    if (timesheet.status === status)
      return NextResponse.json({ success: true, message: 'Already set' })

    if (status === 'APPROVED') {
      const hours = (timesheet.durationMinutes || 0) / 60

      // HYBRID LOGIKA: Check assignedCostType from assignment
      const costType = (timesheet.jobAssignment as any).assignedCostType || 'hourly'
      const assignedValue = (timesheet.jobAssignment as any).assignedCostValue

      let rate = 0
      let amount = 0

      if (costType === 'task') {
        rate = assignedValue ?? ((timesheet.jobAssignment.user as any).defaultTaskRate || 0)
        amount = rate // Fixed sum for task
      } else {
        // Hourly logic (fallback to user's hourly rate if assigned value is null)
        rate = assignedValue ?? (timesheet.jobAssignment.user.hourlyRate || 0)
        amount = hours * rate
      }

      await prisma.$transaction(async (tx) => {
        await tx.timesheet.update({
          where: { id: timesheetId },
          data: { status: 'APPROVED', approvedBy: currentUserId, approvedAt: new Date() }
        })
        await tx.budgetItem.upsert({
          where: { timesheetId },
          update: { hours, rate, amount },
          create: { jobId: timesheet.jobAssignment.jobId, timesheetId, hours, rate, amount }
        })
      })

      // NOTIFIKÁCIA: Timesheet Approved
      const tsDetails = await prisma.timesheet.findUnique({
        where: { id: timesheetId },
        include: { jobAssignment: { include: { job: { include: { campaign: { include: { client: { include: { agency: true } } } } } } } } }
      })

      if (tsDetails) {
        const slug = tsDetails.jobAssignment.job.campaign.client.agency.slug
        await createNotification(
          tsDetails.jobAssignment.userId,
          "Výkaz schválený",
          `Váš čas na jobe "${tsDetails.jobAssignment.job.title}" bol schválený.`,
          `/${slug}/timesheets`
        )
      }

    } else {
      await prisma.timesheet.update({
        where: { id: timesheetId },
        data: { status: 'REJECTED', approvedBy: currentUserId, approvedAt: new Date() }
      })

      // NOTIFIKÁCIA: Timesheet Reject
      // NOTIFIKÁCIA: Timesheet Reject
      const tsDetails = await prisma.timesheet.findUnique({
        where: { id: timesheetId },
        include: { jobAssignment: { include: { job: { include: { campaign: { include: { client: { include: { agency: true } } } } } } } } }
      })

      if (tsDetails) {
        const slug = tsDetails.jobAssignment.job.campaign.client.agency.slug
        await createNotification(
          tsDetails.jobAssignment.userId,
          "Výkaz vrátený na opravu",
          `Váš čas na jobe "${tsDetails.jobAssignment.job.title}" bol zamietnutý. Prosím, upravte ho.`,
          `/${slug}/timesheets`
        )
      }
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Review error DETAIL:', error)
    return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
  }
}
