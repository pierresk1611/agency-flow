import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Plánovač má vidieť VŠETKY joby agentúry, aby si mohol vybrať
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

  // Logika: jobId je voliteľné (ak je prázdny reťazec, dáme null)
  const finalJobId = jobId || null; 

  // Vytvoríme záznam
  const entry = await prisma.plannerEntry.create({
    data: {
      userId: session.userId,
      jobId: finalJobId, // Ak je prázdne, uloží sa null
      date: new Date(date),
      minutes: parseInt(minutes),
      title: title || 'Naplánovaná interná práca'
    }
  })
  return NextResponse.json(entry)
}