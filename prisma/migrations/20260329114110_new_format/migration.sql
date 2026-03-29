/*
  Warnings:

  - You are about to drop the column `userID` on the `Project` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userID_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "userID",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Usage" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "Usage_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
