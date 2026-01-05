import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
    request: Request,
    { params }: { params: { tenderId: string } }
) {
    try {
        /* 1️⃣ AUTH */
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        /* 2️⃣ ROLE CHECK */
        const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
        if (!allowedRoles.includes(session.role) && !session.godMode) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        /* 3️⃣ BODY */
        const body = await request.json()
        const { title, description, budget, deadline, status } = body

        /* 4️⃣ LOAD TENDER + TENANT CHECK */
        const tender = await prisma.tender.findUnique({
            where: { id: params.tenderId },
        })

        if (!tender) {
            return NextResponse.json({ error: 'Tender not found' }, { status: 404 })
        }

        if (tender.agencyId !== session.agencyId && session.role !== 'SUPERADMIN' && !session.godMode) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        /* 5️⃣ UPDATE */
        const updatedTender = await prisma.tender.update({
            where: { id: params.tenderId },
            data: {
                title: title !== undefined ? title : undefined,
                description: description !== undefined ? description : undefined,
                budget: budget !== undefined ? parseFloat(budget) : undefined,
                deadline: deadline !== undefined ? new Date(deadline) : undefined,
                status: status !== undefined ? status : undefined,
            },
        })

        return NextResponse.json(updatedTender)
    } catch (error: any) {
        console.error('TENDER UPDATE ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
