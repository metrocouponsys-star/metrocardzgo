-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE IF NOT EXISTS `membership_types` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,

    INDEX `membership_types_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `offer_templates` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `offer_type` ENUM('percent_off', 'flat_off', 'buy_1_get_1', 'free_service', 'wallet_points', 'referral', 'birthday', 'points_redemption', 'visit_milestone') NOT NULL,
    `value` DECIMAL(65, 30) NULL DEFAULT 0,
    `active` BOOLEAN NULL DEFAULT true,
    `loyalty_points_earn` DECIMAL(65, 30) NULL,
    `is_points_redemption` BOOLEAN NOT NULL DEFAULT false,
    `loyalty_points_cost` DECIMAL(65, 30) NULL,
    `min_visits` INTEGER NULL,
    `min_purchase_amount` DECIMAL(65, 30) NULL,

    INDEX `offer_templates_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `membership_type_offers` (
    `membership_type_id` VARCHAR(36) NOT NULL,
    `offer_template_id` VARCHAR(36) NOT NULL,
    `default_qty` DECIMAL(65, 30) NULL,

    PRIMARY KEY (`membership_type_id`, `offer_template_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `members` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `member_code` VARCHAR(50) NOT NULL,
    `public_token` VARCHAR(100) NOT NULL,
    `physical_card_number` VARCHAR(30) NULL,
    `name` VARCHAR(200) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `date_of_birth` DATE NULL,
    `anniversary_date` DATE NULL,
    `family_dob_1` DATE NULL,
    `family_dob_2` DATE NULL,
    `family_dob_3` DATE NULL,
    `membership_type_id` VARCHAR(36) NOT NULL,
    `joined_date` DATE NOT NULL,
    `expiry_date` DATE NOT NULL,
    `loyalty_points` DECIMAL(65, 30) NULL DEFAULT 0,
    `status` ENUM('active', 'expiring_soon', 'expired', 'deactivated') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `total_visits` INTEGER NOT NULL DEFAULT 0,
    `referral_code` VARCHAR(20) NULL,
    `referred_by_member_id` VARCHAR(36) NULL,
    `auto_renew` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `members_public_token_key`(`public_token`),
    UNIQUE INDEX `members_referral_code_key`(`referral_code`),
    INDEX `members_merchant_id_idx`(`merchant_id`),
    INDEX `members_membership_type_id_idx`(`membership_type_id`),
    INDEX `members_phone_idx`(`phone`(20)),
    INDEX `members_public_token_idx`(`public_token`(100)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `member_offer_state` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `offer_template_id` VARCHAR(36) NOT NULL,
    `remaining_qty` DECIMAL(65, 30) NULL,
    `initial_qty` DECIMAL(65, 30) NULL,
    `status` ENUM('active', 'exhausted') NOT NULL DEFAULT 'active',

    INDEX `member_offer_state_member_id_idx`(`member_id`),
    INDEX `member_offer_state_offer_template_id_idx`(`offer_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `redemption_log` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `offer_template_id` VARCHAR(36) NOT NULL,
    `merchant_user_id` VARCHAR(36) NOT NULL,
    `amount` DECIMAL(65, 30) NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `redemption_log_member_id_idx`(`member_id`),
    INDEX `redemption_log_offer_template_id_idx`(`offer_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `reminder_rules` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `trigger_type` ENUM('birthday', 'anniversary', 'loyalty_threshold', 'expiry') NOT NULL,
    `channel` ENUM('sms', 'whatsapp') NOT NULL,
    `template_text` TEXT NOT NULL,
    `threshold_value` DECIMAL(65, 30) NULL,
    `active` BOOLEAN NULL DEFAULT true,
    `send_time` VARCHAR(8) NULL,
    `days_before` INTEGER NOT NULL DEFAULT 0,
    `timezone` VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',

    INDEX `reminder_rules_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `campaigns` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `target_audience` ENUM('all', 'by_membership_type', 'expiring_soon') NOT NULL,
    `target_membership_type_id` VARCHAR(36) NULL,
    `channel` ENUM('sms', 'whatsapp') NOT NULL,
    `template_text` TEXT NOT NULL,
    `scheduled_at` DATETIME(3) NULL,
    `status` ENUM('draft', 'scheduled', 'sending', 'sent') NOT NULL DEFAULT 'draft',
    `audience_size` DECIMAL(65, 30) NULL,
    `sent_count` DECIMAL(65, 30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `campaigns_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `message_log` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `campaign_id` VARCHAR(36) NULL,
    `reminder_rule_id` VARCHAR(36) NULL,
    `channel` VARCHAR(20) NOT NULL,
    `status` ENUM('sent', 'failed', 'delivered') NOT NULL DEFAULT 'sent',
    `sent_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `message_log_member_id_idx`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `admin_audit_log` (
    `id` VARCHAR(36) NOT NULL,
    `admin_user_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `detail` TEXT NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_audit_log_admin_user_id_idx`(`admin_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
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

-- CreateTable
CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `type` ENUM('earn', 'redeem', 'referral_bonus') NOT NULL,
    `points` DECIMAL(65, 30) NOT NULL,
    `source_redemption_id` VARCHAR(36) NULL,
    `source_offer_id` VARCHAR(36) NULL,
    `balance_after` DECIMAL(65, 30) NOT NULL,
    `note` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `loyalty_transactions_source_redemption_id_key`(`source_redemption_id`),
    INDEX `loyalty_transactions_member_id_idx`(`member_id`),
    INDEX `loyalty_transactions_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `reward_catalog` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `description` TEXT NULL,
    `points_cost` DECIMAL(65, 30) NOT NULL,
    `quantity_available` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reward_catalog_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `reward_claims` (
    `id` VARCHAR(36) NOT NULL,
    `reward_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `points_spent` DECIMAL(65, 30) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reward_claims_member_id_idx`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `coupon_codes` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `discount_type` VARCHAR(20) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `min_purchase` DECIMAL(65, 30) NULL DEFAULT 0,
    `max_uses` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `expires_at` DATE NULL,
    `active_days` VARCHAR(100) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `coupon_codes_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `gift_vouchers` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `is_redeemed` BOOLEAN NOT NULL DEFAULT false,
    `redeemed_by_member_id` VARCHAR(36) NULL,
    `redeemed_at` DATETIME(3) NULL,
    `expires_at` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `gift_vouchers_code_key`(`code`),
    INDEX `gift_vouchers_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `points_rules` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `rule_type` VARCHAR(50) NOT NULL,
    `points_value` DECIMAL(65, 30) NOT NULL,
    `spend_unit` DECIMAL(65, 30) NULL DEFAULT 1,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `points_rules_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `scratch_cards` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `reward_type` VARCHAR(30) NOT NULL,
    `reward_value` VARCHAR(500) NOT NULL,
    `is_revealed` BOOLEAN NOT NULL DEFAULT false,
    `revealed_at` DATETIME(3) NULL,
    `trigger_visit` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `scratch_cards_member_id_idx`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `lucky_draws` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(500) NOT NULL,
    `prize` VARCHAR(500) NOT NULL,
    `prizes` JSON NULL,
    `draw_date` DATE NOT NULL,
    `min_points` DECIMAL(65, 30) NULL DEFAULT 0,
    `min_visits` INTEGER NULL DEFAULT 0,
    `status` VARCHAR(20) NOT NULL DEFAULT 'open',
    `winner_member_id` VARCHAR(36) NULL,
    `winner_member_ids` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lucky_draws_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `lucky_draw_entries` (
    `id` VARCHAR(36) NOT NULL,
    `draw_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `entered_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `lucky_draw_entries_draw_id_idx`(`draw_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `member_feedback` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `member_feedback_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `merchant_wallet_classes` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `google_class_id` VARCHAR(255) NOT NULL,
    `logo_url` TEXT NULL,
    `background_color` VARCHAR(20) NULL DEFAULT '#1A1A1A',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    UNIQUE INDEX `merchant_wallet_classes_merchant_id_key`(`merchant_id`),
    UNIQUE INDEX `merchant_wallet_classes_google_class_id_key`(`google_class_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `member_wallet_passes` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `wallet_class_id` VARCHAR(36) NOT NULL,
    `google_object_id` VARCHAR(255) NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'not_added',
    `last_synced_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `member_wallet_passes_member_id_key`(`member_id`),
    UNIQUE INDEX `member_wallet_passes_google_object_id_key`(`google_object_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `idempotency_records` (
    `id` VARCHAR(36) NOT NULL,
    `idempotency_key` VARCHAR(255) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `endpoint` VARCHAR(255) NOT NULL,
    `status` VARCHAR(20) NOT NULL,
    `status_code` INTEGER NULL,
    `response_body` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expires_at` DATETIME(3) NULL,

    INDEX `idempotency_records_idempotency_key_merchant_id_idx`(`idempotency_key`, `merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `event_logs` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NULL,
    `event_type` VARCHAR(100) NOT NULL,
    `payload` JSON NOT NULL,
    `actor_id` VARCHAR(36) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `event_logs_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `otp_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `otp_codes_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `deals_categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `icon` VARCHAR(20) NULL,

    UNIQUE INDEX `deals_categories_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `deals_cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `deals_cities_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `deals_brands` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `category_id` INTEGER NOT NULL,
    `city_id` INTEGER NOT NULL,
    `description` TEXT NULL,
    `logo_url` TEXT NULL,
    `website` TEXT NULL,
    `instagram` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `maps_url` TEXT NULL,
    `partner_status` ENUM('public_link', 'affiliate', 'authorised_partner', 'direct_merchant') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `deals_brands_category_id_idx`(`category_id`),
    INDEX `deals_brands_city_id_idx`(`city_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `deals_deals` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brand_id` INTEGER NOT NULL,
    `offer_title` VARCHAR(500) NOT NULL,
    `offer_percentage` INTEGER NULL,
    `offer_type` VARCHAR(30) NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `end_date` DATETIME(3) NOT NULL,
    `booking_url` TEXT NULL,
    `affiliate_url` TEXT NULL,
    `terms` TEXT NULL,
    `last_verified_date` DATETIME(3) NOT NULL,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `hero_image_url` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `deals_deals_brand_id_idx`(`brand_id`),
    INDEX `deals_deals_active_featured_idx`(`active`, `featured`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `deals_admin_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` TEXT NOT NULL,
    `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `deals_admin_users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `deals_click_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `deal_id` INTEGER NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `referrer` TEXT NULL,
    `user_agent` TEXT NULL,

    INDEX `deals_click_log_deal_id_idx`(`deal_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `tier_configs` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(50) NOT NULL,
    `color_hex` VARCHAR(7) NULL,
    `icon` VARCHAR(50) NULL,
    `min_points` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `min_visits` INTEGER NULL,
    `bonus_points_multiplier` DECIMAL(5, 2) NOT NULL DEFAULT 1.0,
    `benefits` JSON NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `tier_configs_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `member_tiers` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `tier_config_id` VARCHAR(36) NULL,
    `tier_name` VARCHAR(100) NOT NULL DEFAULT 'Bronze',
    `tier_slug` VARCHAR(50) NOT NULL DEFAULT 'bronze',
    `next_tier_points_needed` DECIMAL(10, 2) NULL,
    `achieved_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `member_tiers_member_id_key`(`member_id`),
    INDEX `member_tiers_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `visit_streaks` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `current_streak` INTEGER NOT NULL DEFAULT 0,
    `longest_streak` INTEGER NOT NULL DEFAULT 0,
    `last_visit_week` VARCHAR(10) NULL,
    `streak_broken_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `visit_streaks_merchant_id_idx`(`merchant_id`),
    UNIQUE INDEX `visit_streaks_member_id_merchant_id_key`(`member_id`, `merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `challenges` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(500) NOT NULL,
    `description` TEXT NOT NULL,
    `challenge_type` VARCHAR(50) NOT NULL,
    `target_value` DECIMAL(10, 2) NOT NULL,
    `reward_type` VARCHAR(50) NOT NULL DEFAULT 'points',
    `reward_value` DECIMAL(10, 2) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `image_url` TEXT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `challenges_merchant_id_is_active_idx`(`merchant_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `challenge_progress` (
    `id` VARCHAR(36) NOT NULL,
    `challenge_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `current_value` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `is_completed` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` DATETIME(3) NULL,
    `reward_issued` BOOLEAN NOT NULL DEFAULT false,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `challenge_progress_member_id_idx`(`member_id`),
    UNIQUE INDEX `challenge_progress_challenge_id_member_id_key`(`challenge_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `points_expiry_rules` (
    `id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `inactivity_days` INTEGER NOT NULL DEFAULT 180,
    `warning_days_before` INTEGER NOT NULL DEFAULT 30,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `points_expiry_rules_merchant_id_key`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `member_reviews` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `redemption_id` VARCHAR(36) NULL,
    `rating` INTEGER NOT NULL,
    `comment` TEXT NULL,
    `points_earned` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `member_reviews_merchant_id_is_visible_idx`(`merchant_id`, `is_visible`),
    INDEX `member_reviews_member_id_idx`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `member_consents` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `purpose` VARCHAR(50) NOT NULL,
    `granted` BOOLEAN NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `user_agent` TEXT NULL,
    `policy_version` VARCHAR(20) NOT NULL DEFAULT 'v1.0',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `member_consents_member_id_purpose_idx`(`member_id`, `purpose`),
    INDEX `member_consents_merchant_id_idx`(`merchant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `pii_access_log` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `access_reason` VARCHAR(100) NOT NULL,
    `fields_accessed` VARCHAR(500) NOT NULL,
    `performed_by` VARCHAR(100) NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `pii_access_log_member_id_idx`(`member_id`),
    INDEX `pii_access_log_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `erasure_requests` (
    `id` VARCHAR(50) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reason` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `processed_at` DATETIME(3) NULL,
    `processed_by` VARCHAR(100) NULL,
    `rejection_reason` TEXT NULL,
    `anonymised_fields` TEXT NULL,

    INDEX `erasure_requests_member_id_idx`(`member_id`),
    INDEX `erasure_requests_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `correction_requests` (
    `id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `merchant_id` VARCHAR(36) NOT NULL,
    `field` VARCHAR(50) NOT NULL,
    `new_value_encrypted` TEXT NULL,
    `reason` TEXT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `resolved_at` DATETIME(3) NULL,

    INDEX `correction_requests_member_id_idx`(`member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `merchant_users` DROP FOREIGN KEY IF EXISTS `merchant_users_merchant_id_fkey`;
ALTER TABLE `merchant_users` ADD CONSTRAINT `merchant_users_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_types` DROP FOREIGN KEY IF EXISTS `membership_types_merchant_id_fkey`;
ALTER TABLE `membership_types` ADD CONSTRAINT `membership_types_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `offer_templates` DROP FOREIGN KEY IF EXISTS `offer_templates_merchant_id_fkey`;
ALTER TABLE `offer_templates` ADD CONSTRAINT `offer_templates_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_type_offers` DROP FOREIGN KEY IF EXISTS `membership_type_offers_membership_type_id_fkey`;
ALTER TABLE `membership_type_offers` ADD CONSTRAINT `membership_type_offers_membership_type_id_fkey` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_type_offers` DROP FOREIGN KEY IF EXISTS `membership_type_offers_offer_template_id_fkey`;
ALTER TABLE `membership_type_offers` ADD CONSTRAINT `membership_type_offers_offer_template_id_fkey` FOREIGN KEY (`offer_template_id`) REFERENCES `offer_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` DROP FOREIGN KEY IF EXISTS `members_merchant_id_fkey`;
ALTER TABLE `members` ADD CONSTRAINT `members_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` DROP FOREIGN KEY IF EXISTS `members_membership_type_id_fkey`;
ALTER TABLE `members` ADD CONSTRAINT `members_membership_type_id_fkey` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `members` DROP FOREIGN KEY IF EXISTS `members_referred_by_member_id_fkey`;
ALTER TABLE `members` ADD CONSTRAINT `members_referred_by_member_id_fkey` FOREIGN KEY (`referred_by_member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_offer_state` DROP FOREIGN KEY IF EXISTS `member_offer_state_member_id_fkey`;
ALTER TABLE `member_offer_state` ADD CONSTRAINT `member_offer_state_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_offer_state` DROP FOREIGN KEY IF EXISTS `member_offer_state_offer_template_id_fkey`;
ALTER TABLE `member_offer_state` ADD CONSTRAINT `member_offer_state_offer_template_id_fkey` FOREIGN KEY (`offer_template_id`) REFERENCES `offer_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_log` DROP FOREIGN KEY IF EXISTS `redemption_log_member_id_fkey`;
ALTER TABLE `redemption_log` ADD CONSTRAINT `redemption_log_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_log` DROP FOREIGN KEY IF EXISTS `redemption_log_offer_template_id_fkey`;
ALTER TABLE `redemption_log` ADD CONSTRAINT `redemption_log_offer_template_id_fkey` FOREIGN KEY (`offer_template_id`) REFERENCES `offer_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redemption_log` DROP FOREIGN KEY IF EXISTS `redemption_log_merchant_user_id_fkey`;
ALTER TABLE `redemption_log` ADD CONSTRAINT `redemption_log_merchant_user_id_fkey` FOREIGN KEY (`merchant_user_id`) REFERENCES `merchant_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminder_rules` DROP FOREIGN KEY IF EXISTS `reminder_rules_merchant_id_fkey`;
ALTER TABLE `reminder_rules` ADD CONSTRAINT `reminder_rules_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` DROP FOREIGN KEY IF EXISTS `campaigns_merchant_id_fkey`;
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` DROP FOREIGN KEY IF EXISTS `campaigns_target_membership_type_id_fkey`;
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_target_membership_type_id_fkey` FOREIGN KEY (`target_membership_type_id`) REFERENCES `membership_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_log` DROP FOREIGN KEY IF EXISTS `message_log_member_id_fkey`;
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_log` DROP FOREIGN KEY IF EXISTS `message_log_campaign_id_fkey`;
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_log` DROP FOREIGN KEY IF EXISTS `message_log_reminder_rule_id_fkey`;
ALTER TABLE `message_log` ADD CONSTRAINT `message_log_reminder_rule_id_fkey` FOREIGN KEY (`reminder_rule_id`) REFERENCES `reminder_rules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_log` DROP FOREIGN KEY IF EXISTS `admin_audit_log_admin_user_id_fkey`;
ALTER TABLE `admin_audit_log` ADD CONSTRAINT `admin_audit_log_admin_user_id_fkey` FOREIGN KEY (`admin_user_id`) REFERENCES `merchant_users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `admin_audit_log` DROP FOREIGN KEY IF EXISTS `admin_audit_log_merchant_id_fkey`;
ALTER TABLE `admin_audit_log` ADD CONSTRAINT `admin_audit_log_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_inventory` DROP FOREIGN KEY IF EXISTS `card_inventory_allocated_merchant_id_fkey`;
ALTER TABLE `card_inventory` ADD CONSTRAINT `card_inventory_allocated_merchant_id_fkey` FOREIGN KEY (`allocated_merchant_id`) REFERENCES `merchants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_inventory` DROP FOREIGN KEY IF EXISTS `card_inventory_linked_member_id_fkey`;
ALTER TABLE `card_inventory` ADD CONSTRAINT `card_inventory_linked_member_id_fkey` FOREIGN KEY (`linked_member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `card_inventory` DROP FOREIGN KEY IF EXISTS `card_inventory_created_by_admin_id_fkey`;
ALTER TABLE `card_inventory` ADD CONSTRAINT `card_inventory_created_by_admin_id_fkey` FOREIGN KEY (`created_by_admin_id`) REFERENCES `merchant_users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` DROP FOREIGN KEY IF EXISTS `loyalty_transactions_member_id_fkey`;
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` DROP FOREIGN KEY IF EXISTS `loyalty_transactions_merchant_id_fkey`;
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` DROP FOREIGN KEY IF EXISTS `loyalty_transactions_source_redemption_id_fkey`;
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_source_redemption_id_fkey` FOREIGN KEY (`source_redemption_id`) REFERENCES `redemption_log`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `loyalty_transactions` DROP FOREIGN KEY IF EXISTS `loyalty_transactions_source_offer_id_fkey`;
ALTER TABLE `loyalty_transactions` ADD CONSTRAINT `loyalty_transactions_source_offer_id_fkey` FOREIGN KEY (`source_offer_id`) REFERENCES `offer_templates`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_catalog` DROP FOREIGN KEY IF EXISTS `reward_catalog_merchant_id_fkey`;
ALTER TABLE `reward_catalog` ADD CONSTRAINT `reward_catalog_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_claims` DROP FOREIGN KEY IF EXISTS `reward_claims_reward_id_fkey`;
ALTER TABLE `reward_claims` ADD CONSTRAINT `reward_claims_reward_id_fkey` FOREIGN KEY (`reward_id`) REFERENCES `reward_catalog`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_claims` DROP FOREIGN KEY IF EXISTS `reward_claims_member_id_fkey`;
ALTER TABLE `reward_claims` ADD CONSTRAINT `reward_claims_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_claims` DROP FOREIGN KEY IF EXISTS `reward_claims_merchant_id_fkey`;
ALTER TABLE `reward_claims` ADD CONSTRAINT `reward_claims_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coupon_codes` DROP FOREIGN KEY IF EXISTS `coupon_codes_merchant_id_fkey`;
ALTER TABLE `coupon_codes` ADD CONSTRAINT `coupon_codes_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_vouchers` DROP FOREIGN KEY IF EXISTS `gift_vouchers_merchant_id_fkey`;
ALTER TABLE `gift_vouchers` ADD CONSTRAINT `gift_vouchers_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gift_vouchers` DROP FOREIGN KEY IF EXISTS `gift_vouchers_redeemed_by_member_id_fkey`;
ALTER TABLE `gift_vouchers` ADD CONSTRAINT `gift_vouchers_redeemed_by_member_id_fkey` FOREIGN KEY (`redeemed_by_member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `points_rules` DROP FOREIGN KEY IF EXISTS `points_rules_merchant_id_fkey`;
ALTER TABLE `points_rules` ADD CONSTRAINT `points_rules_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scratch_cards` DROP FOREIGN KEY IF EXISTS `scratch_cards_merchant_id_fkey`;
ALTER TABLE `scratch_cards` ADD CONSTRAINT `scratch_cards_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `scratch_cards` DROP FOREIGN KEY IF EXISTS `scratch_cards_member_id_fkey`;
ALTER TABLE `scratch_cards` ADD CONSTRAINT `scratch_cards_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lucky_draws` DROP FOREIGN KEY IF EXISTS `lucky_draws_merchant_id_fkey`;
ALTER TABLE `lucky_draws` ADD CONSTRAINT `lucky_draws_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lucky_draws` DROP FOREIGN KEY IF EXISTS `lucky_draws_winner_member_id_fkey`;
ALTER TABLE `lucky_draws` ADD CONSTRAINT `lucky_draws_winner_member_id_fkey` FOREIGN KEY (`winner_member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lucky_draw_entries` DROP FOREIGN KEY IF EXISTS `lucky_draw_entries_draw_id_fkey`;
ALTER TABLE `lucky_draw_entries` ADD CONSTRAINT `lucky_draw_entries_draw_id_fkey` FOREIGN KEY (`draw_id`) REFERENCES `lucky_draws`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `lucky_draw_entries` DROP FOREIGN KEY IF EXISTS `lucky_draw_entries_member_id_fkey`;
ALTER TABLE `lucky_draw_entries` ADD CONSTRAINT `lucky_draw_entries_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_feedback` DROP FOREIGN KEY IF EXISTS `member_feedback_member_id_fkey`;
ALTER TABLE `member_feedback` ADD CONSTRAINT `member_feedback_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_feedback` DROP FOREIGN KEY IF EXISTS `member_feedback_merchant_id_fkey`;
ALTER TABLE `member_feedback` ADD CONSTRAINT `member_feedback_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `merchant_wallet_classes` DROP FOREIGN KEY IF EXISTS `merchant_wallet_classes_merchant_id_fkey`;
ALTER TABLE `merchant_wallet_classes` ADD CONSTRAINT `merchant_wallet_classes_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_wallet_passes` DROP FOREIGN KEY IF EXISTS `member_wallet_passes_member_id_fkey`;
ALTER TABLE `member_wallet_passes` ADD CONSTRAINT `member_wallet_passes_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_wallet_passes` DROP FOREIGN KEY IF EXISTS `member_wallet_passes_wallet_class_id_fkey`;
ALTER TABLE `member_wallet_passes` ADD CONSTRAINT `member_wallet_passes_wallet_class_id_fkey` FOREIGN KEY (`wallet_class_id`) REFERENCES `merchant_wallet_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_logs` DROP FOREIGN KEY IF EXISTS `event_logs_merchant_id_fkey`;
ALTER TABLE `event_logs` ADD CONSTRAINT `event_logs_merchant_id_fkey` FOREIGN KEY (`merchant_id`) REFERENCES `merchants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_logs` DROP FOREIGN KEY IF EXISTS `event_logs_member_id_fkey`;
ALTER TABLE `event_logs` ADD CONSTRAINT `event_logs_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals_brands` DROP FOREIGN KEY IF EXISTS `deals_brands_category_id_fkey`;
ALTER TABLE `deals_brands` ADD CONSTRAINT `deals_brands_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `deals_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals_brands` DROP FOREIGN KEY IF EXISTS `deals_brands_city_id_fkey`;
ALTER TABLE `deals_brands` ADD CONSTRAINT `deals_brands_city_id_fkey` FOREIGN KEY (`city_id`) REFERENCES `deals_cities`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals_deals` DROP FOREIGN KEY IF EXISTS `deals_deals_brand_id_fkey`;
ALTER TABLE `deals_deals` ADD CONSTRAINT `deals_deals_brand_id_fkey` FOREIGN KEY (`brand_id`) REFERENCES `deals_brands`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deals_click_log` DROP FOREIGN KEY IF EXISTS `deals_click_log_deal_id_fkey`;
ALTER TABLE `deals_click_log` ADD CONSTRAINT `deals_click_log_deal_id_fkey` FOREIGN KEY (`deal_id`) REFERENCES `deals_deals`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_tiers` DROP FOREIGN KEY IF EXISTS `member_tiers_member_id_fkey`;
ALTER TABLE `member_tiers` ADD CONSTRAINT `member_tiers_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_tiers` DROP FOREIGN KEY IF EXISTS `member_tiers_tier_config_id_fkey`;
ALTER TABLE `member_tiers` ADD CONSTRAINT `member_tiers_tier_config_id_fkey` FOREIGN KEY (`tier_config_id`) REFERENCES `tier_configs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `visit_streaks` DROP FOREIGN KEY IF EXISTS `visit_streaks_member_id_fkey`;
ALTER TABLE `visit_streaks` ADD CONSTRAINT `visit_streaks_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_progress` DROP FOREIGN KEY IF EXISTS `challenge_progress_challenge_id_fkey`;
ALTER TABLE `challenge_progress` ADD CONSTRAINT `challenge_progress_challenge_id_fkey` FOREIGN KEY (`challenge_id`) REFERENCES `challenges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `challenge_progress` DROP FOREIGN KEY IF EXISTS `challenge_progress_member_id_fkey`;
ALTER TABLE `challenge_progress` ADD CONSTRAINT `challenge_progress_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_reviews` DROP FOREIGN KEY IF EXISTS `member_reviews_member_id_fkey`;
ALTER TABLE `member_reviews` ADD CONSTRAINT `member_reviews_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_consents` DROP FOREIGN KEY IF EXISTS `member_consents_member_id_fkey`;
ALTER TABLE `member_consents` ADD CONSTRAINT `member_consents_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `erasure_requests` DROP FOREIGN KEY IF EXISTS `erasure_requests_member_id_fkey`;
ALTER TABLE `erasure_requests` ADD CONSTRAINT `erasure_requests_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `correction_requests` DROP FOREIGN KEY IF EXISTS `correction_requests_member_id_fkey`;
ALTER TABLE `correction_requests` ADD CONSTRAINT `correction_requests_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;


