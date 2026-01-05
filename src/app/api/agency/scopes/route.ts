import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const scopes = await prisma.agencyScope.findMany({
      where: { agencyId: session.agencyId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(scopes)
  } catch (error) {
    console.error("Scopes API Error:", error)
    return NextResponse.json({ error: 'Error fetching scopes' }, { status: 500 })
  }
}
