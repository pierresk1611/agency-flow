import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Načítame pozície pre dany agencyId zo session
    const positions = await prisma.agencyPosition.findMany({
      where: { agencyId: session.agencyId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(positions)
  } catch (error) {
    console.error("Positions API Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
