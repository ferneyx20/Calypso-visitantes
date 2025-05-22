/*
  Warnings:

  - You are about to drop the column `photoDataUri` on the `Visitante` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Visitante" DROP COLUMN "photoDataUri",
ADD COLUMN     "photoFilename" TEXT;
