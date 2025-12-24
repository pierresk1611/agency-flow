import { PrismaClient, Role, JobStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. Pôvodná agentúra (aby sme ju nezmazali)
  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: {},
    create: { id: 'seed-agency-id', name: 'Super Creative Agency' }
  })

  // Traffic user
  await prisma.user.upsert({
    where: { email: 'traffic@agency.com' },
    update: {},
    create: { email: 'traffic@agency.com', role: Role.TRAFFIC, agencyId: agency.id, passwordHash, active: true }
  })

  // 2. SUPERADMIN (SaaS Majiteľ)
  const saasAgency = await prisma.agency.upsert({
    where: { id: 'saas-system' },
    update: {},
    create: { id: 'saas-system', name: 'AgencyFlow System' }
  })

  await prisma.user.upsert({
    where: { email: 'super@agencyflow.com' },
    update: {},
    create: {
      email: 'super@agencyflow.com',
      role: Role.SUPERADMIN,
      agencyId: saasAgency.id,
      passwordHash,
      name: 'Super Admin',
      active: true
    }
  })

  console.log('Seed finished. Superadmin: super@agencyflow.com')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })