
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SCOPES = [
    'Full Service',
    'Design',
    'Development',
    'Social Media',
    'PPC',
    'SEO',
    'Consulting',
    'Branding',
    'Video Production',
    'Copywriting'
]

async function main() {
    console.log('--- FIXING SCOPES ---')

    const agency = await prisma.agency.findFirst()
    if (!agency) {
        console.error('No agency found!')
        return
    }

    console.log(`Agency: ${agency.name}`)

    for (const name of SCOPES) {
        await prisma.agencyScope.upsert({
            where: { agencyId_name: { agencyId: agency.id, name } },
            update: {},
            create: { agencyId: agency.id, name }
        })
        console.log(`  + Scope: ${name}`)
    }

    console.log('--- SCOPES FIXED ---')
}

main().catch(console.error).finally(() => prisma.$disconnect())
