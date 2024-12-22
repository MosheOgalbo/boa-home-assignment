-- CreateTable
CREATE TABLE `shopify_sessions` (
    `id` VARCHAR(255) NOT NULL,
    `shop` VARCHAR(255) NOT NULL,
    `state` VARCHAR(255) NOT NULL,
    `isOnline` TINYINT NOT NULL,
    `scope` VARCHAR(1024) NULL,
    `expires` INTEGER NULL,
    `onlineAccessInfo` VARCHAR(255) NULL,
    `accessToken` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shopify_sessions_migrations` (
    `migration_name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`migration_name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
