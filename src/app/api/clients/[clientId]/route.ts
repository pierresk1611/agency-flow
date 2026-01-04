import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
    request: Request,
    { params }: { params: { clientId: string } }
) {
    try {
        const session = await getSession()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { clientId } = params
        const body = await request.json()
        const { name, priority, scope, defaultAssigneeIds } = body

        // Validate ownership
        const existing = await prisma.client.findUnique({
            where: { id: clientId }
        })

        if (!existing || existing.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        const updatedClient = await prisma.client.update({
            where: { id: clientId },
            data: {
                name,
                priority: parseInt(priority),
                scope: Array.isArray(scope) ? scope.join(', ') : scope,
                defaultAssignees: {
                    set: defaultAssigneeIds ? defaultAssigneeIds.map((id: string) => ({ id })) : undefined
                }
            }
        })

        return NextResponse.json(updatedClient)
    } catch (error) {
        console.error('CLIENT_PATCH_ERROR:', error)
        return NextResponse.json(
            { error: 'Error updating client' },
            { status: 500 }
        )
    }
}
