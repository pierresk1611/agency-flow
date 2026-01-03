import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { startOfWeek, subDays } from 'date-fns'
import { createNotification } from '@/lib/notifications'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // "Past" means strictly before the current week started?
        // User logic: "On Sunday... auto submit previous".
        // If today is Sunday, and week starts Monday, "Current Week" is ending.
        // However, to be safe, we will submit any entries OLDER than the start of THIS week.
        // If today is Monday 15th, Start is Mon 15th. We submit everything < 15th.
        // If today is Sunday 14th, Start is Mon 8th. We submit everything < 8th.
        // This implies on Sunday we submit the week BEFORE current week? 
        // Maybe user treats Sunday as start of next week.
        // Let's use a dynamic logic:
        // We submit entries where 'date' < Today (or start of today).
        // Or simpler: Submit everything that is PENDING and in the PAST.

        // Let's go with "Submit everything up to start of this week" to be safe batches.
        const today = new Date()
        const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })

        // Find unsubmitted entries before this week
        const where = {
            userId: session.userId,
            isDone: false,
            date: {
                lt: currentWeekStart
            }
        }

        const unsubmitted = await prisma.plannerEntry.findMany({ where })

        if (unsubmitted.length === 0) {
            return NextResponse.json({ success: true, count: 0 })
        }

        // Update them
        const updated = await prisma.plannerEntry.updateMany({
            where,
            data: { isDone: true }
        })

        // Notify
        if (updated.count > 0) {
            await createNotification(
                session.userId,
                "Plán automaticky odoslaný",
                `Váš plán za minulé obdobie (${updated.count} položiek) bol automaticky odoslaný/uzavretý.`,
                '/planner'
            )
        }

        return NextResponse.json({ success: true, count: updated.count })

    } catch (error: any) {
        console.error("AUTO-SUBMIT ERROR:", error)
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
    }
}
