import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // ... (GET ostáva rovnaký) ...
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
    const entries = await prisma.plannerEntry.findMany({
      where: { userId: session.userId },
      include: { job: { include: { campaign: { include: { client: true } } } } },
      orderBy: { date: 'asc' }
    })
    return NextResponse.json(entries)
}

export async function POST(request: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { jobId, date, minutes, title } = body

  // OPRAVA: Iba ak existuje a nie je 'INTERNAL', ulož ID
  const finalJobId = jobId && jobId !== 'INTERNAL' ? jobId : null; 

  if (!title || !date) return NextResponse.json({ error: 'Chýba názov alebo dátum' }, { status: 400 })

  try {
    const entry = await prisma.plannerEntry.create({
      data: {
        userId: session.userId,
        jobId: finalJobId, // Uloží null, ak je to interná práca
        date: new Date(date),
        minutes: parseInt(minutes),
        title: title
      }
    })
    return NextResponse.json(entry)
  } catch (e) {
    console.error("PRISMA ERROR (PLANNER):", e)
    return NextResponse.json({ error: 'Chyba servera pri ukladaní plánu.' }, { status: 500 })
  }
}