import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { assignmentId, targetUserId, reason } = await request.json()

        if (!assignmentId || !targetUserId || !reason) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // 1. Verify Assignment belongs to agency
        const assignment = await prisma.jobAssignment.findUnique({
            where: { id: assignmentId },
            include: { job: { include: { campaign: { include: { client: true } } } } }
        })

        if (!assignment || assignment.job.campaign.client.agencyId !== session.agencyId) {
            return NextResponse.json({ error: 'Assignment not found or access denied' }, { status: 404 })
        }

        // 2. Verify Target User belongs to agency
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId, agencyId: session.agencyId }
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found or access denied' }, { status: 404 })
        }

        // Vytvorenie žiadosti
        const req = await prisma.reassignmentRequest.create({
            data: {
                assignmentId,
                requestByUserId: session.userId,
                targetUserId,
                reason,
                status: 'PENDING'
            },
            include: {
                assignment: { include: { job: { include: { campaign: { include: { client: { include: { agency: true } } } } } } } }
            }
        })

        // NOTIFIKÁCIA PRE TRAFFICA / ADMINA
        const agencyId = req.assignment.job.campaign.client.agencyId
        const agencySlug = req.assignment.job.campaign.client.agency.slug

        // Nájdi Traffic manažérov
        const trafficUsers = await prisma.user.findMany({
            where: { role: 'TRAFFIC', active: true, agencyId }
        })

        // Nájdi Adminov
        const adminUsers = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPERADMIN'] }, active: true, agencyId }
        })

        const recipients = new Set<string>()
        trafficUsers.forEach(u => recipients.add(u.id))
        if (recipients.size === 0) {
            adminUsers.forEach(u => recipients.add(u.id))
        }

        const { createNotification } = await import('@/lib/notifications')
        const title = `Žiadosť o presun: ${req.assignment.job.title}`
        const message = `Kolega žiada o presun úlohy. Dôvod: ${reason}`
        const link = `/${agencySlug}/traffic` // Link do traffic inboxu

        for (const userId of Array.from(recipients)) {
            if (userId !== session.userId) { // Neposielať sebe ak som traffic
                await createNotification(userId, title, message, link)
            }
        }

        return NextResponse.json(req)

    } catch (error: any) {
        console.error("REASSIGN ERROR:", error)
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 })
    }
}
