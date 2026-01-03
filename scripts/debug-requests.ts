
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const requests = await prisma.reassignmentRequest.findMany({
        include: {
            assignment: {
                include: {
                    job: true,
                    user: true
                }
            },
            requestByUser: true,
            targetUser: true
        }
    })

    console.log("Found requests:", requests.length)
    requests.forEach(r => {
        console.log(`[${r.status}] ID: ${r.id}, AssignID: ${r.assignmentId}, From: ${r.requestByUser.email}, To: ${r.targetUser.email}, Job: ${r.assignment?.job?.title}`)
    })
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
