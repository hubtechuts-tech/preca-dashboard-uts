-- Change service_catalog.id from UUID to auto-incrementing integer
-- This will make it easier for AI agents to reference services (1, 2, 3 instead of UUIDs)

-- Step 1: Drop foreign key constraint from screenings
ALTER TABLE "screenings" DROP CONSTRAINT IF EXISTS "FK_305632b6e8201384307636d5486";

-- Step 2: Drop and recreate service_catalog.id as INTEGER with auto-increment
ALTER TABLE "service_catalog" DROP CONSTRAINT "PK_6a3e667a8080d99485f8507c867";
ALTER TABLE "service_catalog" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE "service_catalog" ALTER COLUMN "id" TYPE INTEGER USING 1;
CREATE SEQUENCE IF NOT EXISTS service_catalog_id_seq OWNED BY "service_catalog"."id";
ALTER TABLE "service_catalog" ALTER COLUMN "id" SET DEFAULT nextval('service_catalog_id_seq');
SELECT setval('service_catalog_id_seq', COALESCE((SELECT MAX(id) FROM service_catalog), 0) + 1, false);
ALTER TABLE "service_catalog" ADD CONSTRAINT "PK_6a3e667a8080d99485f8507c867" PRIMARY KEY ("id");

-- Step 3: Change screenings.service_id from UUID to INTEGER
ALTER TABLE "screenings" ALTER COLUMN "service_id" TYPE INTEGER USING 1;

-- Step 4: Recreate foreign key constraint
ALTER TABLE "screenings" ADD CONSTRAINT "FK_305632b6e8201384307636d5486"
    FOREIGN KEY ("service_id") REFERENCES "service_catalog"("id")
    ON DELETE NO ACTION ON UPDATE NO ACTION;
