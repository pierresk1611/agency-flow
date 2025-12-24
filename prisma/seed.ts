import { PrismaClient, Role, JobStatus } from '@prisma/client'
import bcrypt from 'bcryptjs' // <--- ZMENA: Import upravený pre kompatibilitu

const prisma = new PrismaClient()

async function main() {
  console.log('--- ŠTART SEEDOVANIA DATABÁZY ---')
  
  // Jednotné heslo pre všetky testovacie účty
  const passwordHash = await bcrypt.hash('password123', 10)

  // ==========================================
  // 1. SUPERADMIN (Majiteľ platformy)
  // ==========================================
  const saasAgency = await prisma.agency.upsert({
    where: { id: 'saas-system-id' },
    update: {},
    create: { 
      id: 'saas-system-id', 
      name: 'AgencyFlow HQ',
      slug: 'admin',
      email: 'support@agencyflow.com'
    }
  })

  await prisma.user.upsert({
    where: { email: 'super@agencyflow.com' },
    update: { passwordHash },
    create: {
      email: 'super@agencyflow.com',
      name: 'Marek Superadmin',
      role: Role.SUPERADMIN,
      agencyId: saasAgency.id,
      passwordHash,
      active: true
    }
  })
  console.log('✅ Superadmin vytvorený: super@agencyflow.com')


  // ==========================================
  // 2. HLAVNÁ TESTOVACIA AGENTÚRA
  // ==========================================
  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: { slug: 'super-creative' },
    create: { 
      id: 'seed-agency-id', 
      name: 'Super Creative Agency',
      slug: 'super-creative',
      companyId: '12345678',
      vatId: 'SK2020202020',
      address: 'Mýtna 1, Bratislava',
      email: 'hello@supercreative.sk'
    }
  })
  console.log(`✅ Agentúra vytvorená: ${agency.name} (/${agency.slug})`)


  // ==========================================
  // 3. UŽÍVATELIA AGENTÚRY (ROLY)
  // ==========================================
  
  // TRAFFIC / ADMIN (Vidí všetko, riadi budgety aj ľudí)
  await prisma.user.upsert({
    where: { email: 'traffic@agency.com' },
    update: { role: Role.TRAFFIC, passwordHash },
    create: {
      email: 'traffic@agency.com',
      name: 'Peter Traffic',
      position: 'Resource Manager',
      role: Role.TRAFFIC,
      agencyId: agency.id,
      passwordHash,
      active: true
    }
  })

  // ACCOUNT (Schvaľuje prácu, vidí budgety)
  await prisma.user.upsert({
    where: { email: 'account@agency.com' },
    update: { role: Role.ACCOUNT, passwordHash },
    create: {
      email: 'account@agency.com',
      name: 'Lucka Account',
      position: 'Account Manager',
      role: Role.ACCOUNT,
      agencyId: agency.id,
      passwordHash,
      active: true
    }
  })

  // CREATIVE (Pracuje, stopuje čas, ale NESMIE vidieť peniaze)
  const creative = await prisma.user.upsert({
    where: { email: 'creative@agency.com' },
    update: { role: Role.CREATIVE, passwordHash },
    create: {
      email: 'creative@agency.com',
      name: 'Jozef Kreatívec',
      position: 'Art Director',
      role: Role.CREATIVE,
      agencyId: agency.id,
      passwordHash,
      hourlyRate: 50.0, 
      costRate: 30.0,   
      active: true
    }
  })
  console.log('✅ Užívatelia (Traffic, Account, Creative) vytvorení.')


  // ==========================================
  // 4. ČÍSELNÍKY (Scopes & Positions)
  // ==========================================
  const defaultScopes = ["ATL", "BTL", "DIGITAL", "SOCIAL MEDIA", "PR", "BRANDING", "WEB DEV"]
  for (const s of defaultScopes) {
    await prisma.agencyScope.upsert({
      where: { agencyId_name: { agencyId: agency.id, name: s } },
      update: {},
      create: { agencyId: agency.id, name: s }
    })
  }

  const defaultPositions = ["Art Director", "Copywriter", "Account Manager", "Developer", "Project Manager"]
  for (const p of defaultPositions) {
    await prisma.agencyPosition.upsert({
      where: { agencyId_name: { agencyId: agency.id, name: p } },
      update: {},
      create: { agencyId: agency.id, name: p }
    })
  }
  console.log('✅ Číselníky naplnené.')


  // ==========================================
  // 5. TESTOVACÍ KLIENT, KAMPAŇ A JOB (S budgetom)
  // ==========================================
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
      title: 'Redizajn Identity a Webu',
      campaignId: campaign.id,
      status: JobStatus.IN_PROGRESS,
      deadline: new Date('2025-06-30'),
      budget: 5000.0, 
      assignments: {
        create: {
          userId: creative.id,
          roleOnJob: 'Lead Designer'
        }
      }
    }
  })

  console.log('--- SEEDOVANIE ÚSPEŠNE DOKONČENÉ ---')
  console.log('Loginy (Heslo: password123):')
  console.log('1. Superadmin: super@agencyflow.com')
  console.log('2. Traffic: traffic@agency.com')
  console.log('3. Account: account@agency.com')
  console.log('4. Creative: creative@agency.com')
}

main()
  .catch((e) => {
    console.error('❌ Chyba pri seedovaní:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })