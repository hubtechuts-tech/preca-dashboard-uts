-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "report_urls" TEXT[] DEFAULT ARRAY[]::TEXT[];
