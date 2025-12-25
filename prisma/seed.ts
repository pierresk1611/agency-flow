import { PrismaClient, Role, JobStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('--- ŠTART MASTER SEEDU ---')
  const passwordHash = await bcrypt.hash('password123', 10)

  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: { slug: 'super-creative' },
    create: { 
      id: 'seed-agency-id', name: 'Super Creative Agency', slug: 'super-creative',
      companyId: '12345678', vatId: 'SK2020202020', address: 'Mýtna 1, Bratislava', email: 'hello@supercreative.sk'
    }
  })

  // ZÁKLADNÉ POZÍCIE PODĽA ZADANIA
  const defaultPositions = [
    "Managing Director / CEO", "Executive Director", "Operations Director", "Finance Director / CFO",
    "Account Executive", "Account Manager", "Senior Account Manager", "Account Director", "Group Account Director",
    "Traffic Manager", "Project Manager", "Strategic Planner", "Digital Strategist", "Media Strategist", "Brand Strategist",
    "Creative Director (CD)", "Associate Creative Director (ACD)", "Art Director (AD)", "Copywriter", "Graphic Designer", "Motion Designer", "Content Creator",
    "PPC Specialist", "Performance Marketing Manager", "Media Buyer", "SEO Specialist", "Social Media Manager", "Community Manager", "CRM Specialist", "Data Specialist",
    "Producer", "Digital Producer", "Frontend Developer", "Backend Developer", "Full-stack Developer", "UX Designer", "UI Designer", "QA / Tester", "Tech Lead",
    "HR Manager", "Office Manager", "IT Support"
  ]

  console.log('Nahrávam pozície...')
  for (const posName of defaultPositions) {
    await prisma.agencyPosition.upsert({
      where: { agencyId_name: { agencyId: agency.id, name: posName } },
      update: {},
      create: { agencyId: agency.id, name: posName }
    })
  }

  // UŽÍVATELIA
  await prisma.user.upsert({
    where: { email: 'super@agencyflow.com' },
    update: { passwordHash },
    create: { email: 'super@agencyflow.com', name: 'Marek Superadmin', role: Role.SUPERADMIN, passwordHash, active: true }
  })

  await prisma.user.upsert({
    where: { email: 'traffic@agency.com' },
    update: { agencyId: agency.id, passwordHash },
    create: { email: 'traffic@agency.com', name: 'Peter Traffic', role: Role.TRAFFIC, agencyId: agency.id, passwordHash, active: true }
  })

  console.log('--- SEED DOKONČENÝ ---')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())