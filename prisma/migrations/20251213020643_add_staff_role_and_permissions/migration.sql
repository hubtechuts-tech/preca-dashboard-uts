-- AlterEnum
ALTER TYPE "users_role_enum" ADD VALUE 'staff';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
