import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const body: { email?: string, password?: string } = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email a heslo sú povinné' }, { status: 400 })
    }

    // 1. Načítanie užívateľa spolu s agentúrou
    const user = await prisma.user.findUnique({
      where: { email },
      include: { agency: true } // zabezpečíme prístup k slug
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Užívateľ neexistuje alebo je neaktívny' }, { status: 401 })
    }

    // 2. Overenie hesla
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Nesprávne heslo' }, { status: 401 })
    }

    // 3. Kontrola priradenia k agentúre
    if (!user.agencyId || !user.agency) {
      return NextResponse.json({ error: 'Užívateľ nie je priradený k žiadnej agentúre. Kontaktujte podporu.' }, { status: 403 })
    }

    // 4. Generovanie JWT tokenu
    const token = jwt.sign(
      { userId: user.id, role: user.role, agencyId: user.agencyId },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    // 5. Vrátenie tokenu a základných údajov pre front-end
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        agencySlug: user.agency.slug
      }
    })

  } catch (error: any) {
    console.error('LOGIN ERROR:', error)
    return NextResponse.json({ error: 'Interná chyba servera: ' + error.message }, { status: 500 })
  }
}