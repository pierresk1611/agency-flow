import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(
    request: Request,
    { params }: { params: { agencyId: string } }
) {
    const session = await getSession()
    if (session?.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const agency = await prisma.agency.findUnique({
            where: { id: params.agencyId },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        })

        if (!agency) {
            return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
        }

        return NextResponse.json(agency)
    } catch (error) {
        console.error('Agency GET Error:', error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
