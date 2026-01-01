import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import { sendDynamicEmail } from '@/lib/email'

export async function POST(req: Request, { params }: { params: { agencyId: string } }) {
    const session = await getSession()
    if (!session || session.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const agency = await prisma.agency.findUnique({ where: { id: params.agencyId } })
        if (!agency || !agency.contactName) {
            // Need contact info
            return NextResponse.json({ error: 'Agency missing contact info' }, { status: 404 })
        }

        // Attempt to find admin user email if agency email is generic
        const adminUser = await prisma.user.findFirst({
            where: { agencyId: agency.id, role: 'ADMIN' }
        })
        const emailTo = adminUser?.email || agency.email

        if (!emailTo) {
            return NextResponse.json({ error: 'No email found for agency' }, { status: 400 })
        }

        // Placeholder link - will be configurable later
        const STRIPE_LINK = "https://billing.stripe.com/p/login/test_..."

        await sendDynamicEmail('SUBSCRIPTION_PAYMENT', emailTo, {
            paymentLink: STRIPE_LINK
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Send payment email error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
