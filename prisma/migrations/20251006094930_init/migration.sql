-- AlterTable
ALTER TABLE `estates` MODIFY `availability` ENUM('available', 'archived', 'sold') NOT NULL DEFAULT 'available';
