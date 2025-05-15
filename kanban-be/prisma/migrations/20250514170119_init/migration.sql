/*
  Warnings:

  - The values [REJECTED_BY_DEPARTEMENT] on the enum `request_kanban_status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `request_kanban` MODIFY `status` ENUM('PENDING_APPROVAL', 'APPROVED_BY_DEPARTMENT', 'PENDING_PC', 'APPROVED_BY_PC', 'REJECTED_BY_DEPARTMENT', 'REJECTED_BY_PC') NOT NULL DEFAULT 'PENDING_APPROVAL';
