// app/api/traffic/requests/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter pre kreatívnych používateľov: iba joby, kde sú priradení
    const userJobFilter = session.role === 'CREATIVE'
      ? { assignments: { some: { userId: session.userId } } }
      : {}

    // Načítanie používateľov agentúry
    const rawUsers = await prisma.user.findMany({
      where: { 
        agencyId: session.agencyId,
        active: true
      },
      orderBy: { position: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        role: true,
        assignments: {
          where: { job: { status: { not: 'DONE' }, archivedAt: null, ...userJobFilter } },
          include: { 
            job: { 
              select: {
                id: true,
                title: true,
                deadline: true,
                campaign: { select: { name: true, client: { select: { name: true } } } }
              } 
            }
          }
        }
      }
    })

    // Serializácia dát (pre všetky dátumy)
    const serializedUsers = JSON.parse(JSON.stringify(rawUsers))

    // Zoskupenie podľa pozície
    const usersByPosition: Record<string, any[]> = {}
    serializedUsers.forEach((user: any) => {
      const pos = user.position || 'Ostatní'
      if (!usersByPosition[pos]) usersByPosition[pos] = []
      usersByPosition[pos].push(user)
    })

    return NextResponse.json({
      users: serializedUsers,
      usersByPosition
    })
  } catch (error: any) {
    console.error('CRITICAL TRAFFIC FETCH ERROR:', error)
    return NextResponse.json(
      { error: 'Chyba servera pri načítaní vyťaženosti: ' + error.message },
      { status: 500 }
    )
  }
}
