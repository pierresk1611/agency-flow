import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

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
        const newAgency = await tx.agency.create({
            data: { name }
        })

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

        const defaultScopes = ["ATL", "BTL", "DIGITAL", "SOCIAL MEDIA", "PRODUCTION", "PR", "BRANDING", "EVENT"]
        for (const s of defaultScopes) {
            await tx.agencyScope.create({ data: { agencyId: newAgency.id, name: s } })
        }
        
        const defaultPos = ["Art Director", "Copywriter", "Account Manager", "Social Media Manager", "Developer", "Project Manager"]
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