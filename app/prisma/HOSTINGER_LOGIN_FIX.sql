-- =============================================================================
-- METRO CARDZ — HOSTINGER LOGIN FIX v2
-- =============================================================================
-- Run this in Hostinger phpMyAdmin:
--   hPanel → Databases → phpMyAdmin → Select u446352478_metrocardz → SQL tab
--
-- PURPOSE: Adds missing columns that were added to the Prisma schema after
-- the tables were originally created. "CREATE TABLE IF NOT EXISTS" does NOT
-- add new columns to existing tables — that requires ALTER TABLE.
--
-- SAFE TO RUN MULTIPLE TIMES — all statements use IF NOT EXISTS / ON DUPLICATE KEY.
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Add `email` column to `merchant_users` (needed for email login)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE `merchant_users`
  ADD COLUMN IF NOT EXISTS `email` VARCHAR(255) NULL AFTER `phone`;

-- Add the unique index separately (safe if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS `merchant_users_email_key`
  ON `merchant_users` (`email`);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add `card_design_url` column to `merchants`
--    (Prisma schema has this — missing from live DB causes 500 on ALL queries
--     that include the merchant relation, including login)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE `merchants`
  ADD COLUMN IF NOT EXISTS `card_design_url` TEXT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add `approval_status` column to `merchants` (if missing)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE `merchants`
  ADD COLUMN IF NOT EXISTS `approval_status`
    ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Add `referral_bonus_points` column to `merchants` (if missing)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE `merchants`
  ADD COLUMN IF NOT EXISTS `referral_bonus_points` DECIMAL(65, 30) NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Ensure `otp_codes` table exists — matches Prisma schema exactly
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `otp_codes` (
    `id`         INT           NOT NULL AUTO_INCREMENT,
    `phone`      VARCHAR(20)   NOT NULL,
    `code`       VARCHAR(10)   NOT NULL,
    `expires_at` DATETIME(3)   NOT NULL,
    `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    PRIMARY KEY (`id`),
    INDEX `otp_codes_phone_idx` (`phone`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add created_at if the table already exists but is missing the column
ALTER TABLE `otp_codes`
  ADD COLUMN IF NOT EXISTS `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Upsert Super Admin account (email + phone login)
--    Email:    metrocouponsys@gmail.com
--    Phone:    9029999614
--    Password: 9029999614
--    Hash:     $2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i
-- ─────────────────────────────────────────────────────────────────────────────
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
    `role`          = 'super_admin',
    `email`         = 'metrocouponsys@gmail.com',
    `password_hash` = '$2b$10$cca8VB.mB9k9CQ3iKzS6eedXyxHCH3KDRcMSIURjPvWBjlonDp85i';

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- VERIFY — run these SELECT statements to confirm the fix worked:
-- =============================================================================
-- 1. Check merchant_users columns:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'merchant_users'
--   ORDER BY ORDINAL_POSITION;
--
-- 2. Check merchants columns:
-- SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
--   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'merchants'
--   ORDER BY ORDINAL_POSITION;
--
-- 3. Confirm super admin exists:
-- SELECT id, name, email, phone, role FROM merchant_users WHERE role = 'super_admin';
-- =============================================================================
