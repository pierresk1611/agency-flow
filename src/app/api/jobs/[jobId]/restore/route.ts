import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(request: Request, { params }: { params: { jobId: string } }) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Verify ownership
        const job = await prisma.job.findUnique({
            where: { id: params.jobId },
            include: { campaign: { include: { client: true } } }
        })

        if (!job || (job.campaign.client.agencyId !== session.agencyId && session.role !== 'SUPERADMIN')) {
            return NextResponse.json({ error: 'Job not found or access denied' }, { status: 404 })
        }

        await prisma.job.update({
            where: { id: params.jobId },
            data: {
                archivedAt: null,
                status: 'IN_PROGRESS'
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error("RESTORE ERROR:", error)
        return NextResponse.json({ error: 'Failed to restore job' }, { status: 500 })
    }
}
