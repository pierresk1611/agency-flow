import { PrismaClient, Role, JobStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- ŠTART MASTER SEEDU ---')
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. SUPERADMIN
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

  await prisma.user.upsert({
    where: { email: 'super@agencyflow.com' },
    update: { passwordHash, agencyId: saasAgency.id },
    create: {
      email: 'super@agencyflow.com',
      name: 'Marek Superadmin',
      role: Role.SUPERADMIN,
      agencyId: saasAgency.id,
      passwordHash,
      active: true
    }
  })
  console.log('✅ Superadmin: super@agencyflow.com')

  // 2. KLIENSKÁ AGENTÚRA
  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: { slug: 'super-creative' },
    create: { 
      id: 'seed-agency-id', name: 'Super Creative Agency', slug: 'super-creative',
      companyId: '12345678', vatId: 'SK2020202020', address: 'Mýtna 1, Bratislava', email: 'hello@supercreative.sk'
    }
  })

  // 3. TÍM (Traffic, Account, Creative...)
  const usersData = [
    { email: 'traffic@agency.com', name: 'Peter Traffic', role: Role.TRAFFIC, hourly: 0, cost: 0 },
    { email: 'account@agency.com', name: 'Lucka Account', role: Role.ACCOUNT, hourly: 0, cost: 0 },
    { email: 'creative@agency.com', name: 'Jozef Dizajnér', role: Role.CREATIVE, hourly: 50, cost: 30 },
    { email: 'copy@agency.com', name: 'Milan Copywriter', role: Role.CREATIVE, hourly: 45, cost: 25 },
  ]

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { agencyId: agency.id, passwordHash, role: u.role as Role },
      create: { 
        email: u.email, name: u.name, role: u.role as Role, 
        agencyId: agency.id, passwordHash, active: true,
        hourlyRate: u.hourly, costRate: u.cost
      }
    })
  }
  
  const creatives = await prisma.user.findMany({ where: { role: Role.CREATIVE, agencyId: agency.id } })

  // 4. ČÍSELNÍKY
  const defaultScopes = ["ATL", "BTL", "DIGITAL", "SOCIAL MEDIA", "PR", "BRANDING"]
  for (const s of defaultScopes) {
    await prisma.agencyScope.upsert({ where: { agencyId_name: { agencyId: agency.id, name: s } }, update: {}, create: { agencyId: agency.id, name: s } })
  }
  const defaultPositions = ["Art Director", "Copywriter", "Account Manager", "Developer", "Project Manager"]
  for (const p of defaultPositions) {
    await prisma.agencyPosition.upsert({ where: { agencyId_name: { agencyId: agency.id, name: p } }, update: {}, create: { agencyId: agency.id, name: p } })
  }

  // 5. DATA (Klienti, Joby)
  const clients = ['TechCorp s.r.o.', 'Audi Slovakia']
  for (const name of clients) {
    const c = await prisma.client.upsert({
      where: { agencyId_name: { agencyId: agency.id, name } },
      update: {},
      create: { name, priority: 5, agencyId: agency.id, scope: 'Digital' }
    })
    const camp = await prisma.campaign.create({ data: { name: `Kampaň ${name} 2025`, clientId: c.id } })
    await prisma.job.create({
        data: {
            title: `Job pre ${name}`,
            campaignId: camp.id,
            status: JobStatus.IN_PROGRESS,
            deadline: new Date(),
            budget: 1500.0,
            assignments: { create: { userId: creatives[0].id, roleOnJob: 'Lead' } }
        }
    })
  }

  // 6. TENDER
  await prisma.tender.create({
    data: {
        title: "Veľký Tender: Telekomunikácie",
        status: JobStatus.TODO,
        deadline: new Date('2025-05-01'),
        budget: 5000.0,
        agencyId: agency.id,
        isConverted: false
    }
  })

  console.log('--- SEED HOTOVÝ ---')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())