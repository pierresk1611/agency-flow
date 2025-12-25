import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

// TOTO JE KĽÚČOVÉ: Zakáže cacheovanie
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'

    // DEBUG LOG (Uvidíš ho vo Vercel Logs)
    console.log(`Fetching clients for agency: ${session.agencyId}, Archived: ${showArchived}`)

    // Základný filter: Agentúra + Archív
    let whereCondition: any = {
        agencyId: session.agencyId,
        archivedAt: showArchived ? { not: null } : null
    }

    // Ak je kreatívec, vidí len tých, kde má priradenú prácu
    if (session.role === 'CREATIVE') {
        whereCondition.campaigns = {
            some: {
                jobs: {
                    some: {
                        assignments: {
                            some: {
                                userId: session.userId
                            }
                        }
                    }
                }
            }
        }
    }

    const clients = await prisma.client.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { campaigns: true }
        }
      }
    })
    
    console.log(`Found ${clients.length} clients`)
    return NextResponse.json(clients)
  } catch (error) {
    console.error("CLIENTS_GET_ERROR:", error)
    return NextResponse.json({ error: 'Error fetching clients' }, { status: 500 })
  }
}

export async function POST(request: Request) {
    const session = getSession()
    if (!session || (session.role === 'CREATIVE')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    try {
        const body = await request.json()
        const { name, priority, scope } = body 
    
        if (!name) return NextResponse.json({ error: 'Chýba názov' }, { status: 400 })
    
        const agency = await prisma.agency.findUnique({ where: { id: session.agencyId } })
        if (!agency) return NextResponse.json({ error: 'Agentúra nenájdená' }, { status: 500 })
    
        if (Array.isArray(scope)) {
            for (const item of scope) {
                if (!item || item.trim() === "") continue;
                const exists = await prisma.agencyScope.findFirst({
                    where: { agencyId: session.agencyId, name: item.trim() }
                })
                if (!exists) {
                    await prisma.agencyScope.create({
                        data: { agencyId: session.agencyId, name: item.trim() }
                    })
                }
            }
        }
    
        const scopeString = Array.isArray(scope) ? scope.join(', ') : (scope || "")
    
        const client = await prisma.client.create({
            data: {
                name,
                priority: parseInt(priority || '3'),
                scope: scopeString,
                agencyId: session.agencyId
            }
        })
    
        return NextResponse.json(client)
    } catch (error) {
        return NextResponse.json({ error: 'Error creating client' }, { status: 500 })
    }
}