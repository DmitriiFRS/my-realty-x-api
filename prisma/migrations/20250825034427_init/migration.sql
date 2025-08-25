/*
  Warnings:

  - You are about to alter the column `status` on the `estate_statuses` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `estate_statuses` MODIFY `status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending';
