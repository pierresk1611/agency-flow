
import { PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
    console.log('Starting backfill of trial dates...')

    const agencies = await prisma.agency.findMany({
        where: {
            trialEndsAt: null
        }
    })

    console.log(`Found ${agencies.length} agencies without trial date.`)

    for (const agency of agencies) {
        const newTrialDate = addDays(new Date(), 14) // Give them 14 days from now

        await prisma.agency.update({
            where: { id: agency.id },
            data: {
                trialEndsAt: newTrialDate,
                trialReminderSent: false,
                isSuspended: false
            }
        })
        console.log(`Updated ${agency.name}: Trial ends ${newTrialDate.toISOString()}`)
    }

    console.log('Done.')
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
