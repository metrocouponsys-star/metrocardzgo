-- ============================================================================
-- METRO CARDZ — HOSTINGER PHPMYADMIN SQL SCRIPT
-- Purpose: Enable image uploads for Offers, Rewards, and GO Deals in MySQL
-- Instructions:
--   1. Log in to Hostinger hPanel -> Databases -> Open phpMyAdmin
--   2. Click on your Metro Cardz database name on the left sidebar
--   3. Click on the "SQL" tab in the top navigation
--   4. Paste the queries below and click "Go"
-- ============================================================================

-- 1. Add `image_url` to `offer_templates` (for Merchant Loyalty Offers)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'offer_templates' 
      AND COLUMN_NAME = 'image_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `offer_templates` ADD COLUMN `image_url` TEXT NULL AFTER `description`',
    'SELECT "image_url already exists in offer_templates" AS status'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Add `image_url` to `reward_catalog` (for Merchant Loyalty Rewards)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reward_catalog' 
      AND COLUMN_NAME = 'image_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `reward_catalog` ADD COLUMN `image_url` TEXT NULL AFTER `description`',
    'SELECT "image_url already exists in reward_catalog" AS status'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 3. Ensure `hero_image_url` exists in `deals_deals` (for Metro Cardz GO Deals)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deals_deals' 
      AND COLUMN_NAME = 'hero_image_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `deals_deals` ADD COLUMN `hero_image_url` TEXT NULL AFTER `active`',
    'SELECT "hero_image_url already exists in deals_deals" AS status'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 4. Ensure `logo_url` exists in `deals_brands` (for Metro Cardz GO Brand Logos)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deals_brands' 
      AND COLUMN_NAME = 'logo_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `deals_brands` ADD COLUMN `logo_url` TEXT NULL AFTER `description`',
    'SELECT "logo_url already exists in deals_brands" AS status'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification check query
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND (
    (TABLE_NAME = 'offer_templates' AND COLUMN_NAME = 'image_url') OR
    (TABLE_NAME = 'reward_catalog' AND COLUMN_NAME = 'image_url') OR
    (TABLE_NAME = 'deals_deals' AND COLUMN_NAME = 'hero_image_url') OR
    (TABLE_NAME = 'deals_brands' AND COLUMN_NAME = 'logo_url')
  );
