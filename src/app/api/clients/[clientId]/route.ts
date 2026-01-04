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
        const { name, priority, scope, defaultAssigneeIds, companyId, vatId, billingAddress, importantNote } = body

        // Validate ownership
        const existing = await prisma.client.findUnique({
            where: { id: clientId }
        })

        if (!existing || existing.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (priority !== undefined) updateData.priority = parseInt(priority)
        if (scope !== undefined) updateData.scope = Array.isArray(scope) ? scope.join(', ') : scope
        if (companyId !== undefined) updateData.companyId = companyId
        if (vatId !== undefined) updateData.vatId = vatId
        if (billingAddress !== undefined) updateData.billingAddress = billingAddress
        if (importantNote !== undefined) updateData.importantNote = importantNote

        if (defaultAssigneeIds !== undefined) {
            updateData.defaultAssignees = {
                set: defaultAssigneeIds.map((id: string) => ({ id }))
            }
        }

        const updatedClient = await prisma.client.update({
            where: { id: clientId },
            data: updateData
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
