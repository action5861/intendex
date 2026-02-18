-- AlterTable
ALTER TABLE "Intent" ADD COLUMN     "isCommercial" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pointValue" INTEGER NOT NULL DEFAULT 0;
