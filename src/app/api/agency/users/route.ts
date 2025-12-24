import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const users = await prisma.user.findMany({
      where: { 
        agencyId: session.agencyId,
        active: true 
      },
      orderBy: { email: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        hourlyRate: true,
        costRate: true,
        active: true
      }
    })
    
    return NextResponse.json(users || [])
  } catch (error) {
    console.error("GET USERS ERROR:", error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { email, name, password, role, position, hourlyRate, costRate } = body

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, heslo a rola sú povinné' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Užívateľ s týmto emailom už existuje' }, { status: 400 })
    }

    // Učiaca sa logika pre Pozície
    if (position) {
      const exists = await prisma.agencyPosition.findFirst({
        where: { agencyId: session.agencyId, name: position }
      })
      if (!exists) {
        await prisma.agencyPosition.create({ 
          data: { agencyId: session.agencyId, name: position } 
        })
      }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        position,
        passwordHash,
        role,
        hourlyRate: parseFloat(hourlyRate || '0'),
        costRate: parseFloat(costRate || '0'),
        agencyId: session.agencyId,
        active: true
      }
    })

    const { passwordHash: _, ...userWithoutPassword } = newUser
    return NextResponse.json(userWithoutPassword)

  } catch (error: any) {
    console.error("Create user error:", error)
    return NextResponse.json({ error: 'Chyba servera pri vytváraní užívateľa' }, { status: 500 })
  }
}