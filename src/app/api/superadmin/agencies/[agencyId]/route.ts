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
export async function DELETE(
    request: Request,
    { params }: { params: { agencyId: string } }
) {
    const session = await getSession()
    if (session?.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const agencyId = params.agencyId

        await prisma.$transaction(async (tx) => {
            // 1. Get all clients, campaigns, jobs, users to identify what to delete
            const users = await tx.user.findMany({ where: { agencyId } })
            const userIds = users.map(u => u.id)
            const clients = await tx.client.findMany({ where: { agencyId } })
            const clientIds = clients.map(c => c.id)
            const tenders = await tx.tender.findMany({ where: { agencyId } })
            const tenderIds = tenders.map(t => t.id)

            const campaigns = await tx.campaign.findMany({ where: { clientId: { in: clientIds } } })
            const campaignIds = campaigns.map(c => c.id)
            const jobs = await tx.job.findMany({ where: { campaignId: { in: campaignIds } } })
            const jobIds = jobs.map(j => j.id)

            const assignments = await tx.jobAssignment.findMany({ where: { jobId: { in: jobIds } } })
            const assignmentIds = assignments.map(a => a.id)

            // 2. Cascade delete deep entities first
            await tx.budgetItem.deleteMany({ where: { jobId: { in: jobIds } } })
            await tx.timesheet.deleteMany({ where: { jobAssignmentId: { in: assignmentIds } } })
            await tx.reassignmentRequest.deleteMany({ where: { assignmentId: { in: assignmentIds } } })
            await tx.tenderAssignment.deleteMany({ where: { tenderId: { in: tenderIds } } })

            await tx.comment.deleteMany({ where: { jobId: { in: jobIds } } })
            await tx.comment.deleteMany({ where: { tenderId: { in: tenderIds } } })
            await tx.comment.deleteMany({ where: { userId: { in: userIds } } })

            await tx.file.deleteMany({ where: { jobId: { in: jobIds } } })
            await tx.file.deleteMany({ where: { clientId: { in: clientIds } } })
            await tx.file.deleteMany({ where: { tenderId: { in: tenderIds } } })

            await tx.plannerEntry.deleteMany({ where: { userId: { in: userIds } } })
            await tx.notification.deleteMany({ where: { userId: { in: userIds } } })

            await tx.jobAssignment.deleteMany({ where: { jobId: { in: jobIds } } })
            await tx.job.deleteMany({ where: { campaignId: { in: campaignIds } } })
            await tx.campaign.deleteMany({ where: { clientId: { in: clientIds } } })

            await tx.contactPerson.deleteMany({ where: { clientId: { in: clientIds } } })
            await tx.clientNote.deleteMany({ where: { clientId: { in: clientIds } } })
            await tx.client.deleteMany({ where: { agencyId } })

            await tx.tender.deleteMany({ where: { agencyId } })
            await tx.agencyScope.deleteMany({ where: { agencyId } })
            await tx.agencyPosition.deleteMany({ where: { agencyId } })

            // 3. Delete users (except the superadmin performing the deletion if they happened to belong to it, unlikely but safe)
            await tx.user.deleteMany({ where: { agencyId } })

            // 4. Finally delete the agency
            await tx.agency.delete({ where: { id: agencyId } })
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Agency DELETE Error:', error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
