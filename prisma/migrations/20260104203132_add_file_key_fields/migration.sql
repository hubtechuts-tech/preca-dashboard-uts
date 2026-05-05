-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "authorization_document_file_key" VARCHAR(500),
ADD COLUMN     "identity_verification_file_key" VARCHAR(500),
ADD COLUMN     "report_file_keys" TEXT[] DEFAULT ARRAY[]::TEXT[];
