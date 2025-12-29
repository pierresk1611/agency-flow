import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

console.log("DEBUG: process.env.DATABASE_URL =", process.env.DATABASE_URL);
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_Aw56YZHlVUhO@ep-calm-violet-aggutujf-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma