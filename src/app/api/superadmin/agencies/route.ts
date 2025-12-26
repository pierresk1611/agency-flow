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
    const session = await getSession()
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { users: true, clients: true } } }
    })
    return NextResponse.json(agencies)
  } catch (error: any) {
    console.error("AGENCIES GET ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getSession()
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

    // Skontrolujeme, či už neexistuje používateľ s týmto emailom
    const userExists = await prisma.user.findUnique({ where: { email: adminEmail } })
    if (userExists) {
      return NextResponse.json({ error: `Email ${adminEmail} už existuje.` }, { status: 400 })
    }

    const newAgency = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({ data: { name, slug } })
      const hash = await bcrypt.hash(adminPassword, 10)
      await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash: hash,
          role: 'ADMIN',
          agencyId: agency.id,
          active: true
        }
      })
      return agency
    })

    return NextResponse.json(newAgency)
  } catch (error: any) {
    console.error("AGENCY POST ERROR:", error)
    return NextResponse.json({
      error: "Server Error",
      details: error.message,
      code: error.code || null
    }, { status: 500 })
  }
}
