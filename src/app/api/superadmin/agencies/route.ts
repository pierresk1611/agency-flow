import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import * as bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-')
    .trim()
}

export async function GET() {
  try {
    const session = getSession()
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, clients: true } } }
    })
    return NextResponse.json(agencies)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = getSession()
  if (!session || session.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, adminEmail, adminPassword } = body

    if (!name || !adminEmail || !adminPassword) {
      return NextResponse.json({ error: 'Chýbajú údaje' }, { status: 400 })
    }

    const slug = generateSlug(name)

    // Skontrolujeme email pred spustením transakcie
    const userExists = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (userExists) {
      return NextResponse.json({ error: `Email ${adminEmail} už v systéme existuje.` }, { status: 400 })
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
    // TOTO JE KĽÚČOVÉ: Vrátime presný popis chyby z Vercelu
    console.error("DETAILE CHYBY NA SERVERI:", error)
    return NextResponse.json({ 
      error: "Server Error", 
      details: error.message,
      code: error.code // Napr. P2002 pre duplicity
    }, { status: 500 })
  }
}