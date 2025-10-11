-- CreateTable
CREATE TABLE `utility_services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estateId` INTEGER NOT NULL,
    `wifi` VARCHAR(191) NULL,
    `water` VARCHAR(191) NULL,
    `electricity` VARCHAR(191) NULL,
    `garbage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `utility_services_estateId_key`(`estateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utility_services` ADD CONSTRAINT `utility_services_estateId_fkey` FOREIGN KEY (`estateId`) REFERENCES `estates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
