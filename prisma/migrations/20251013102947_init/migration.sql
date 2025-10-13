/*
  Warnings:

  - Added the required column `amount` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dueDate` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalDay` to the `reminders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `reminders` ADD COLUMN `advanceDays` INTEGER NOT NULL DEFAULT 7,
    ADD COLUMN `amount` DECIMAL(12, 2) NOT NULL,
    ADD COLUMN `dueDate` DATETIME(3) NOT NULL,
    ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lastRemindedAt` DATETIME(3) NULL,
    ADD COLUMN `originalDay` INTEGER NOT NULL,
    ADD COLUMN `recurrence` ENUM('NONE', 'MONTHLY') NOT NULL DEFAULT 'MONTHLY',
    MODIFY `remindAt` DATETIME(3) NULL;
