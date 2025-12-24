import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session' // <--- NOVÝ IMPORT

export async function GET() {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // IZOLÁCIA: Hľadáme klientov LEN pre túto agentúru
  const clients = await prisma.client.findMany({
    where: { 
        agencyId: session.agencyId, // <--- TOTO JE KĽÚČOVÉ
        archivedAt: null 
    },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { campaigns: true } } }
  })
  
  return NextResponse.json(clients)
}

export async function POST(request: Request) {
  const session = getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, priority, scope } = body 

  if (!name) return NextResponse.json({ error: 'Chýba názov' }, { status: 400 })

  // IZOLÁCIA: Scopes hľadáme/vytvárame len v tejto agentúre
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

  // IZOLÁCIA: Klienta vytvoríme s ID agentúry z tokenu
  const client = await prisma.client.create({
      data: {
          name,
          priority: parseInt(priority || '3'),
          scope: scopeString,
          agencyId: session.agencyId // <--- ŽIADNE findFirst(), ale tvrdé ID
      }
  })

  return NextResponse.json(client)
}