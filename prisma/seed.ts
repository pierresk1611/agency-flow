import { PrismaClient } from '@prisma/client'

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
  console.log('--- ŠTART ŠTRUKTÚROVANÉHO SEEDU ---')
  
  const agencies = await prisma.agency.findMany()
  
  for (const agency of agencies) {
    console.log(`Dopĺňam pozície pre agentúru: ${agency.name}`)
    
    for (const group of STRUCTURED_POSITIONS) {
      for (const roleName of group.roles) {
        await prisma.agencyPosition.upsert({
          where: { agencyId_name: { agencyId: agency.id, name: roleName } },
          update: { category: group.category },
          create: { agencyId: agency.id, name: roleName, category: group.category }
        })
      }
    }
  }
  console.log('--- HOTOVO ---')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())