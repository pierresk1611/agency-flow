import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- ŠTART BEZPEČNÉHO FIXER SEEDU ---')
  const passwordHash = await bcrypt.hash('password123', 10)

  // 1. ZOZNAM POZÍCIÍ (Tvoj kompletný zoznam)
  const defaultPositions = [
    "Managing Director / CEO", "Executive Director", "Operations Director", "Finance Director / CFO",
    "Account Executive", "Account Manager", "Senior Account Manager", "Account Director", "Group Account Director",
    "Traffic Manager", "Project Manager", "Strategic Planner", "Digital Strategist", "Media Strategist", "Brand Strategist",
    "Creative Director (CD)", "Associate Creative Director (ACD)", "Art Director (AD)", "Copywriter", "Graphic Designer", "Motion Designer", "Content Creator",
    "PPC Specialist", "Performance Marketing Manager", "Media Buyer", "SEO Specialist", "Social Media Manager", "Community Manager", "CRM Specialist", "Data Specialist",
    "Producer", "Digital Producer", "Frontend Developer", "Backend Developer", "Full-stack Developer", "UX Designer", "UI Designer", "QA / Tester", "Tech Lead",
    "HR Manager", "Office Manager", "IT Support"
  ]

  // 2. NÁJDEME VŠETKY AGENTÚRY V SYSTÉME (Vrátane tvojich testerov)
  const allAgencies = await prisma.agency.findMany()
  console.log(`Nájdených agentúr: ${allAgencies.length}`)

  // 3. PRE KAŽDÚ AGENTÚRU DOPLNÍME CHÝBAJÚCE POZÍCIE
  for (const agency of allAgencies) {
    console.log(`Dopĺňam pozície pre: ${agency.name}...`)
    
    for (const posName of defaultPositions) {
      await prisma.agencyPosition.upsert({
        where: { 
          agencyId_name: { 
            agencyId: agency.id, 
            name: posName 
          } 
        },
        update: {}, // Ak pozícia už existuje, neurob nič
        create: { 
          agencyId: agency.id, 
          name: posName 
        }
      })
    }
  }

  // 4. ZABEZPEČÍME EXISTENCIU SUPERADMINA (Nezmaže ho, ak existuje)
  await prisma.user.upsert({
    where: { email: 'super@agencyflow.com' },
    update: {},
    create: {
      email: 'super@agencyflow.com',
      name: 'Marek Superadmin',
      role: Role.SUPERADMIN,
      passwordHash,
      active: true
    }
  })

  console.log('--- VŠETKY DÁTA SÚ ZOSYNCHRONIZOVANÉ A BEZPEČNÉ ---')
}

main()
  .catch((e) => {
    console.error('❌ Chyba:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })