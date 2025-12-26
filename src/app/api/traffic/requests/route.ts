import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// Toto API stiahne iba nevyhnutné informácie pre traffic managera a je robustné
export async function GET() {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Nájdenie Jobov, kde je človek v tíme (všetky joby, ak je admin/traffic)
    const userJobFilter = session.role === 'CREATIVE' ? { 
        assignments: { some: { userId: session.userId } }
    } : {}

    const rawUsers = await prisma.user.findMany({
      where: { 
          agencyId: session.agencyId,
          active: true 
      },
      orderBy: { position: 'asc' },
      select: {
          id: true, email: true, name: true, position: true, role: true,
          assignments: {
              where: { job: { status: { not: 'DONE' }, archivedAt: null, ...userJobFilter } },
              include: { 
                  job: { 
                      select: {
                          id: true, title: true, deadline: true,
                          campaign: { select: { name: true, client: { select: { name: true } } } }
                      } 
                  }
              }
          }
      }
    })

    // SERIALIZÁCIA - PREVOD VŠETKÝCH DÁTUMOV NA STRING (FINÁLNE RIEŠENIE 500)
    const serializedUsers = JSON.parse(JSON.stringify(rawUsers))

    // Zoskupenie pre frontend
    const usersByPosition: Record<string, any[]> = {}
    serializedUsers.forEach((user: any) => {
        const pos = user.position || "Ostatní"
        if (!usersByPosition[pos]) usersByPosition[pos] = []
        usersByPosition[pos].push(user)
    })
    
    return NextResponse.json({ 
        users: serializedUsers, 
        usersByPosition: usersByPosition 
    })
    
  } catch (error: any) {
    console.error("CRITICAL TRAFFIC FETCH ERROR:", error)
    // Ak spadne server (napr. databáza), pošleme 500
    return NextResponse.json({ error: 'Chyba servera pri načítaní vyťaženosti: ' + error.message }, { status: 500 })
  }
}