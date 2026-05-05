-- CreateEnum
CREATE TYPE "screenings_status_enum" AS ENUM ('pending_payment', 'paid', 'processing_bureau', 'completed', 'rejected');

-- CreateEnum
CREATE TYPE "service_catalog_target_person_type_enum" AS ENUM ('physical', 'moral');

-- CreateEnum
CREATE TYPE "users_role_enum" AS ENUM ('admin', 'client', 'system_bot');

-- CreateTable
CREATE TABLE "api_keys" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "key_prefix" VARCHAR(10) NOT NULL,
    "key_hash" VARCHAR NOT NULL,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "PK_96109043cb705b5876b8d2090c8" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "migrations" (
    "id" SERIAL NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "name" VARCHAR NOT NULL,

    CONSTRAINT "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenings" (
    "id" UUID NOT NULL,
    "user_id" UUID,
    "service_id" UUID NOT NULL,
    "status" "screenings_status_enum" NOT NULL DEFAULT 'pending_payment',
    "applicant_name" VARCHAR NOT NULL,
    "applicant_email" VARCHAR NOT NULL,
    "applicant_phone" VARCHAR,
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "stripe_session_id" VARCHAR,
    "client_reference_id" VARCHAR,
    "payment_amount" DECIMAL(10,2),
    "payment_completed_at" TIMESTAMPTZ(6),
    "is_identity_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_completed_at" TIMESTAMPTZ(6),
    "admin_user_id" UUID,
    "admin_notes" TEXT,
    "report_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(6),

    CONSTRAINT "PK_27829a815d74240367d3e68078e" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_catalog" (
    "id" UUID NOT NULL,
    "code" VARCHAR NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" TEXT,
    "price_mxn" DECIMAL(10,2) NOT NULL,
    "target_person_type" "service_catalog_target_person_type_enum" NOT NULL,
    "stripe_product_id" VARCHAR,
    "stripe_price_id" VARCHAR,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_6a3e667a8080d99485f8507c867" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR NOT NULL,
    "password_hash" VARCHAR,
    "full_name" VARCHAR,
    "role" "users_role_enum" NOT NULL DEFAULT 'client',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_2297298305d23f3f38692736152" ON "service_catalog"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_97672ac88f789774dd47f7c8be3" ON "users"("email");

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "FK_05b95d85f4001e03b058072c723" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "FK_205632b6e8201384307636d5485" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "FK_305632b6e8201384307636d5486" FOREIGN KEY ("service_id") REFERENCES "service_catalog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "FK_405632b6e8201384307636d5487" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
