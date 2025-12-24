import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const agency = await prisma.agency.findFirst()
    
    if (!agency) {
      return NextResponse.json([])
    }

    const positions = await prisma.agencyPosition.findMany({
      where: { agencyId: agency.id },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(positions || [])
  } catch (error) {
    console.error("Positions API Error:", error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}