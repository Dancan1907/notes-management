-- AlterTable
ALTER TABLE "User" ADD COLUMN     "backupCodes" TEXT,
ADD COLUMN     "isTwoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT;
