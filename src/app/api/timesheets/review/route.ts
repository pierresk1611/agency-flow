import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { createNotification } from '@/lib/notifications'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const currentUserId = decoded.userId

    const { timesheetId, status } = await request.json()
    if (!timesheetId || !['APPROVED', 'REJECTED'].includes(status))
      return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 })

    const timesheet = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { jobAssignment: { include: { user: true, job: true } } }
    })
    if (!timesheet) return NextResponse.json({ error: 'Timesheet nenájdený' }, { status: 404 })

    if (timesheet.status === status)
      return NextResponse.json({ success: true, message: 'Already set' })

    if (status === 'APPROVED') {
      const hours = (timesheet.durationMinutes || 0) / 60
      const rate = timesheet.jobAssignment.user.hourlyRate ?? 0
      const amount = hours * rate

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
