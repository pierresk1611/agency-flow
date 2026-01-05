import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
    request: Request,
    { params }: { params: { tenderId: string } }
) {
    const session = await getSession()
    const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']

    if (!session || !allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    try {
        const tender = await prisma.tender.findUnique({ where: { id: params.tenderId } })
        if (!tender || (tender.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
            return NextResponse.json({ error: 'Tender not found or access denied' }, { status: 404 })
        }

        // Restore to IN_PROGRESS and remove converted flag if present
        const updated = await prisma.tender.update({
            where: { id: params.tenderId },
            data: {
                status: 'IN_PROGRESS',
                isConverted: false
            }
        })
        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
