-- ============================================================================
-- METRO CARDZ — HOSTINGER PHPMYADMIN SQL SCRIPT
-- Purpose: Enable JPG Image uploads (not URLs) for Offers, Rewards, and Deals
-- Type: LONGTEXT (Supports direct JPG photos up to 4GB without truncation)
--
-- Instructions:
--   1. Log in to Hostinger hPanel -> Databases -> Open phpMyAdmin
--   2. Click on your Metro Cardz database name on the left sidebar
--   3. Click on the "SQL" tab in the top navigation
--   4. Paste the queries below and click "Go"
-- ============================================================================

-- 1. Add or modify `image_url` to LONGTEXT on `offer_templates` (Loyalty Offers)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'offer_templates' 
      AND COLUMN_NAME = 'image_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `offer_templates` ADD COLUMN `image_url` LONGTEXT NULL AFTER `description`',
    'ALTER TABLE `offer_templates` MODIFY COLUMN `image_url` LONGTEXT NULL'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. Add or modify `image_url` to LONGTEXT on `reward_catalog` (Loyalty Rewards)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'reward_catalog' 
      AND COLUMN_NAME = 'image_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `reward_catalog` ADD COLUMN `image_url` LONGTEXT NULL AFTER `description`',
    'ALTER TABLE `reward_catalog` MODIFY COLUMN `image_url` LONGTEXT NULL'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 3. Ensure `hero_image_url` is LONGTEXT on `deals_deals` (Metro Cardz GO Deals)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deals_deals' 
      AND COLUMN_NAME = 'hero_image_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `deals_deals` ADD COLUMN `hero_image_url` LONGTEXT NULL AFTER `active`',
    'ALTER TABLE `deals_deals` MODIFY COLUMN `hero_image_url` LONGTEXT NULL'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 4. Ensure `logo_url` is LONGTEXT on `deals_brands` (Metro Cardz GO Brands)
SET @exist_col := (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'deals_brands' 
      AND COLUMN_NAME = 'logo_url'
);

SET @sql_stmt := IF(@exist_col = 0,
    'ALTER TABLE `deals_brands` ADD COLUMN `logo_url` LONGTEXT NULL AFTER `description`',
    'ALTER TABLE `deals_brands` MODIFY COLUMN `logo_url` LONGTEXT NULL'
);
PREPARE stmt FROM @sql_stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verification check query (Shows all 4 columns configured as longtext)
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND (
    (TABLE_NAME = 'offer_templates' AND COLUMN_NAME = 'image_url') OR
    (TABLE_NAME = 'reward_catalog' AND COLUMN_NAME = 'image_url') OR
    (TABLE_NAME = 'deals_deals' AND COLUMN_NAME = 'hero_image_url') OR
    (TABLE_NAME = 'deals_brands' AND COLUMN_NAME = 'logo_url')
  );
