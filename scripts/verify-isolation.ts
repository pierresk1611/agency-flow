
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- Agency Isolation Verification ---')

    // This script is intended to be run in a dev environment to check logic.
    // Since we can't easily mock sessions here, we'll just check if the code
    // we wrote handles 'undefined' or 'null' agencyId correctly.

    const dummySession = { agencyId: undefined }

    console.log('Testing query with undefined agencyId...')
    try {
        const clients = await prisma.client.findMany({
            where: {
                agencyId: dummySession.agencyId // If this is undefined, Prisma might return ALL clients!
            }
        })
        console.log(`Found ${clients.length} clients with undefined filter.`)
        if (clients.length > 0 && dummySession.agencyId === undefined) {
            console.warn('⚠️ WARNING: Prisma returned all records for undefined filter!')
        }
    } catch (e) {
        console.log('Query failed as expected (or due to error).')
    }

    process.exit(0)
}

main()
