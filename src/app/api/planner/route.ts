import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    let targetUserId = searchParams.get('userId') || session.userId

    // Access check: If requesting someone else, must be Admin/Traffic/Superadmin and same agency
    if (targetUserId !== session.userId) {
      if (!['ADMIN', 'TRAFFIC', 'SUPERADMIN'].includes(session.role) && !session.godMode) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
      if (!targetUser || (targetUser.agencyId !== session.agencyId && session.role !== 'SUPERADMIN' && !session.godMode)) {
        return NextResponse.json({ error: 'Target user not found or access denied' }, { status: 404 })
      }
    }

    const entries = await prisma.plannerEntry.findMany({
      where: { userId: targetUserId },
      include: { job: { include: { campaign: { include: { client: true } } } } },
      orderBy: { date: 'asc' }
    })
    return NextResponse.json(entries)
  } catch (error) {
    console.error("PLANNER GET ERROR:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { jobId, date, minutes, title } = body

    if (!title || !date) {
      return NextResponse.json({ error: 'Chýba názov alebo dátum' }, { status: 400 })
    }

    // Iba ak existuje a nie je 'INTERNAL', uloží ID jobu
    const finalJobId = jobId && jobId !== 'INTERNAL' ? jobId : null

    if (finalJobId) {
      const job = await prisma.job.findUnique({
        where: { id: finalJobId },
        include: { campaign: { include: { client: true } } }
      })
      if (!job || job.campaign.client.agencyId !== session.agencyId) {
        return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
      }
    }

    const interval = parseInt(body.recurrenceInterval || '0')
    const baseDate = new Date(date)
    let iterations = 1

    if (interval > 0) {
      if (interval === 1) iterations = 7 // 7 days
      else if (interval === 7) iterations = 8 // 8 weeks
      else if (interval === 14) iterations = 4 // 4 times (8 weeks)
      else if (interval === 30) iterations = 6 // 6 months
    }

    const createdEntries = []

    for (let i = 0; i < iterations; i++) {
      const entryDate = new Date(baseDate)
      entryDate.setDate(baseDate.getDate() + (i * interval))

      const entry = await prisma.plannerEntry.create({
        data: {
          userId: session.userId,
          jobId: finalJobId,
          date: entryDate,
          minutes: minutes ? parseInt(minutes) : 0,
          title: title
        }
      })
      createdEntries.push(entry)
    }

    return NextResponse.json(createdEntries[0])
  } catch (e) {
    console.error("PLANNER POST ERROR:", e)
    return NextResponse.json({ error: 'Chyba servera pri ukladaní plánu.' }, { status: 500 })
  }
}
