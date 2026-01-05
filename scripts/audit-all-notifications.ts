import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const notifications = await prisma.notification.findMany({
    include: {
      user: {
        select: {
          email: true,
          agencyId: true,
          agency: { select: { name: true, slug: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`AUDIT: ${notifications.length} notifications found.`);
  notifications.forEach(n => {
    console.log(`To: ${n.user.email} | UserAgency: ${n.user.agency?.slug} | Link: ${n.link} | Msg: ${n.message}`);
  });
}

main().finally(() => prisma.$disconnect());
