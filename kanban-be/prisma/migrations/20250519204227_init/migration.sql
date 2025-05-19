/*
  Warnings:

  - Added the required column `nama_requester` to the `request_kanban` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `request_kanban` ADD COLUMN `nama_requester` VARCHAR(191) NOT NULL;
