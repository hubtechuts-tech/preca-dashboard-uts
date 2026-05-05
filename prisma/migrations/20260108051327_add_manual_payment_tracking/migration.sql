-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "manual_payment_marked_at" TIMESTAMPTZ(6),
ADD COLUMN     "manual_payment_marked_by" UUID,
ADD COLUMN     "manual_payment_reason" TEXT;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "FK_screenings_manual_payment" FOREIGN KEY ("manual_payment_marked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
