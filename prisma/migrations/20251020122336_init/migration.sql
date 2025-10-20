-- CreateTable
CREATE TABLE `estate_reactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `estateId` INTEGER NOT NULL,
    `type` ENUM('LIKE', 'DISLIKE') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `estate_reactions_estateId_idx`(`estateId`),
    INDEX `estate_reactions_userId_idx`(`userId`),
    UNIQUE INDEX `estate_reactions_userId_estateId_key`(`userId`, `estateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `estate_reactions` ADD CONSTRAINT `estate_reactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estate_reactions` ADD CONSTRAINT `estate_reactions_estateId_fkey` FOREIGN KEY (`estateId`) REFERENCES `estates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
