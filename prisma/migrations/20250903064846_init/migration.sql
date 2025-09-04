-- AlterTable
ALTER TABLE `estates` ADD COLUMN `cityId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `estates` ADD CONSTRAINT `estates_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
