/*
  Warnings:

  - You are about to drop the column `internalAccountId` on the `Agency` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Agency" DROP CONSTRAINT "Agency_internalAccountId_fkey";

-- AlterTable
ALTER TABLE "Agency" DROP COLUMN "internalAccountId";

-- CreateTable
CREATE TABLE "_AgencyInternalApprovers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgencyInternalApprovers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AgencyInternalApprovers_B_index" ON "_AgencyInternalApprovers"("B");

-- AddForeignKey
ALTER TABLE "_AgencyInternalApprovers" ADD CONSTRAINT "_AgencyInternalApprovers_A_fkey" FOREIGN KEY ("A") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgencyInternalApprovers" ADD CONSTRAINT "_AgencyInternalApprovers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
