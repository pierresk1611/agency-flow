import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email a heslo sú povinné' }, { status: 400 })
    }

    // 1. Nájdi usera
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.active) {
      return NextResponse.json({ error: 'Nesprávne údaje' }, { status: 401 })
    }

    // 2. Over heslo
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Nesprávne heslo' }, { status: 401 })
    }

    // 3. Vygeneruj Token
    const token = jwt.sign(
      { userId: user.id, role: user.role, agencyId: user.agencyId },
      JWT_SECRET,
      { expiresIn: '1d' }
    )

    // 4. Vráť odpoveď
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, role: user.role }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}