import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(
    request: Request,
    { params }: { params: { tenderId: string } }
) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const { userId, role } = await request.json()

        // 1. Verify Tender belongs to agency
        const tender = await prisma.tender.findUnique({ where: { id: params.tenderId } })
        if (!tender || tender.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Tender not found or access denied' }, { status: 404 })
        }

        // 2. Verify User exists and belongs to same agency
        const user = await prisma.user.findUnique({ where: { id: userId, agencyId: session.agencyId } })
        if (!user) return NextResponse.json({ error: 'User not found in your agency' }, { status: 404 })

        const assignment = await prisma.tenderAssignment.create({
            data: {
                tenderId: params.tenderId,
                userId,
                roleOnJob: role
            },
            include: { user: true }
        })

        return NextResponse.json(assignment)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { tenderId: string } }
) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    try {
        const assignment = await prisma.tenderAssignment.findUnique({
            where: { id },
            include: { tender: true }
        })

        if (!assignment || assignment.tender.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 })
        }

        await prisma.tenderAssignment.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
