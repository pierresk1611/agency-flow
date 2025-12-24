import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  // 1. Iba Superadmin môže použiť tento endpoint
  const session = getSession()
  if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { agencyId } = body

    if (!agencyId) return NextResponse.json({ error: 'Chýba ID agentúry' }, { status: 400 })

    // 2. Overíme, či agentúra existuje
    const targetAgency = await prisma.agency.findUnique({ where: { id: agencyId } })
    if (!targetAgency) return NextResponse.json({ error: 'Agentúra neexistuje' }, { status: 404 })

    // 3. Vyrobíme "falošný" token
    // Do tokenu dáme ID Superadmina, ale agencyId cieľovej agentúry.
    // Tým pádom session.ts pustí usera dnu a prisma bude filtrovať dáta tej agentúry.
    const token = jwt.sign(
      {
        userId: session.userId,
        role: 'SUPERADMIN', // Ponecháme rolu, aby sme vedeli, že je to on
        agencyId: targetAgency.id
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    return NextResponse.json({ token })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}