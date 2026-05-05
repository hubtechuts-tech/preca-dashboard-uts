-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "additional_emails" TEXT[] DEFAULT ARRAY[]::TEXT[];
