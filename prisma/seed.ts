import { PrismaClient, Role, JobStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- ŠTART SEEDOVANIA (SLUG FIX) ---')
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. SUPERADMIN AGENTÚRA
  const saasAgency = await prisma.agency.upsert({
    where: { id: 'saas-system-id' },
    update: { slug: 'admin' },
    create: { 
      id: 'saas-system-id', 
      name: 'AgencyFlow HQ',
      slug: 'admin',
      email: 'support@agencyflow.com'
    }
  })

  // 2. SUPERADMIN USER
  await prisma.user.upsert({
    where: { email: 'super@agencyflow.com' },
    update: { agencyId: saasAgency.id, passwordHash },
    create: {
      email: 'super@agencyflow.com',
      name: 'Marek Superadmin',
      role: Role.SUPERADMIN,
      agencyId: saasAgency.id,
      passwordHash,
      active: true
    }
  })

  // 3. TESTOVACIA AGENTÚRA
  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: { slug: 'super-creative' },
    create: { 
      id: 'seed-agency-id', 
      name: 'Super Creative Agency',
      slug: 'super-creative',
      email: 'hello@supercreative.sk'
    }
  })

  // 4. TESTOVACÍ UŽÍVATELIA (S natvrdo priradenou agentúrou v update)
  const users = [
    { email: 'traffic@agency.com', name: 'Peter Traffic', role: Role.TRAFFIC },
    { email: 'account@agency.com', name: 'Lucka Account', role: Role.ACCOUNT },
    { email: 'creative@agency.com', name: 'Jozef Kreatívec', role: Role.CREATIVE },
  ]

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { 
        agencyId: agency.id, 
        role: u.role, 
        passwordHash 
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        agencyId: agency.id,
        passwordHash,
        active: true,
        hourlyRate: u.role === 'CREATIVE' ? 50 : 0
      }
    })
  }

  console.log('✅ Seed dokončený úspešne.')
}

main().catch((e) => console.error(e)).finally(async () => await prisma.$disconnect())