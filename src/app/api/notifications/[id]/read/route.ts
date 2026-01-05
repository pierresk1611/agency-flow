import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getSession()
        if (!session || !session.userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const notification = await prisma.notification.findUnique({
            where: { id: params.id }
        })

        if (!notification || notification.userId !== session.userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        await prisma.notification.update({
            where: { id: params.id },
            data: { isRead: true }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Notif Read Patch Error:", error)
        return NextResponse.json({ error: 'Server Error' }, { status: 500 })
    }
}
