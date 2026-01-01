import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: Request) {
    try {
        const session = await getSession()
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Zistime agentúru a koho notifikovať
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            include: { agency: true }
        })

        if (!user || !user.agency || !user.agencyId) return NextResponse.json({ error: 'User/Agency not found' }, { status: 404 })

        // LOGIKA SCHVAĽOVANIA INTERNÝCH PRÁC (nastavená v AgencySettings)
        // 1. Ak je nastavený "internalAccount", notifikujeme JEHO.
        // 2. Ak NIE JE nastavený, notifikujeme TRAFFIC manažérov.

        const internalAccountId = user.agency.internalAccountId
        let title = 'Plán na schválenie'
        let message = `${user.name || 'Užívateľ'} odoslal svoj týždenný plán na kontrolu.`
        let targetUserIds: string[] = []

        if (internalAccountId) {
            // A. Cielené schvaľovanie (Account)
            targetUserIds = [internalAccountId]
            message += " (Interné schválenie)"
        } else {
            // B. Default Fallback (Traffic)
            const trafficManagers = await prisma.user.findMany({
                where: {
                    agencyId: user.agencyId,
                    role: { in: ['TRAFFIC', 'ADMIN', 'SUPERADMIN'] }, // Default Traffic + Admin fallback
                    active: true
                },
                select: { id: true }
            })
            targetUserIds = trafficManagers.map(m => m.id)
        }

        if (targetUserIds.length > 0) {
            await prisma.notification.createMany({
                data: targetUserIds.map(userId => ({
                    userId,
                    title,
                    message,
                    link: `/planner`
                }))
            })
        }

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error("PLANNER SUBMIT ERROR:", error)
        return NextResponse.json({ error: error.message || 'Server Error' }, { status: 500 })
    }
}
