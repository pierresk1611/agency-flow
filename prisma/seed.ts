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


  // 4. Seed Email Templates
  console.log('Seeding Email Templates...')
  const templates = [
    {
      slug: 'ADMIN_NEW_REGISTRATION',
      name: 'Notifikácia Superadminovi (Nová registrácia)',
      subject: 'Nová registrácia: {{agencyName}}',
      body: '<p>Nová registrácia: <strong>{{agencyName}}</strong>.</p><p>Skontrolujte dashboard v Superadmin zóne.</p>',
      description: 'Premenné: {{agencyName}}'
    },
    {
      slug: 'CLIENT_WELCOME_APPROVED',
      name: 'Klient - Schválenie registrácie',
      subject: 'Vaša agentúra {{agencyName}} bola schválená!',
      body: '<p>Vaša agentúra <strong>{{agencyName}}</strong> bola schválená!</p><p>Prihláste sa tu: <a href="{{link}}">{{link}}</a></p>',
      description: 'Premenné: {{agencyName}}, {{link}}'
    },
    {
      slug: 'CLIENT_REJECTED',
      name: 'Klient - Zamietnutie registrácie',
      subject: 'Informácia o registrácii',
      body: '<p>Vaša registrácia pre agentúru {{agencyName}} bola zamietnutá.</p>',
      description: 'Premenné: {{agencyName}}'
    },
    {
      slug: 'TRIAL_REMINDER',
      name: 'Klient - Pripomienka konca skúšobnej verzie',
      subject: 'Vaša skúšobná verzia končí o 5 dní - AgencyFlow',
      body: '<p>Ahoj {{contactName}},</p><p>Vaša 14-dňová skúšobná verzia pre agentúru <strong>{{agencyName}}</strong> skončila.</p><p>Máte 5 dní na úhradu licencie, inak bude váš účet zablokovaný.</p><p>Kontaktujte nás pre predĺženie alebo fakturáciu.</p>',
      description: 'Premenné: {{agencyName}}, {{contactName}}'
    },
    {
      slug: 'SUBSCRIPTION_PAYMENT',
      name: 'Klient - Platba za členstvo',
      subject: 'Vaše plné členstvo v AgencyFlow bolo schválené!',
      body: '<p>Gratulujeme! Vaše členstvo bolo schválené.</p><p>Pre aktiváciu plnej verzie prosím uhradte predplatné na tomto odkaze:</p><p><a href="{{paymentLink}}">{{paymentLink}}</a></p><p>Tím AgencyFlow</p>',
      description: 'Premenné: {{paymentLink}}'
    }
  ]

  for (const t of templates) {
    await prisma.emailTemplate.upsert({
      where: { slug: t.slug },
      update: {},
      create: t
    })
  }

  // 5. Seed Scopes
  console.log('Seeding Scopes...')
  const scopes = ['Full Service', 'Design', 'Development', 'Social Media', 'PPC', 'SEO', 'Consulting', 'Branding', 'Video Production', 'Copywriting']
  for (const name of scopes) {
    await prisma.agencyScope.upsert({
      where: { agencyId_name: { agencyId: agency.id, name } },
      update: {},
      create: { agencyId: agency.id, name }
    })
  }

  // 6. Seed Sample Data (Clients, Team, Campaigns, Jobs)
  console.log('Seeding Sample Data (Clients, Team, Campaigns, Jobs)...')
  await seedSampleData(prisma, agency.id)

  console.log('--- HOTOVO ---')
}

