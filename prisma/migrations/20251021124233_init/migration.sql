/*
  Warnings:

  - Made the column `advanceDays` on table `reminders` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `reminders` MODIFY `advanceDays` INTEGER NOT NULL DEFAULT 7;
