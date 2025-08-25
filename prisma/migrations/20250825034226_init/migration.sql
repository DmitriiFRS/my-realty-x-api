-- CreateTable
CREATE TABLE `estate_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estateId` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'VERIFIED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `rejectionReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `estate_statuses_estateId_key`(`estateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `estate_views` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estateId` INTEGER NOT NULL,
    `count` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `estate_views_estateId_key`(`estateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `estate_statuses` ADD CONSTRAINT `estate_statuses_estateId_fkey` FOREIGN KEY (`estateId`) REFERENCES `estates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `estate_views` ADD CONSTRAINT `estate_views_estateId_fkey` FOREIGN KEY (`estateId`) REFERENCES `estates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
