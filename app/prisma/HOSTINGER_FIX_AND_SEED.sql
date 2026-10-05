-- =============================================================================
-- METRO CARDZ — HOSTINGER MYSQL SCHEMA FIX & SEED SCRIPT
-- =============================================================================
-- Run this in Hostinger phpMyAdmin (Database: u446352478_metrocardzg / u446352478_metrocardz)
-- This script uses SET FOREIGN_KEY_CHECKS = 0 to avoid errno 121 / 1050 duplicate key errors.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────────────────────
-- PATCH: Add columns that were added to Prisma schema AFTER initial deployment.
-- "CREATE TABLE IF NOT EXISTS" won't add these to an existing table.
-- These ALTER TABLE statements are safe to run even if columns already exist.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE `merchant_users`
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(255) NULL;

CREATE UNIQUE INDEX IF NOT EXISTS `merchant_users_email_key`
  ON `merchant_users` (`email`);

ALTER TABLE `merchants`
  ADD COLUMN IF NOT EXISTS `card_design_url` TEXT NULL;

ALTER TABLE `merchants`
  ADD COLUMN IF NOT EXISTS `approval_status`
    ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';

ALTER TABLE `merchants`
  ADD COLUMN IF NOT EXISTS `referral_bonus_points` DECIMAL(65, 30) NULL;
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Ensure `merchants` table exists
CREATE TABLE IF NOT EXISTS `merchants` (
    `id` VARCHAR(36) NOT NULL,
    `business_name` TEXT NOT NULL,
    `category` TEXT NULL,
    `plan_tier` VARCHAR(50) NULL DEFAULT 'Starter',
    `whatsapp_number` VARCHAR(20) NULL,
    `logo_url` TEXT NULL,
    `address` TEXT NULL,
    `secret_salt` VARCHAR(255) NOT NULL,
    `card_design_url` TEXT NULL,
    `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    `approval_status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
    `referral_bonus_points` DECIMAL(65, 30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Ensure `merchant_users` table exists
CREATE TABLE IF NOT EXISTS `merchant_users` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NULL,
    `name` TEXT NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `role` ENUM('super_admin', 'owner', 'staff') NOT NULL DEFAULT 'staff',
    `password_hash` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `merchant_users_phone_key`(`phone`),
    UNIQUE INDEX `merchant_users_email_key`(`email`),
    INDEX `merchant_users_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 3. Ensure `card_inventory` table exists
CREATE TABLE IF NOT EXISTS `card_inventory` (
    `id` VARCHAR(36) NOT NULL,
    `card_number` VARCHAR(30) NOT NULL,
    `status` ENUM('unassigned', 'merchant_allocated', 'member_linked', 'deactivated') NOT NULL DEFAULT 'unassigned',
    `allocated_merchant_id` VARCHAR(36) NULL,
    `allocated_at` DATETIME(3) NULL,
    `linked_member_id` VARCHAR(36) NULL,
    `linked_at` DATETIME(3) NULL,
    `created_by_admin_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `card_inventory_card_number_key`(`card_number`),
    INDEX `card_inventory_allocated_merchant_id_idx`(`allocated_merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 4. Ensure `deals_admin_users` table exists (for /admin/login)
CREATE TABLE IF NOT EXISTS `deals_admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` TEXT NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `deals_admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =============================================================================
-- SEED SUPER ADMIN ACCOUNTS
-- Email: metrocouponsys@gmail.com
-- Phone: 9029999614
-- Password: 9029999614
-- Bcrypt Hash: $2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i
-- =============================================================================

-- Seed / Update in `merchant_users` (Main App & Admin Panel)
INSERT INTO `merchant_users` (`id`, `merchant_id`, `name`, `phone`, `email`, `role`, `password_hash`, `created_at`)
VALUES (
    '9c2a0db3-c7e6-4d04-8b65-6cb56ec6b9f7',
    NULL,
    'Metro Cardz Super Admin',
    '9029999614',
    'metrocouponsys@gmail.com',
    'super_admin',
    '$2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i',
    NOW(3)
)
ON DUPLICATE KEY UPDATE
    `role` = 'super_admin',
    `email` = 'metrocouponsys@gmail.com',
    `password_hash` = '$2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i';

-- Seed / Update in `deals_admin_users` (Deals Platform Admin /admin/login)
INSERT INTO `deals_admin_users` (`id`, `email`, `password_hash`, `role`, `created_at`)
VALUES (
    1,
    'metrocouponsys@gmail.com',
    '$2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i',
    'admin',
    NOW(3)
)
ON DUPLICATE KEY UPDATE
    `password_hash` = '$2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i';

-- =============================================================================
-- SEED GARMENTS MERCHANT + OWNER ACCOUNT
-- Email: garments@metrocardz.in
-- Password: demo123
-- =============================================================================

-- Seed merchant record first (required for foreign key on merchant_users)
INSERT INTO `merchants` (`id`, `business_name`, `category`, `plan_tier`, `secret_salt`, `status`, `approval_status`, `created_at`)
VALUES (
    'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
    'Metro Garments',
    'Retail',
    'Starter',
    'garments-secret-salt-2024',
    'active',
    'approved',
    NOW(3)
)
ON DUPLICATE KEY UPDATE `status` = 'active';

-- Seed merchant owner account
INSERT INTO `merchant_users` (`id`, `merchant_id`, `name`, `phone`, `email`, `role`, `password_hash`, `created_at`)
VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    'f1a2b3c4-d5e6-7890-abcd-ef1234567890',
    'Garments Admin',
    '9000000001',
    'garments@metrocardz.in',
    'owner',
    '$2b$10$155rhwyTGOGr8arc7Rqa4ueyoWJqzu3us7eGnAdy9hj/okf.8ob.C',
    NOW(3)
)
ON DUPLICATE KEY UPDATE
    `password_hash` = '$2b$10$155rhwyTGOGr8arc7Rqa4ueyoWJqzu3us7eGnAdy9hj/okf.8ob.C',
    `role` = 'owner';

-- =============================================================================
-- SEED SAMPLE PHYSICAL CARDS (For Immediate Testing)
-- =============================================================================
INSERT IGNORE INTO `card_inventory` (`id`, `card_number`, `status`, `created_at`) VALUES
('crd-001', '4821 6739 0001 0001', 'unassigned', NOW(3)),
('crd-002', '4821 6739 0001 0002', 'unassigned', NOW(3)),
('crd-003', '4821 6739 0001 0003', 'unassigned', NOW(3)),
('crd-004', '4821 6739 0001 0004', 'unassigned', NOW(3)),
('crd-005', '4821 6739 0001 0005', 'unassigned', NOW(3));


SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- CREDENTIALS SUMMARY
-- =============================================================================
-- /login  (Merchant / Staff Login)
--   Super Admin  → email: metrocouponsys@gmail.com   password: 9029999614
--   Garments     → email: garments@metrocardz.in     password: demo123
--
-- /admin/login  (Deals Admin Panel)
--   Admin        → email: metrocouponsys@gmail.com   password: 9029999614
-- =============================================================================
