import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const entries = await prisma.plannerEntry.findMany({
      where: { userId: session.userId },
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

    const entry = await prisma.plannerEntry.create({
      data: {
        userId: session.userId,
        jobId: finalJobId,
        date: new Date(date),
        minutes: minutes ? parseInt(minutes) : 0,
        title: title
      }
    })

    return NextResponse.json(entry)
  } catch (e) {
    console.error("PLANNER POST ERROR:", e)
    return NextResponse.json({ error: 'Chyba servera pri ukladaní plánu.' }, { status: 500 })
  }
}
