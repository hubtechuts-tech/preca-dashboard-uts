-- AlterTable
ALTER TABLE "screenings" ADD COLUMN     "advisor_id" INTEGER;

-- CreateTable
CREATE TABLE "advisors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone_number" VARCHAR(20) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_advisors" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UQ_advisors_email" ON "advisors"("email");

-- CreateIndex
CREATE INDEX "IDX_advisors_phone" ON "advisors"("phone_number");

-- CreateIndex
CREATE INDEX "IDX_advisors_email" ON "advisors"("email");

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "FK_screenings_advisor_id" FOREIGN KEY ("advisor_id") REFERENCES "advisors"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