async function seedSampleData(prisma: PrismaClient, agencyId: string) {
  // --- A. Agency Team ---
  console.log('  -> Creating Agency Team...')
  const teamRoles = [
    { email: 'account@agencyflow.com', name: 'Adam Account', role: 'ACCOUNT', position: 'Account Manager', hourlyRate: 60, costRate: 30 },
    { email: 'creative@agencyflow.com', name: 'Cyril Creative', role: 'CREATIVE', position: 'Art Director', hourlyRate: 80, costRate: 40 },
    { email: 'traffic@agencyflow.com', name: 'Tana Traffic', role: 'TRAFFIC', position: 'Traffic Manager', hourlyRate: 50, costRate: 25 },
    { email: 'finance@agencyflow.com', name: 'Fero Finance', role: 'ADMIN', position: 'CFO', hourlyRate: 100, costRate: 50 },
    { email: 'copy@agencyflow.com', name: 'Katka Copy', role: 'CREATIVE', position: 'Copywriter', hourlyRate: 70, costRate: 35 },
  ] as const

  const teamUsers = []
  for (const user of teamRoles) {
    const existing = await prisma.user.findUnique({ where: { email: user.email } })
    if (!existing) {
      const pwd = await bcrypt.hash('password123', 10)
      const newUser = await prisma.user.create({
        data: {
          email: user.email,
          name: user.name,
          role: user.role as any,
          position: user.position,
          passwordHash: pwd,
          agencyId: agencyId,
          active: true,
          hourlyRate: user.hourlyRate,
          costRate: user.costRate
        }
      })
      teamUsers.push(newUser)
    } else {
      teamUsers.push(existing)
    }
  }

  // --- B. Clients ---
  console.log('  -> Creating Clients...')
  const clientNames = [
    'TechCorp Solutions', 'GreenEnergy Systems', 'Fashionista Brand',
    'MegaRetail s.r.o.', 'Local Breweries', 'FinTech Startups', 'Logistics Pro'
  ]
  const clients = []

  for (let i = 0; i < clientNames.length; i++) {
    const name = clientNames[i]
    // Check if exists
    let client = await prisma.client.findFirst({
      where: { agencyId, name }
    })

    if (!client) {
      client = await prisma.client.create({
        data: {
          agencyId,
          name,
          priority: Math.floor(Math.random() * 3) + 1, // 1-3
          scope: 'Full Service'
        }
      })
      // Add a contact person
      await prisma.contactPerson.create({
        data: {
          clientId: client.id,
          name: `Contact ${name.split(' ')[0]}`,
          email: `contact@${name.toLowerCase().replace(/\s/g, '')}.com`,
          position: 'Marketing Manager'
        }
      })
    }
    clients.push(client)
  }

  // --- C. Campaigns ---
  console.log('  -> Creating Campaigns...')
  const campaignTitles = [
    'Summer Launch 2026', 'Rebranding Q1', 'Social Media Awareness',
    'Black Friday Push', 'Sustainability Report', 'Website Redesign',
    'Product Video Series', 'Influencer Activation', 'Print Ad Series', 'Internal Comms'
  ]

  const campaigns = []
  for (let i = 0; i < 10; i++) {
    // Pick a random client (ensure round robin or random)
    const client = clients[i % clients.length]
    const title = i < campaignTitles.length ? campaignTitles[i] : `Campaign ${i + 1}`

    let camp = await prisma.campaign.findFirst({
      where: { clientId: client.id, name: title }
    })

    if (!camp) {
      camp = await prisma.campaign.create({
        data: {
          clientId: client.id,
          name: title,
          description: `This is a sample campaign for ${client.name}.`
        }
      })
    }
    campaigns.push(camp)
  }

  // --- D. Jobs ---
  console.log('  -> Creating Jobs...')
  // We need 50 jobs distributed among campaigns
  const jobTypes = ['Visual Key', 'Copywriting', 'Logo Design', 'Strategy Deck', 'Social Posts', 'Banner Resize', 'Video Edit', 'Landing Page', 'SEO Audit', 'Newsletter']

  // existing jobs check might be overkill for seeding random data, but let's try to be idempotent if we run it multiple times 
  // by checking count or just adding if we feel like it. 
  // Better: Check if any jobs exist for these campaigns, if so, maybe skip or add more? 
  // Let's just create them if the total count is low or just add them. 
  // To avoid duplicates on re-run, check title + campaign combination.

  let jobsCreated = 0
  for (let i = 0; i < 50; i++) {
    const campaign = campaigns[i % campaigns.length]
    const type = jobTypes[i % jobTypes.length]
    const title = `${type} #${Math.floor(i / 10) + 1} - ${campaign.name.substring(0, 10)}`

    // Status distribution
    const statuses = ['TODO', 'TODO', 'IN_PROGRESS', 'IN_PROGRESS', 'DONE', 'TENDER']
    const status = statuses[i % statuses.length]

    // Date: random future or past
    const daysOffset = (Math.floor(Math.random() * 30)) - 10 // -10 to +20 days
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + daysOffset)

    const existingJob = await prisma.job.findFirst({
      where: { campaignId: campaign.id, title: title }
    })

    if (!existingJob) {
      const job = await prisma.job.create({
        data: {
          campaignId: campaign.id,
          title: title,
          status: status as any,
          deadline: deadline,
          budget: Math.floor(Math.random() * 500) * 10
        }
      })
      jobsCreated++

      jobsCreated++

      // Assign Team (Account + Creative rule)
      if (teamUsers.length > 0) {
        // 1. Assign an Account Manager
        const accounts = teamUsers.filter(u => u.role === 'ACCOUNT' || u.role === 'TRAFFIC' || u.role === 'ADMIN')
        if (accounts.length > 0) {
          const acc = accounts[i % accounts.length]
          await prisma.jobAssignment.create({
            data: { jobId: job.id, userId: acc.id, roleOnJob: 'Account Manager' }
          })
        }

        // 2. Assign a Creative
        const creatives = teamUsers.filter(u => u.role === 'CREATIVE')
        if (creatives.length > 0) {
          const creat = creatives[i % creatives.length]
          await prisma.jobAssignment.create({
            data: { jobId: job.id, userId: creat.id, roleOnJob: 'Creative Lead' }
          })
        }
      }
    }
  }
  console.log(`  -> Created ${jobsCreated} new jobs.`)

  // --- E. Internal Projects & Jobs ---
  console.log('  -> Creating Internal Projects...')
  let internalClient = await prisma.client.findFirst({
    where: { agencyId, name: 'Internal Agency Work' }
  })

  if (!internalClient) {
    internalClient = await prisma.client.create({
      data: {
        agencyId,
        name: 'Internal Agency Work',
        priority: 0,
        scope: 'Internal'
      }
    })
  }

  let internalCampaign = await prisma.campaign.findFirst({
    where: { clientId: internalClient.id, name: 'General 2026' }
  })

  if (!internalCampaign) {
    internalCampaign = await prisma.campaign.create({
      data: {
        clientId: internalClient.id,
        name: 'General 2026',
        description: 'Internal non-billable time'
      }
    })
  }

  const internalJobsData = ['Teambuilding', 'Internal Meetings', 'Education / Training', 'Agency Marketing']
  const internalJobs = []

  for (const title of internalJobsData) {
    let job = await prisma.job.findFirst({
      where: { campaignId: internalCampaign.id, title }
    })

    if (!job) {
      job = await prisma.job.create({
        data: {
          campaignId: internalCampaign.id,
          title,
          status: 'IN_PROGRESS',
          deadline: new Date('2026-12-31')
        }
      })
    }
    internalJobs.push(job)
  }

  // --- F. Timesheets ---
  console.log('  -> Creating Timesheets...')
  // Fetch some jobs to log time on (mix of client jobs and internal)
  const allJobs = await prisma.job.findMany({
    where: { campaign: { client: { agencyId } } },
    take: 20
  })

  // We need users to log time
  const users = await prisma.user.findMany({ where: { agencyId } })

  for (let i = 0; i < 15; i++) {
    const user = users[i % users.length]
    // Random job
    const job = i % 3 === 0 && internalJobs.length > 0
      ? internalJobs[i % internalJobs.length] // 1/3 internal
      : allJobs[i % allJobs.length] // 2/3 client work

    // Check if assignment exists or create it
    let assign = await prisma.jobAssignment.findFirst({
      where: { jobId: job.id, userId: user.id }
    })

    if (!assign) {
      assign = await prisma.jobAssignment.create({
        data: { jobId: job.id, userId: user.id, roleOnJob: 'Contributor' }
      })
    }

    // Create timesheet
    // Random duration 30-240 mins
    const duration = (Math.floor(Math.random() * 8) + 1) * 30
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 7)) // last 7 days
    startTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0)

    const endTime = new Date(startTime)
    endTime.setMinutes(startTime.getMinutes() + duration)

    const ts = await prisma.timesheet.create({
      data: {
        jobAssignmentId: assign.id,
        startTime,
        endTime,
        durationMinutes: duration,
        description: `Work on ${job.title} - iteration ${i}`,
        status: i % 2 === 0 ? 'APPROVED' : 'PENDING',
        approvedBy: i % 2 === 0 ? users.find(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN')?.id : undefined,
        approvedAt: i % 2 === 0 ? new Date() : undefined
      }
    })

    if (i % 2 === 0) {
      await prisma.budgetItem.create({
        data: {
          jobId: job.id,
          timesheetId: ts.id,
          hours: duration / 60,
          rate: user.hourlyRate || 50,
          amount: (duration / 60) * (user.hourlyRate || 50)
        }
      })
    }
  }

  // --- G. Planner Entries ---
  console.log('  -> Creating Planner Entries...')
  const futureDate = new Date()
  futureDate.setHours(0, 0, 0, 0)

  for (let d = 0; d < 5; d++) { // Next 5 days
    const date = new Date(futureDate)
    date.setDate(date.getDate() + d + 1) // +1 to start tomorrow

    for (const user of users) {
      // Skip some users sometimes
      if (Math.random() > 0.7) continue

      const job = allJobs[Math.floor(Math.random() * allJobs.length)]

      await prisma.plannerEntry.create({
        data: {
          userId: user.id,
          jobId: job.id,
          date: date,
          minutes: (Math.floor(Math.random() * 4) + 2) * 60, // 2-6 hours
          title: 'Planned work'
        }
      })
    }
  }

  // --- H. Tenders ---
  console.log('  -> Creating Tenders...')
  const tenderTitles = [
    'Energo Systems - Web Redesign',
    'GreenCity 2026 - Campaign Strategy',
    'ChocoLovely - Christmas Packaging',
    'AutoMotion - Social Media Retainer'
  ]

  for (let i = 0; i < tenderTitles.length; i++) {
    const title = tenderTitles[i]
    let tender = await prisma.tender.findFirst({
      where: { agencyId, title }
    })

    if (!tender) {
      tender = await prisma.tender.create({
        data: {
          agencyId,
          title,
          description: `Tender for ${title}`,
          status: 'TODO', // or IN_PROGRESS
          deadline: new Date(new Date().setDate(new Date().getDate() + 14 + i)), // some future date
          budget: 5000 + (i * 2000)
        }
      })

      // Assign Team (Account + Creative) checking existing users
      if (teamUsers.length > 0) {
        // Account
        const accounts = teamUsers.filter(u => u.role === 'ACCOUNT' || u.role === 'TRAFFIC' || u.role === 'ADMIN')
        if (accounts.length > 0) {
          const acc = accounts[i % accounts.length]
          await prisma.tenderAssignment.create({
            data: { tenderId: tender.id, userId: acc.id, roleOnJob: 'Account Manager' }
          })
        }

        // Creative
        const creatives = teamUsers.filter(u => u.role === 'CREATIVE')
        if (creatives.length > 0) {
          const creat = creatives[i % creatives.length]
          await prisma.tenderAssignment.create({
            data: { tenderId: tender.id, userId: creat.id, roleOnJob: 'Creative Lead' }
          })
        }
      }
    }
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())