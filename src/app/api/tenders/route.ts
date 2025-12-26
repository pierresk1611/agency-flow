import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
  request: Request,
  { params }: { params: { tenderId: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Povolené role pre úpravu tendra
    const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { description, title, budget, status } = body

    // Overenie, že tender existuje
    const tender = await prisma.tender.findUnique({ where: { id: params.tenderId } })
    if (!tender) {
      return NextResponse.json({ error: 'Tender nenájdený' }, { status: 404 })
    }

    const updated = await prisma.tender.update({
      where: { id: params.tenderId },
      data: {
        description: description ?? tender.description,
        title: title ?? tender.title,
        status: status ?? tender.status,
        budget: budget !== undefined ? parseFloat(budget) : tender.budget
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("TENDER PATCH ERROR:", error)
    return NextResponse.json({ error: 'Server Error', details: error.message }, { status: 500 })
  }
}
