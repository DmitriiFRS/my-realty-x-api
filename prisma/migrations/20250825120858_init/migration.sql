-- DropIndex
DROP INDEX `users_name_key` ON `users`;

-- AlterTable
ALTER TABLE `users` MODIFY `telegramId` VARCHAR(191) NULL;
