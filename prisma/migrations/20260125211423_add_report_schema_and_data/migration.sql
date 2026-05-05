-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "report_data" JSONB;

-- AlterTable
ALTER TABLE "service_catalog" ADD COLUMN     "report_schema" JSONB;
