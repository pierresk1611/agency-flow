import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PATCH(request: Request, { params }: { params: { userId: string } }) {
  try {
    const session = getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { name, position, role, hourlyRate, costRate, active } = body

    // 1. UČIACA SA LOGIKA PRE POZÍCIE
    // Ak 'position' obsahuje nové názvy, uložíme ich do AgencyPosition
    if (typeof position === 'string' && position.length > 0) {
        const posArray = position.split(',').map(p => p.trim())
        for (const pName of posArray) {
            const exists = await prisma.agencyPosition.findFirst({
                where: { agencyId: session.agencyId, name: pName }
            })
            if (!exists) {
                await prisma.agencyPosition.create({
                    data: { agencyId: session.agencyId, name: pName }
                })
            }
        }
    }

    // 2. AKTUALIZÁCIA UŽÍVATEĽA
    const updated = await prisma.user.update({
      where: { id: params.userId },
      data: {
        name,
        position, // Ukladáme ako "Art Director, Copywriter"
        role,
        hourlyRate: parseFloat(hourlyRate || '0'),
        costRate: parseFloat(costRate || '0'),
        active
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("UPDATE ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE ostáva na deaktiváciu
export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
    try {
      await prisma.user.update({ where: { id: params.userId }, data: { active: false } })
      return NextResponse.json({ success: true })
    } catch (e) { return NextResponse.json({ error: 'Delete failed' }, { status: 500 }) }
}