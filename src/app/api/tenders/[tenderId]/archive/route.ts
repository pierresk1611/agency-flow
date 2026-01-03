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
        const updated = await prisma.tender.update({
            where: { id: params.tenderId },
            data: { status: 'DONE' }
        })
        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
