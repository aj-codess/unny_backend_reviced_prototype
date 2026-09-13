-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'ACCOUNT_VERIFIED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false;
