-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "identity_verification_data" JSONB,
ADD COLUMN     "identity_verification_id" VARCHAR,
ADD COLUMN     "identity_verification_url" VARCHAR(500),
ADD COLUMN     "identity_verified_at" TIMESTAMPTZ(6);
