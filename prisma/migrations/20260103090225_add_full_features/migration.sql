-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "subscriptionPlan" TEXT NOT NULL DEFAULT 'TRIAL';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "externalLink" TEXT;
