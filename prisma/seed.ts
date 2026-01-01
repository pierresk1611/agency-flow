import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const STRUCTURED_POSITIONS = [
  { category: "1. Vedenie agentúry", roles: ["Managing Director / CEO", "Executive Director", "Operations Director", "Finance Director / CFO"] },
  { category: "2. Client Service / Account", roles: ["Account Executive", "Account Manager", "Senior Account Manager", "Account Director", "Group Account Director", "Traffic Manager", "Project Manager"] },
  { category: "3. Strategy / Planning", roles: ["Strategic Planner", "Digital Strategist", "Media Strategist", "Brand Strategist"] },
  { category: "4. Creative oddelenie", roles: ["Creative Director (CD)", "Associate Creative Director (ACD)", "Art Director (AD)", "Copywriter", "Graphic Designer", "Motion Designer", "Content Creator"] },
  { category: "5. Digital / Performance", roles: ["PPC Specialist", "Performance Marketing Manager", "Media Buyer", "SEO Specialist", "Social Media Manager", "Community Manager", "CRM Specialist", "Data Specialist"] },
  { category: "6. Production / Delivery", roles: ["Producer", "Digital Producer", "Project Manager Delivery", "Traffic Manager Production"] },
  { category: "7. Tech / Development", roles: ["Frontend Developer", "Backend Developer", "Full-stack Developer", "UX Designer", "UI Designer", "UX Researcher", "QA / Tester", "Tech Lead"] },
  { category: "8. Podporné oddelenia", roles: ["HR Manager", "Office Manager", "Finance / Accounting", "Legal / Compliance", "IT Support"] }
]

async function main() {
  console.log('--- ŠTART SEEDU ---')

  // 1. Create Default Agency
  const defaultAgencyName = 'AgencyFlow HQ'
  const defaultAgencySlug = 'agencyflow-hq'

  let agency = await prisma.agency.findUnique({ where: { slug: defaultAgencySlug } })

  if (!agency) {
    console.log(`Vytváram default agentúru: ${defaultAgencyName}`)
    agency = await prisma.agency.create({
      data: {
        name: defaultAgencyName,
        slug: defaultAgencySlug,
        status: 'ACTIVE',
        contactName: 'Super Admin'
      }
    })
  } else {
    console.log(`Agentúra existuje: ${defaultAgencyName}`)
  }

  // 2. Create Superadmin
  const superAdminEmail = 'super@agencyflow.com'
  const superAdminPassword = 'password123'

  const existingUser = await prisma.user.findUnique({ where: { email: superAdminEmail } })

  if (!existingUser) {
    console.log(`Vytváram Superadmina: ${superAdminEmail}`)
    const hashedPassword = await bcrypt.hash(superAdminPassword, 10)

    await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: hashedPassword,
        name: 'Super Admin',
        role: 'SUPERADMIN',
        active: true,
        agencyId: agency.id
      }
    })
  } else {
    console.log(`Superadmin existuje: ${superAdminEmail}`)
  }

  // 3. Populate Positions
  const agencies = await prisma.agency.findMany()

  for (const ag of agencies) {
    console.log(`Dopĺňam pozície pre agentúru: ${ag.name}`)
    for (const group of STRUCTURED_POSITIONS) {
      for (const roleName of group.roles) {
        await prisma.agencyPosition.upsert({
          where: { agencyId_name: { agencyId: ag.id, name: roleName } },
          update: { category: group.category },
          create: { agencyId: ag.id, name: roleName, category: group.category }
        })
      }
    }
  }

  console.log('--- HOTOVO ---')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())