import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { timesheetId: string } }
) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const updated = await prisma.timesheet.update({
      where: { id: params.timesheetId },
      data: { isUrgent: true }
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Nudge failed' }, { status: 500 })
  }
}