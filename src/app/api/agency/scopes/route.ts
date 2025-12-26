import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const agency = await prisma.agency.findFirst()
    if (!agency) return NextResponse.json([], { status: 200 })

    const scopes = await prisma.agencyScope.findMany({
      where: { agencyId: agency.id },
      orderBy: { name: 'asc' } 
    })

    return NextResponse.json(scopes)
  } catch (error) {
    console.error("Scopes API Error:", error)
    return NextResponse.json({ error: 'Error fetching scopes' }, { status: 500 })
  }
}
