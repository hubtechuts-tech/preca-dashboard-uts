-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "applicant_colony" VARCHAR(200),
ADD COLUMN     "applicant_legal_representative" VARCHAR(200),
ADD COLUMN     "applicant_municipality" VARCHAR(200),
ADD COLUMN     "applicant_person_type" "service_catalog_target_person_type_enum",
ADD COLUMN     "applicant_rfc" VARCHAR(13),
ADD COLUMN     "applicant_state" VARCHAR(100),
ADD COLUMN     "applicant_street" VARCHAR(500),
ADD COLUMN     "applicant_zip_code" VARCHAR(10);

-- AlterTable
ALTER TABLE "service_catalog" ADD COLUMN     "requires_applicant_details" BOOLEAN NOT NULL DEFAULT false;
