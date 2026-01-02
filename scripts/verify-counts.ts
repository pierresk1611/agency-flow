
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verify() {
    const agency = await prisma.agency.findUnique({ where: { slug: 'agencyflow-hq' } })
    if (!agency) {
        console.error('Agency not found!')
        return
    }

    const clientsCount = await prisma.client.count({ where: { agencyId: agency.id } })
    const teamCount = await prisma.user.count({ where: { agencyId: agency.id } })
    const campaignCount = await prisma.campaign.count({ where: { client: { agencyId: agency.id } } })
    const jobCount = await prisma.job.count({ where: { campaign: { client: { agencyId: agency.id } } } })
    const timesheetCount = await prisma.timesheet.count({ where: { jobAssignment: { job: { campaign: { client: { agencyId: agency.id } } } } } })
    const plannerCount = await prisma.plannerEntry.count({ where: { user: { agencyId: agency.id } } })
    const tenderCount = await prisma.tender.count({ where: { agencyId: agency.id } })

    console.log(`Clients: ${clientsCount}`)
    console.log(`Team: ${teamCount}`) // Includes superadmin + 5 new members = 6
    console.log(`Campaigns: ${campaignCount}`)
    console.log(`Jobs: ${jobCount}`)
    console.log(`Timesheets: ${timesheetCount}`)
    console.log(`Planner Entries: ${plannerCount}`)
    console.log(`Tenders: ${tenderCount}`)
}

verify().catch(console.error).finally(() => prisma.$disconnect())
