-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "costRate" DOUBLE PRECISION DEFAULT 0,
ALTER COLUMN "hourlyRate" SET DEFAULT 0;
