import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const users = await prisma.user.findMany({
    where: { 
        agencyId: session.agencyId, // <--- IZOLÁCIA
        active: true 
    },
    orderBy: { email: 'asc' },
    select: { 
      id: true, email: true, name: true, position: true, 
      role: true, hourlyRate: true, costRate: true, active: true 
    }
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Iba ADMIN alebo TRAFFIC môže pridávať ľudí (voliteľné)
  if (session.role !== 'ADMIN' && session.role !== 'TRAFFIC') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { email, name, password, role, position, hourlyRate, costRate } = body

  if (!email || !password || !role) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: 'Email exists' }, { status: 400 })

  // Pozície ukladáme pre túto agentúru
  if (position) {
    const exists = await prisma.agencyPosition.findFirst({
      where: { agencyId: session.agencyId, name: position }
    })
    if (!exists) {
      await prisma.agencyPosition.create({ data: { agencyId: session.agencyId, name: position } })
    }
  }

  const passwordHash = await bcrypt.hash(password, 10)
  
  const newUser = await prisma.user.create({
    data: {
      email, name, position, role, passwordHash,
      hourlyRate: parseFloat(hourlyRate || '0'),
      costRate: parseFloat(costRate || '0'),
      agencyId: session.agencyId, // <--- PRIRADENIE K SPRÁVNEJ AGENTÚRE
      active: true
    }
  })

  return NextResponse.json(newUser)
}