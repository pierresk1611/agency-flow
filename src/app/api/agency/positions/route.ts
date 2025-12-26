// src/app/api/positions/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Načítame prvú agentúru (prípadne podľa nejakého slug alebo session)
    const agency = await prisma.agency.findFirst()

    if (!agency) {
      // Ak agentúra neexistuje, vrátime prázdne pole
      return NextResponse.json([], { status: 200 })
    }

    // Načítame pozície pre danú agentúru
    const positions = await prisma.agencyPosition.findMany({
      where: { agencyId: agency.id },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(positions)
  } catch (error) {
    console.error("Positions API Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
