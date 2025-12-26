import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secret'

export async function POST(request: Request) {
  // 1. Overenie Superadmina
  const session = await getSession() // ✅ must await
  if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Prístup zamietnutý' }, { status: 403 })
  }

  try {
    const body: { agencyId?: string } = await request.json()
    const { agencyId } = body

    if (!agencyId) return NextResponse.json({ error: 'Chýba ID agentúry' }, { status: 400 })

    // 2. Nájdeme agentúru, aby sme získali jej SLUG
    const targetAgency = await prisma.agency.findUnique({ 
        where: { id: agencyId } 
    })
    
    if (!targetAgency) return NextResponse.json({ error: 'Agentúra neexistuje' }, { status: 404 })

    // 3. Vygenerujeme GOD MODE Token
    const token = jwt.sign(
      {
        userId: session.userId,
        role: 'SUPERADMIN',
        agencyId: targetAgency.id
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    )

    // 4. Vrátime token a slug
    return NextResponse.json({ 
        token, 
        slug: targetAgency.slug
    })

  } catch (error: any) {
    console.error("SUPERADMIN GODMODE ERROR:", error)
    return NextResponse.json({ error: 'Server Error: ' + error.message }, { status: 500 })
  }
}
