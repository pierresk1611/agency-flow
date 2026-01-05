import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const job = await prisma.job.findFirst({
    where: { title: { contains: 'Visual Key #1 - Summer Lau' } },
    include: { campaign: { include: { client: { include: { agency: true } } } } }
  });

  if (job) {
    console.log(`Job: ${job.title}`);
    console.log(`Agency: ${job.campaign.client.agency.name} (${job.campaign.client.agency.slug})`);
  } else {
    console.log('Job not found.');
  }
}

main().finally(() => prisma.$disconnect());
