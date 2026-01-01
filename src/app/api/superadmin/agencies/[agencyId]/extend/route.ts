import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import { addDays } from 'date-fns'

export async function POST(req: Request, { params }: { params: { agencyId: string } }) {
    const session = await getSession()
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { days } = await req.json()
        const daysToAdd = parseInt(days)

        if (isNaN(daysToAdd) || daysToAdd <= 0) {
            return NextResponse.json({ error: 'Invalid days' }, { status: 400 })
        }

        const agency = await prisma.agency.findUnique({ where: { id: params.agencyId } })
        if (!agency) {
            return NextResponse.json({ error: 'Agency not found' }, { status: 404 })
        }

        // Default to now if no trial date set, otherwise add to existing date
        const baseDate = agency.trialEndsAt && new Date(agency.trialEndsAt) > new Date()
            ? new Date(agency.trialEndsAt)
            : new Date()

        const newTrialEndsAt = addDays(baseDate, daysToAdd)

        await prisma.agency.update({
            where: { id: params.agencyId },
            data: {
                trialEndsAt: newTrialEndsAt,
                isSuspended: false,      // Unsuspend if suspended
                trialReminderSent: false // Reset reminder so they get it again later
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Extend trial error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
