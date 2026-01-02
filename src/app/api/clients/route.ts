import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'

    const where: any = {
      agencyId: session.agencyId,
      archivedAt: showArchived ? { not: null } : null
    }

    // ✅ KĽÚČOVÁ OPRAVA
    if (session.role === 'CREATIVE') {
      where.AND = [
        {
          campaigns: {
            some: {
              jobs: {
                some: {
                  assignments: {
                    some: { userId: session.userId }
                  }
                }
              }
            }
          }
        }
      ]
    }

    const clients = await prisma.client.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { campaigns: true }
        }
      }
    })

    return NextResponse.json(clients)
  } catch (error) {
    console.error('CLIENTS_GET_ERROR:', error)
    return NextResponse.json(
      { error: 'Error fetching clients' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, priority, scope } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Check availability
    const existing = await prisma.client.findFirst({
      where: { agencyId: session.agencyId, name }
    })

    if (existing) {
      return NextResponse.json({ error: 'Client already exists' }, { status: 409 })
    }

    const client = await prisma.client.create({
      data: {
        agencyId: session.agencyId,
        name,
        priority: parseInt(priority) || 3,
        scope: Array.isArray(scope) ? scope.join(', ') : scope
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('CLIENTS_POST_ERROR:', error)
    return NextResponse.json(
      { error: 'Error creating client' },
      { status: 500 }
    )
  }
}
