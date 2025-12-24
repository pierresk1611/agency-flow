import { PrismaClient, Role, JobStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Spúšťam seedovanie databázy...')
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. VYTVORENIE SUPERADMINA (SaaS Majiteľ)
  // Táto agentúra je len systémová schránka pre teba
  const saasAgency = await prisma.agency.upsert({
    where: { id: 'saas-system-id' },
    update: {},
    create: { 
      id: 'saas-system-id', 
      name: 'AgencyFlow System',
      slug: 'admin', // Adresa: /admin/dashboard
      email: 'support@agencyflow.com'
    }
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
  console.log('✅ Superadmin vytvorený: super@agencyflow.com')

  // 2. VYTVORENIE PRVEJ KLIENTSKEJ AGENTÚRY
  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: {
      slug: 'super-creative' // Zabezpečíme, aby mala slug aj pri update
    },
    create: { 
      id: 'seed-agency-id', 
      name: 'Super Creative Agency',
      slug: 'super-creative', // Adresa: /super-creative/dashboard
      companyId: '12345678',
      vatId: 'SK2020202020',
      address: 'Mýtna 1, Bratislava',
      email: 'hello@supercreative.sk'
    }
  })
  console.log(`✅ Agentúra vytvorená: ${agency.name} (slug: ${agency.slug})`)

  // 3. UŽÍVATELIA AGENTÚRY
  await prisma.user.upsert({
    where: { email: 'traffic@agency.com' },
    update: {},
    create: {
      email: 'traffic@agency.com',
      name: 'Peter Traffic',
      position: 'Project Manager',
      role: Role.TRAFFIC,
      agencyId: agency.id,
      passwordHash,
      active: true
    }
  })

  const creative = await prisma.user.upsert({
    where: { email: 'creative@agency.com' },
    update: {},
    create: {
      email: 'creative@agency.com',
      name: 'Jozef Dizajnér',
      position: 'Art Director',
      role: Role.CREATIVE,
      agencyId: agency.id,
      passwordHash,
      hourlyRate: 50.0,
      costRate: 30.0,
      active: true
    }
  })

  // 4. ZÁKLADNÉ ČÍSELNÍKY (Scopes & Positions)
  const defaultScopes = ["ATL", "BTL", "DIGITAL", "SOCIAL MEDIA", "PR", "BRANDING"]
  for (const s of defaultScopes) {
    await prisma.agencyScope.upsert({
      where: { agencyId_name: { agencyId: agency.id, name: s } },
      update: {},
      create: { agencyId: agency.id, name: s }
    })
  }

  const defaultPositions = ["Art Director", "Copywriter", "Account Manager", "Developer"]
  for (const p of defaultPositions) {
    await prisma.agencyPosition.upsert({
      where: { agencyId_name: { agencyId: agency.id, name: p } },
      update: {},
      create: { agencyId: agency.id, name: p }
    })
  }
  console.log('✅ Číselníky naplnené.')

  // 5. TESTOVACÍ KLIENT, KAMPAŇ A JOB
  const client = await prisma.client.upsert({
    where: { agencyId_name: { agencyId: agency.id, name: 'TechCorp s.r.o.' } },
    update: {},
    create: { 
        name: 'TechCorp s.r.o.', 
        priority: 5, 
        agencyId: agency.id,
        scope: 'DIGITAL, BRANDING'
    }
  })

  const campaign = await prisma.campaign.upsert({
    where: { id: 'seed-campaign-id' },
    update: {},
    create: { 
      id: 'seed-campaign-id',
      name: 'Launch 2025', 
      clientId: client.id 
    }
  })

  await prisma.job.upsert({
    where: { id: 'seed-job-id' },
    update: {},
    create: {
      id: 'seed-job-id',
      title: 'Redizajn Identity',
      campaignId: campaign.id,
      status: JobStatus.IN_PROGRESS,
      deadline: new Date('2025-06-30'),
      budget: 2500.0,
      assignments: {
        create: {
          userId: creative.id,
          roleOnJob: 'Lead Designer'
        }
      }
    }
  })

  console.log('🚀 Seedovanie úspešne dokončené.')
}

main()
  .catch((e) => {
    console.error('❌ Chyba pri seedovaní:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })