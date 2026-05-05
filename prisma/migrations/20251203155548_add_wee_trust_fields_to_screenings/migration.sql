-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "authorization_document_url" VARCHAR(500),
ADD COLUMN     "authorization_signed_at" TIMESTAMPTZ(6),
ADD COLUMN     "wee_trust_document_id" VARCHAR;
