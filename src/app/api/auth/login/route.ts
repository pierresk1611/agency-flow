import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email a heslo sú povinné' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true }
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Užívateľ neexistuje alebo je neaktívny' }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Nesprávne heslo' }, { status: 401 })
    }

    // OCHRANA: Ak užívateľ nemá agentúru
    if (!user.agencyId || !user.agency) {
        return NextResponse.json({ error: 'Užívateľ nie je priradený k žiadnej agentúre. Kontaktujte podporu.' }, { status: 403 })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, agencyId: user.agencyId },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        agencySlug: user.agency.slug // Toto zaručene existuje vďaka include
      },
    })

  } catch (error) {
    console.error('LOGIN ERROR:', error)
    return NextResponse.json({ error: 'Interná chyba servera' }, { status: 500 })
  }
}