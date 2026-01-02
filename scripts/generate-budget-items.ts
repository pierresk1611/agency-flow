
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const RATES: Record<string, { hourly: number, cost: number }> = {
    'Account Manager': { hourly: 60, cost: 30 },
    'Art Director': { hourly: 80, cost: 40 },
    'Traffic Manager': { hourly: 50, cost: 25 },
    'CFO': { hourly: 100, cost: 50 },
    'Copywriter': { hourly: 70, cost: 35 },
    // Default fallbacks based on Role
    'ACCOUNT': { hourly: 60, cost: 30 },
    'CREATIVE': { hourly: 70, cost: 35 },
    'TRAFFIC': { hourly: 50, cost: 25 },
    'ADMIN': { hourly: 100, cost: 50 },
    'SUPERADMIN': { hourly: 100, cost: 50 },
}

async function fix() {
    console.log('--- STARTING FINANCIAL REPAIR ---')

    // 1. UPDATE USER RATES
    const users = await prisma.user.findMany()
    console.log(`Checking ${users.length} users for missing rates...`)

    for (const user of users) {
        if (!user.hourlyRate || user.hourlyRate === 0) {
            let rate = RATES[user.position || ''] || RATES[user.role] || { hourly: 50, cost: 25 }

            console.log(`Updating user ${user.email} (${user.position}/${user.role}) -> Rate: ${rate.hourly}€`)

            await prisma.user.update({
                where: { id: user.id },
                data: { hourlyRate: rate.hourly, costRate: rate.cost }
            })
        }
    }

    // 2. BACKFILL BUDGET ITEMS
    console.log('Checking for APPROVED timesheets without budget items...')

    const timesheets = await prisma.timesheet.findMany({
        where: {
            status: 'APPROVED',
            budgetItem: null
        },
        include: {
            jobAssignment: {
                include: {
                    user: true,
                    job: true
                }
            }
        }
    })

    console.log(`Found ${timesheets.length} timesheets to process.`)

    for (const ts of timesheets) {
        const user = ts.jobAssignment.user
        const job = ts.jobAssignment.job
        const hours = (ts.durationMinutes || 0) / 60
        const rate = user.hourlyRate || 50
        const amount = hours * rate

        if (hours > 0) {
            await prisma.budgetItem.create({
                data: {
                    jobId: job.id,
                    timesheetId: ts.id,
                    hours: hours,
                    rate: rate,
                    amount: amount,
                    createdAt: ts.endTime || new Date()
                }
            })
            process.stdout.write('.')
        }
    }

    console.log('\n--- FINANCIAL REPAIR COMPLETED ---')
}

fix().catch(console.error).finally(() => prisma.$disconnect())
