-- CreateTable
CREATE TABLE `users` (
    `id_users` INTEGER NOT NULL AUTO_INCREMENT,
    `id_department` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `no_hp` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id_users`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `departemen` (
    `id_department` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_department`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `request_kanban` (
    `id_kanban` INTEGER NOT NULL AUTO_INCREMENT,
    `id_users` INTEGER NOT NULL,
    `id_department` INTEGER NOT NULL,
    `tgl_produksi` DATETIME(3) NOT NULL,
    `parts_number` VARCHAR(191) NOT NULL,
    `lokasi` VARCHAR(191) NOT NULL,
    `box` VARCHAR(191) NOT NULL,
    `klasifikasi` VARCHAR(191) NOT NULL,
    `keterangan` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id_kanban`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persetujuan` (
    `id_users` INTEGER NOT NULL,
    `id_department` INTEGER NOT NULL,
    `id_kanban` INTEGER NOT NULL,
    `approve` BOOLEAN NOT NULL,

    PRIMARY KEY (`id_users`, `id_department`, `id_kanban`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_id_department_fkey` FOREIGN KEY (`id_department`) REFERENCES `departemen`(`id_department`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_kanban` ADD CONSTRAINT `request_kanban_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `users`(`id_users`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `request_kanban` ADD CONSTRAINT `request_kanban_id_department_fkey` FOREIGN KEY (`id_department`) REFERENCES `departemen`(`id_department`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_id_users_fkey` FOREIGN KEY (`id_users`) REFERENCES `users`(`id_users`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_id_department_fkey` FOREIGN KEY (`id_department`) REFERENCES `departemen`(`id_department`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `persetujuan` ADD CONSTRAINT `persetujuan_id_kanban_fkey` FOREIGN KEY (`id_kanban`) REFERENCES `request_kanban`(`id_kanban`) ON DELETE RESTRICT ON UPDATE CASCADE;
