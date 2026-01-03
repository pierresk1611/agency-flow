import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Povolené role pre vytváranie kampaní (projektov)
    const allowedRoles = ['ADMIN', 'TRAFFIC', 'SUPERADMIN', 'ACCOUNT']
    if (!allowedRoles.includes(session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { name, clientId } = body

        if (!name || !clientId) {
            return NextResponse.json({ error: 'Missing name or clientId' }, { status: 400 })
        }

        // Check access to client (agency check)
        const client = await prisma.client.findUnique({ where: { id: clientId } })
        if (!client || client.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Client not found or access denied' }, { status: 404 })
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                clientId
            }
        })

        return NextResponse.json(campaign)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
