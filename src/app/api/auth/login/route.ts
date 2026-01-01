import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

// FORCE LOCAL CONNECTION
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
})

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
      // SUPERADMIN bypass (nemusí mať agentúru v niektorých prípadoch, ale tu predpokladáme, že má)
      if (user.role === 'SUPERADMIN') {
        // OK
      } else {
        return NextResponse.json({ error: 'Užívateľ nie je priradený k žiadnej agentúre. Kontaktujte podporu.' }, { status: 403 })
      }
    }

    // 4. KONTROLA SUSPENDÁCIE (Nezaplatené demo) - SUPERADMIN má vždy prístup
    if (user.agency && user.agency.isSuspended && user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Váš účet bol pozastavený z dôvodu neúhrady. Kontaktujte podporu.' }, { status: 403 })
    }

    // 5. Generovanie JWT tokenu
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