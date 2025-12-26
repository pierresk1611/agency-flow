import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

// GET – zoznam klientov
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) 
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'

    const whereCondition: any = { agencyId: session.agencyId }
    if (showArchived) whereCondition.archivedAt = { not: null }
    else whereCondition.archivedAt = null

    // Kreatívci vidia len klientov, kde majú priradenú prácu
    if (session.role === 'CREATIVE') {
      whereCondition.campaigns = {
        some: {
          jobs: {
            some: { assignments: { some: { userId: session.userId } } }
          }
        }
      }
    }

    const clients = await prisma.client.findMany({
      where: whereCondition,
      orderBy: { name: 'asc' },
      include: { _count: { select: { campaigns: true } } }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error("CLIENTS_GET_ERROR:", error)
    return NextResponse.json({ error: 'Error fetching clients' }, { status: 500 })
  }
}

// POST – pridanie nového klienta
export async function POST(request: Request) {
  const session = await getSession()
  if (!session || session.role === 'CREATIVE') 
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { name, priority, scope } = await request.json()
    if (!name) return NextResponse.json({ error: 'Chýba názov' }, { status: 400 })

    // Ukladáme scope – nové položky pridáme do agencyScope
    let scopeString = ""
    if (Array.isArray(scope)) {
      const cleanedScope = scope.map(s => s.trim()).filter(Boolean)
      for (const item of cleanedScope) {
        const exists = await prisma.agencyScope.findFirst({
          where: { agencyId: session.agencyId, name: item }
        })
        if (!exists) {
          await prisma.agencyScope.create({
            data: { agencyId: session.agencyId, name: item }
          })
        }
      }
      scopeString = cleanedScope.join(', ')
    } else {
      scopeString = scope || ""
    }

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
    console.error("CLIENTS_POST_ERROR:", error)
    return NextResponse.json({ error: 'Error creating client' }, { status: 500 })
  }
}
