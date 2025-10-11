/*
  Warnings:

  - You are about to drop the column `deposit` on the `estates` table. All the data in the column will be lost.
  - You are about to drop the column `leaseTermUnit` on the `estates` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `estates` DROP COLUMN `deposit`,
    DROP COLUMN `leaseTermUnit`;
