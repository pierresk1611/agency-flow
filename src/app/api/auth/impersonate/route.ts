import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  // 1. Overenie Superadmina
  const session = getSession()
  if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { agencyId } = body

    if (!agencyId) return NextResponse.json({ error: 'Chýba ID agentúry' }, { status: 400 })

    // 2. Nájdeme agentúru, aby sme získali jej SLUG
    const targetAgency = await prisma.agency.findUnique({ 
        where: { id: agencyId } 
    })
    
    if (!targetAgency) return NextResponse.json({ error: 'Agentúra neexistuje' }, { status: 404 })

    // 3. Vygenerujeme GOD MODE Token
    // V tokene zmeníme agencyId na ID cieľovej agentúry
    const token = jwt.sign(
      {
        userId: session.userId,
        role: 'SUPERADMIN',
        agencyId: targetAgency.id // Odteraz sa Prisma bude pýtať na túto agentúru
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    // 4. VRÁTIME TOKEN AJ SLUG
    return NextResponse.json({ 
        token, 
        slug: targetAgency.slug // <--- TOTO JE KĽÚČOVÉ PRE REDIRECT
    })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}