import { PrismaClient, Role, JobStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const agency = await prisma.agency.upsert({
    where: { id: 'seed-agency-id' },
    update: { slug: 'super-creative' },
    create: { 
      id: 'seed-agency-id', name: 'Super Creative Agency', slug: 'super-creative',
      companyId: '12345678', vatId: 'SK2020202020', address: 'Mýtna 1, Bratislava', email: 'hello@supercreative.sk'
    }
  })

  // 1. VIACERO UŽÍVATEĽOV (Pre graf vyťaženosti)
  const usersData = [
    { email: 'traffic@agency.com', name: 'Peter Traffic', role: Role.TRAFFIC },
    { email: 'account@agency.com', name: 'Lucka Account', role: Role.ACCOUNT },
    { email: 'creative@agency.com', name: 'Jozef Dizajnér', role: Role.CREATIVE },
    { email: 'copy@agency.com', name: 'Milan Copywriter', role: Role.CREATIVE },
    { email: 'dev@agency.com', name: 'Andrej Developer', role: Role.CREATIVE },
  ]

  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { agencyId: agency.id, passwordHash },
      create: { ...u, agencyId: agency.id, passwordHash, active: true, hourlyRate: 50, costRate: 30 }
    })
  }

  const creatives = await prisma.user.findMany({ where: { role: Role.CREATIVE, agencyId: agency.id } })

  // 2. VIACERO KLIENTOV
  const clients = ['TechCorp s.r.o.', 'Audi Slovakia', 'Tatra Banka', 'McDonalds']
  for (const name of clients) {
    const c = await prisma.client.upsert({
      where: { agencyId_name: { agencyId: agency.id, name } },
      update: {},
      create: { name, priority: Math.floor(Math.random() * 5) + 1, agencyId: agency.id, scope: 'Digital, ATL' }
    })

    const campaign = await prisma.campaign.create({ data: { name: `Kampaň ${name} 2025`, clientId: c.id } })

    // 3. VEĽA JOBOV V RÔZNYCH STAVOCH (Pre grafy)
    for (let i = 1; i <= 3; i++) {
        const status = i === 1 ? JobStatus.TODO : i === 2 ? JobStatus.IN_PROGRESS : JobStatus.DONE
        const deadline = new Date()
        deadline.setDate(deadline.getDate() + (Math.random() * 20 - 10)) // Niektoré meškajú, niektoré v budúcnosti

        const job = await prisma.job.create({
            data: {
                title: `Job ${i} pre ${name}`,
                campaignId: campaign.id,
                status: status,
                deadline: deadline,
                budget: (Math.random() * 2000) + 500,
                assignments: {
                    create: {
                        userId: creatives[Math.floor(Math.random() * creatives.length)].id,
                        roleOnJob: 'Specialist'
                    }
                }
            }
        })

        // 4. TIMESHEETY (Pre graf schvaľovania a Plan vs Real)
        if (status !== JobStatus.TODO) {
            const ts = await prisma.timesheet.create({
                data: {
                    jobAssignmentId: (await prisma.jobAssignment.findFirst({ where: { jobId: job.id } }))!.id,
                    startTime: new Date(),
                    endTime: new Date(),
                    durationMinutes: (Math.random() * 240) + 60,
                    status: i === 3 ? 'APPROVED' : 'PENDING',
                    description: 'Práca na zadaní'
                }
            })

            if (ts.status === 'APPROVED') {
                const hours = ts.durationMinutes! / 60
                await prisma.budgetItem.create({
                    data: { jobId: job.id, timesheetId: ts.id, hours, rate: 50, amount: hours * 50 }
                })
            }
        }
    }
  }
  console.log('🚀 Mega Seed hotový!')
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())