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
        const { days, plan } = await req.json()

        const updateData: any = {
            isSuspended: false,
            trialReminderSent: false
        }

        if (plan === 'FULL') {
            updateData.subscriptionPlan = 'FULL'
            updateData.trialEndsAt = null
        } else if (days !== undefined) {
            const daysToAdd = parseInt(days)
            if (!isNaN(daysToAdd)) {
                const agency = await prisma.agency.findUnique({ where: { id: params.agencyId } })
                if (!agency) return NextResponse.json({ error: 'Agency not found' }, { status: 404 })

                const baseDate = agency.trialEndsAt && new Date(agency.trialEndsAt) > new Date()
                    ? new Date(agency.trialEndsAt)
                    : new Date()

                updateData.trialEndsAt = addDays(baseDate, daysToAdd)
                updateData.subscriptionPlan = 'TRIAL'
            }
        }

        await prisma.agency.update({
            where: { id: params.agencyId },
            data: updateData
        })

        return NextResponse.json({ success: true, trialEndsAt: updateData.trialEndsAt })
    } catch (error) {
        console.error('Extend trial error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
