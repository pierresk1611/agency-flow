-- AlterTable
ALTER TABLE "Timesheet" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastPauseStart" TIMESTAMP(3),
ADD COLUMN     "totalPausedMinutes" INTEGER NOT NULL DEFAULT 0;
