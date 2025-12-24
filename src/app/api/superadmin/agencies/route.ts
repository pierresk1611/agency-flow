import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// Pomocná funkcia na vytvorenie slugu (URL adresy) z názvu
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD') // Odstráni mäkčene a dĺžne
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w ]+/g, '') // Odstráni špeciálne znaky
    .replace(/ +/g, '-') // Nahradí medzery pomlčkami
    .trim()
}

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

// POST: Vytvorenie novej agentúry + Admina + Slug
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

    // Vygenerujeme unikátny slug
    const slug = generateSlug(name)

    // Skontrolujeme, či slug už neexistuje
    const existingAgency = await prisma.agency.findUnique({ where: { slug } })
    if (existingAgency) {
        return NextResponse.json({ error: 'Agentúra s podobným názvom už existuje. Zmeňte názov.' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
        // 1. Vytvorenie Agentúry so SLUGOM
        const newAgency = await tx.agency.create({
            data: { 
                name,
                slug: slug // <--- TOTO TU CHÝBALO
            }
        })

        // 2. Vytvorenie Admina
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

        // 3. Základné číselníky pre novú agentúru
        const defaultScopes = ["ATL", "BTL", "DIGITAL", "PR", "SOCIAL MEDIA"]
        for (const s of defaultScopes) {
            await tx.agencyScope.create({ data: { agencyId: newAgency.id, name: s } })
        }
        
        const defaultPos = ["Account Manager", "Art Director", "Copywriter", "Creative Director"]
        for (const p of defaultPos) {
            await tx.agencyPosition.create({ data: { agencyId: newAgency.id, name: p } })
        }

        return newAgency
    })

    return NextResponse.json(result)

  } catch (error: any) {
    console.error("Superadmin POST error:", error)
    return NextResponse.json({ error: error.message || 'Chyba pri vytváraní agentúry' }, { status: 500 })
  }
}