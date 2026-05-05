-- CreateEnum
CREATE TYPE "coupons_discount_type_enum" AS ENUM ('percentage', 'fixed_amount');

-- CreateTable
CREATE TABLE "coupons" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "stripe_coupon_id" VARCHAR NOT NULL,
    "discount_type" "coupons_discount_type_enum" NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "applies_to_services" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "description" TEXT,
    "organization_name" VARCHAR,
    "notes" TEXT,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "max_redemptions" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "expires_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_coupons" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_coupons_code" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UQ_coupons_stripe_id" ON "coupons"("stripe_coupon_id");

-- AddForeignKey
ALTER TABLE "coupons" ADD CONSTRAINT "FK_coupons_created_by" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
