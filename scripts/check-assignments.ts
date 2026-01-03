
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: { active: true },
        select: {
            email: true,
            name: true,
            assignments: {
                where: {
                    job: {
                        archivedAt: null
                    }
                },
                include: {
                    job: true
                }
            }
        }
    })

    console.log('--- USERS WITH ASSIGNMENTS ---')
    let found = false
    users.forEach(u => {
        if (u.assignments.length > 0) {
            found = true
            console.log(`User: ${u.email} (${u.name})`)
            u.assignments.forEach(a => {
                console.log(`  - Job: ${a.job.title}, Status: ${a.job.status}`)
            })
        }
    })

    if (!found) {
        console.log('No users with active job assignments found.')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
