-- AlterTable
ALTER TABLE "Agency" ADD COLUMN     "internalAccountId" TEXT,
ADD COLUMN     "isSuspended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "trialReminderSent" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Agency" ADD CONSTRAINT "Agency_internalAccountId_fkey" FOREIGN KEY ("internalAccountId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
