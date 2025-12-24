import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

// GET: Zoznam všetkých agentúr
export async function GET() {
  const session = getSession()
  if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          // OPRAVA: Počítame len to, čo je priamo spojené s agentúrou
          select: { 
            users: true, 
            clients: true 
          }
        }
      }
    })
    return NextResponse.json(agencies)
  } catch (error) {
    console.error("Superadmin GET error:", error)
    return NextResponse.json({ error: 'Server Error' }, { status: 500 })
  }
}

// POST: Vytvorenie novej agentúry
export async function POST(request: Request) {
  const session = getSession()
  if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { name, adminEmail, adminPassword } = body

    if (!name || !adminEmail || !adminPassword) {
        return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Agentúra
        const newAgency = await tx.agency.create({
            data: { name }
        })

        // 2. Admin User
        const hash = await bcrypt.hash(adminPassword, 10)
        await tx.user.create({
            data: {
                email: adminEmail,
                passwordHash: hash,
                role: 'ADMIN',
                agencyId: newAgency.id,
                active: true
            }
        })

        // 3. Základné Scopes
        const defaultScopes = ["Digital", "ATL", "BTL", "Social Media", "PR", "Branding"]
        for (const s of defaultScopes) {
            await tx.agencyScope.create({ data: { agencyId: newAgency.id, name: s } })
        }
        
        // 4. Základné Pozície
        const defaultPos = ["Account Manager", "Creative Director", "Copywriter", "Art Director"]
        for (const p of defaultPos) {
            await tx.agencyPosition.create({ data: { agencyId: newAgency.id, name: p } })
        }

        return newAgency
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error("Superadmin POST error:", error)
    return NextResponse.json({ error: 'Chyba pri vytváraní agentúry' }, { status: 500 })
  }
}