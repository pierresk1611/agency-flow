import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { sendDynamicEmail } from '@/lib/email'

const prisma = new PrismaClient()

export async function GET(request: Request) {
    try {
        console.log('--- STARTING TRIAL CHECK ---')

        // 1. Send Trial Reminders (Day 14 passed)
        const now = new Date()
        const expiringAgencies = await prisma.agency.findMany({
            where: {
                trialEndsAt: { lt: now },           // Trial ended
                trialReminderSent: false,           // Not notified yet
                isSuspended: false                  // Not yet suspended
            },
            include: {
                users: {
                    where: { role: 'ADMIN' },
                    take: 1
                }
            }
        })

        console.log(`Found ${expiringAgencies.length} agencies for reminder.`)

        for (const agency of expiringAgencies) {
            const admin = agency.users[0]
            if (admin) {
                await sendDynamicEmail('TRIAL_REMINDER', admin.email, {
                    agencyName: agency.name,
                    contactName: agency.contactName || admin.name || 'Admin',
                    link: 'https://agency-flow.vercel.app/billing' // TODO: Billing page
                })
                console.log(`Reminder sent to ${agency.name} (${admin.email})`)

                // Mark as sent
                await prisma.agency.update({
                    where: { id: agency.id },
                    data: { trialReminderSent: true }
                })
            }
        }

        // 2. Suspend Accounts (Day 19 passed: Trial + 5 days grace)
        const gracePeriodLimit = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) // 5 days ago

        const suspendableAgencies = await prisma.agency.findMany({
            where: {
                trialEndsAt: { lt: gracePeriodLimit }, // Ended more than 5 days ago
                isSuspended: false
            }
        })

        console.log(`Found ${suspendableAgencies.length} agencies to suspend.`)

        for (const agency of suspendableAgencies) {
            await prisma.agency.update({
                where: { id: agency.id },
                data: {
                    isSuspended: true,
                    status: 'PENDING' // Optional: Revert to pending or keep ACTIVE but suspended? User said "superadmin must approve", implies reverting/blocking. Let's rely on isSuspended.
                }
            })
            console.log(`SUSPENDED Agency: ${agency.name}`)
        }

        return NextResponse.json({
            success: true,
            remindersSent: expiringAgencies.length,
            suspendedCount: suspendableAgencies.length
        })

    } catch (error: any) {
        console.error('CRON ERROR:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
