import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const agency = await prisma.agency.findFirst()
    if (!agency) return NextResponse.json([])

    const positions = await prisma.agencyPosition.findMany({
      where: { agencyId: agency.id },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(positions)
  } catch (error) {
    return NextResponse.json({ error: 'Database Error' }, { status: 500 })
  }
}