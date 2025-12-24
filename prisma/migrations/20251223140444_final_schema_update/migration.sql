-- CreateTable
CREATE TABLE "AgencyScope" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "AgencyScope_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AgencyScope_agencyId_name_key" ON "AgencyScope"("agencyId", "name");

-- AddForeignKey
ALTER TABLE "AgencyScope" ADD CONSTRAINT "AgencyScope_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
