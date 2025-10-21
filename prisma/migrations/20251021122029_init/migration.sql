/*
  Warnings:

  - Added the required column `estateId` to the `reminders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `estate_types` ADD COLUMN `icon` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reminders` ADD COLUMN `estateId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_estateId_fkey` FOREIGN KEY (`estateId`) REFERENCES `estates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
