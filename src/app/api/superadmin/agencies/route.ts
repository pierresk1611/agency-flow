import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Pomocná funkcia na vytvorenie URL slugu
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim()
}

// GET: Zoznam agentúr pre Superadmina
export async function GET() {
  try {
    const session = getSession()
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { users: true, clients: true }
        }
      }
    })
    
    return NextResponse.json(agencies)
  } catch (error: any) {
    console.error("Superadmin GET Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Vytvorenie novej agentúry
export async function POST(request: Request) {
  try {
    const session = getSession()
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, adminEmail, adminPassword } = body

    if (!name || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Chýbajú povinné údaje' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // Overenie unikátnosti slugu
    const existing = await prisma.agency.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Agentúra s týmto názvom už existuje' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const newAgency = await tx.agency.create({
        data: { name, slug }
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

      return newAgency
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Superadmin POST Error:", error)
    return NextResponse.json({ error: 'Chyba pri vytváraní agentúry' }, { status: 500 })
  }
}