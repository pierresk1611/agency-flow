/*
  Warnings:

  - A unique constraint covering the columns `[agencyId,name]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ADD COLUMN     "position" TEXT;

-- CreateTable
CREATE TABLE "AgencyPosition" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgencyPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyPosition_agencyId_name_key" ON "AgencyPosition"("agencyId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Client_agencyId_name_key" ON "Client"("agencyId", "name");

-- AddForeignKey
ALTER TABLE "AgencyPosition" ADD CONSTRAINT "AgencyPosition_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
