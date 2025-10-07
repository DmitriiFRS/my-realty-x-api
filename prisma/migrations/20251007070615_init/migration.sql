-- CreateTable
CREATE TABLE `lease_agreements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `estateId` INTEGER NOT NULL,
    `currencyTypeId` INTEGER NOT NULL,
    `tenantName` VARCHAR(191) NOT NULL,
    `tenantPhone` VARCHAR(191) NOT NULL,
    `rentAmount` BIGINT NOT NULL,
    `depositAmount` BIGINT NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `lease_agreements_estateId_key`(`estateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `lease_agreements` ADD CONSTRAINT `lease_agreements_estateId_fkey` FOREIGN KEY (`estateId`) REFERENCES `estates`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lease_agreements` ADD CONSTRAINT `lease_agreements_currencyTypeId_fkey` FOREIGN KEY (`currencyTypeId`) REFERENCES `currency_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
