/*
  Warnings:

  - The primary key for the `persetujuan` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `role` to the `persetujuan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `persetujuan` DROP PRIMARY KEY,
    ADD COLUMN `approvedAt` DATETIME(3) NULL,
    ADD COLUMN `role` ENUM('LEADER', 'SUPERVISOR', 'MANAGER', 'STAFF') NOT NULL,
    ADD PRIMARY KEY (`id_users`, `id_department`, `id_kanban`, `role`);

-- AlterTable
ALTER TABLE `request_kanban` ADD COLUMN `status` ENUM('PENDING_APPROVAL', 'APPROVED_BY_DEPARTMENT', 'PENDING_PC', 'APPROVED_BY_PC', 'REJECTED') NOT NULL DEFAULT 'PENDING_APPROVAL';

-- AlterTable
ALTER TABLE `users` MODIFY `role` ENUM('ADMIN', 'USER', 'MANAGER', 'SUPERVISOR', 'LEADER', 'STAFF') NOT NULL;

-- CreateTable
CREATE TABLE `notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `kanbanId` INTEGER NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `sentAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id_users`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `notification_kanbanId_fkey` FOREIGN KEY (`kanbanId`) REFERENCES `request_kanban`(`id_kanban`) ON DELETE RESTRICT ON UPDATE CASCADE;
