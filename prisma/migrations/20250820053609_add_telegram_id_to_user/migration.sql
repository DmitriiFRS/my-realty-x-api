/*
  Warnings:

  - A unique constraint covering the columns `[telegramId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `telegramId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_telegramId_key` ON `users`(`telegramId`);
