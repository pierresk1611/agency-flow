
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- START VERIFICATION ---')

    const testSlug = 'test-agency-' + Date.now()
    const testEmail = 'admin-' + Date.now() + '@test.com'

    // 1. Simulate Registration (Create PENDING)
    console.log('1. Simulating Registration...')
    const agency = await prisma.agency.create({
        data: {
            name: 'Test Agency',
            slug: testSlug,
            status: 'PENDING',
            contactName: 'Test Admin',
        }
    })

    const user = await prisma.user.create({
        data: {
            name: 'Test Admin',
            email: testEmail,
            passwordHash: 'hash',
            role: 'ADMIN',
            active: false,
            agencyId: agency.id
        }
    })

    console.log(`Created Agency: ${agency.name} (${agency.status})`)
    console.log(`Created User: ${user.email} (active: ${user.active})`)

    if (agency.status !== 'PENDING' || user.active !== false) {
        throw new Error('Registration state is incorrect!')
    }

    // 2. Simulate Approval
    console.log('2. Simulating Approval...')
    await prisma.$transaction([
        prisma.agency.update({
            where: { id: agency.id },
            data: { status: 'ACTIVE' }
        }),
        prisma.user.updateMany({
            where: { agencyId: agency.id },
            data: { active: true }
        })
    ])

    // 3. Verify Active State
    const updatedAgency = await prisma.agency.findUnique({ where: { id: agency.id } })
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })

    console.log(`Updated Agency Status: ${updatedAgency?.status}`)
    console.log(`Updated User Active: ${updatedUser?.active}`)

    if (updatedAgency?.status !== 'ACTIVE' || updatedUser?.active !== true) {
        throw new Error('Approval state is incorrect!')
    }

    // 4. Cleanup
    console.log('4. Cleanup...')
    await prisma.user.delete({ where: { id: user.id } })
    await prisma.agency.delete({ where: { id: agency.id } })

    console.log('--- VERIFICATION SUCCESS ---')
}

main().catch(e => {
    console.error(e)
    process.exit(1)
}).finally(() => prisma.$disconnect())
