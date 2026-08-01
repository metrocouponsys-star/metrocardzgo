-- ==============================================================================
-- Metro Cardz / WowCard — Hostinger Production MySQL Schema
-- Import this file directly into Hostinger phpMyAdmin (SQL tab)
-- Target: MySQL 5.7+ / 8.0+ / MariaDB 10.3+
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Merchants Table
CREATE TABLE IF NOT EXISTS `merchants` (
  `id` VARCHAR(255) NOT NULL,
  `business_name` TEXT NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `plan_tier` VARCHAR(100) DEFAULT 'pro',
  `whatsapp_number` VARCHAR(50) DEFAULT NULL,
  `logo_url` TEXT DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `secret_salt` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `approval_status` VARCHAR(50) NOT NULL DEFAULT 'approved',
  `referral_bonus_points` DECIMAL(10,2) DEFAULT 50.00,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Merchant Users (Cashiers / Admins)
CREATE TABLE IF NOT EXISTS `merchant_users` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(255) DEFAULT NULL UNIQUE,
  `role` VARCHAR(50) NOT NULL DEFAULT 'staff',
  `password_hash` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_merchant_users_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Membership Types / Tiers
CREATE TABLE IF NOT EXISTS `membership_types` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_membership_types_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Offer Templates
CREATE TABLE IF NOT EXISTS `offer_templates` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `offer_type` VARCHAR(50) NOT NULL,
  `value` DECIMAL(10,2) DEFAULT NULL,
  `active` TINYINT(1) DEFAULT 1,
  `loyalty_points_earn` DECIMAL(10,2) DEFAULT NULL,
  `is_points_redemption` TINYINT(1) NOT NULL DEFAULT 0,
  `loyalty_points_cost` DECIMAL(10,2) DEFAULT NULL,
  `min_visits` INT DEFAULT NULL,
  `min_purchase_amount` DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_offer_templates_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Reminder Rules
CREATE TABLE IF NOT EXISTS `reminder_rules` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `trigger_type` VARCHAR(50) NOT NULL,
  `channel` VARCHAR(50) NOT NULL,
  `template_text` TEXT NOT NULL,
  `threshold_value` DECIMAL(10,2) DEFAULT NULL,
  `active` TINYINT(1) DEFAULT 1,
  `send_time` TIME DEFAULT NULL,
  `days_before` INT NOT NULL DEFAULT 0,
  `timezone` VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reminder_rules_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Membership Type Offers
CREATE TABLE IF NOT EXISTS `membership_type_offers` (
  `membership_type_id` VARCHAR(255) NOT NULL,
  `offer_template_id` VARCHAR(255) NOT NULL,
  `default_qty` DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (`membership_type_id`, `offer_template_id`),
  CONSTRAINT `fk_mto_type` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mto_template` FOREIGN KEY (`offer_template_id`) REFERENCES `offer_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Members
CREATE TABLE IF NOT EXISTS `members` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `member_code` VARCHAR(100) NOT NULL,
  `public_token` VARCHAR(255) NOT NULL UNIQUE,
  `physical_card_number` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) DEFAULT NULL,
  `date_of_birth` DATE DEFAULT NULL,
  `anniversary_date` DATE DEFAULT NULL,
  `membership_type_id` VARCHAR(255) NOT NULL,
  `joined_date` DATE NOT NULL,
  `expiry_date` DATE NOT NULL,
  `loyalty_points` DECIMAL(12,2) DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `total_visits` INT NOT NULL DEFAULT 0,
  `referral_code` VARCHAR(100) DEFAULT NULL UNIQUE,
  `referred_by_member_id` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `auto_renew` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_members_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_type` FOREIGN KEY (`membership_type_id`) REFERENCES `membership_types` (`id`),
  CONSTRAINT `fk_members_referrer` FOREIGN KEY (`referred_by_member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Campaigns
CREATE TABLE IF NOT EXISTS `campaigns` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `target_audience` VARCHAR(50) NOT NULL,
  `target_membership_type_id` VARCHAR(255) DEFAULT NULL,
  `channel` VARCHAR(50) NOT NULL,
  `template_text` TEXT NOT NULL,
  `scheduled_at` DATETIME DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'draft',
  `audience_size` DECIMAL(10,2) DEFAULT 0,
  `sent_count` DECIMAL(10,2) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_campaigns_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_campaigns_type` FOREIGN KEY (`target_membership_type_id`) REFERENCES `membership_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Admin Audit Log
CREATE TABLE IF NOT EXISTS `admin_audit_log` (
  `id` VARCHAR(255) NOT NULL,
  `admin_user_id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) DEFAULT NULL,
  `action` VARCHAR(255) NOT NULL,
  `detail` TEXT DEFAULT NULL,
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_audit_admin` FOREIGN KEY (`admin_user_id`) REFERENCES `merchant_users` (`id`),
  CONSTRAINT `fk_audit_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Member Offer State
CREATE TABLE IF NOT EXISTS `member_offer_state` (
  `id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `offer_template_id` VARCHAR(255) NOT NULL,
  `remaining_qty` DECIMAL(10,2) DEFAULT NULL,
  `initial_qty` DECIMAL(10,2) DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mos_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mos_offer` FOREIGN KEY (`offer_template_id`) REFERENCES `offer_templates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Redemption Log
CREATE TABLE IF NOT EXISTS `redemption_log` (
  `id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `offer_template_id` VARCHAR(255) NOT NULL,
  `merchant_user_id` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(12,2) DEFAULT NULL,
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_redemption_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`),
  CONSTRAINT `fk_redemption_offer` FOREIGN KEY (`offer_template_id`) REFERENCES `offer_templates` (`id`),
  CONSTRAINT `fk_redemption_user` FOREIGN KEY (`merchant_user_id`) REFERENCES `merchant_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Message Log
CREATE TABLE IF NOT EXISTS `message_log` (
  `id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `campaign_id` VARCHAR(255) DEFAULT NULL,
  `reminder_rule_id` VARCHAR(255) DEFAULT NULL,
  `channel` VARCHAR(50) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `sent_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_msg_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_msg_reminder` FOREIGN KEY (`reminder_rule_id`) REFERENCES `reminder_rules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Card Inventory
CREATE TABLE IF NOT EXISTS `card_inventory` (
  `id` VARCHAR(255) NOT NULL,
  `card_number` VARCHAR(100) NOT NULL UNIQUE,
  `status` VARCHAR(50) NOT NULL DEFAULT 'unallocated',
  `allocated_merchant_id` VARCHAR(255) DEFAULT NULL,
  `allocated_at` DATETIME DEFAULT NULL,
  `linked_member_id` VARCHAR(255) DEFAULT NULL,
  `linked_at` DATETIME DEFAULT NULL,
  `created_by_admin_id` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_card_merchant` FOREIGN KEY (`allocated_merchant_id`) REFERENCES `merchants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_card_member` FOREIGN KEY (`linked_member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_card_admin` FOREIGN KEY (`created_by_admin_id`) REFERENCES `merchant_users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Loyalty Transactions
CREATE TABLE IF NOT EXISTS `loyalty_transactions` (
  `id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `points` DECIMAL(12,2) NOT NULL,
  `source_redemption_id` VARCHAR(255) DEFAULT NULL,
  `source_offer_id` VARCHAR(255) DEFAULT NULL,
  `balance_after` DECIMAL(12,2) NOT NULL,
  `note` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_txn_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_txn_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_txn_redemption` FOREIGN KEY (`source_redemption_id`) REFERENCES `redemption_log` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_txn_offer` FOREIGN KEY (`source_offer_id`) REFERENCES `offer_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Reward Catalog
CREATE TABLE IF NOT EXISTS `reward_catalog` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `points_cost` DECIMAL(12,2) NOT NULL,
  `quantity_available` INT DEFAULT 100,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_reward_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Coupon Codes
CREATE TABLE IF NOT EXISTS `coupon_codes` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `code` VARCHAR(100) NOT NULL,
  `discount_type` VARCHAR(50) NOT NULL,
  `value` DECIMAL(12,2) NOT NULL,
  `min_purchase` DECIMAL(12,2) DEFAULT NULL,
  `max_uses` INT DEFAULT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `expires_at` DATE DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `active_days` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_coupon_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Gift Vouchers
CREATE TABLE IF NOT EXISTS `gift_vouchers` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `value` DECIMAL(12,2) NOT NULL,
  `is_redeemed` TINYINT(1) NOT NULL DEFAULT 0,
  `redeemed_by_member_id` VARCHAR(255) DEFAULT NULL,
  `redeemed_at` DATETIME DEFAULT NULL,
  `expires_at` DATE DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_voucher_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_voucher_member` FOREIGN KEY (`redeemed_by_member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Points Rules
CREATE TABLE IF NOT EXISTS `points_rules` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `rule_type` VARCHAR(50) NOT NULL,
  `points_value` DECIMAL(12,2) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `spend_unit` DECIMAL(12,2) DEFAULT 1.00,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_points_rules_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Scratch Cards
CREATE TABLE IF NOT EXISTS `scratch_cards` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `reward_type` VARCHAR(50) NOT NULL,
  `reward_value` TEXT NOT NULL,
  `is_revealed` TINYINT(1) NOT NULL DEFAULT 0,
  `revealed_at` DATETIME DEFAULT NULL,
  `trigger_visit` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_scratch_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scratch_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Lucky Draws
CREATE TABLE IF NOT EXISTS `lucky_draws` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `prize` TEXT NOT NULL,
  `draw_date` DATE NOT NULL,
  `min_points` DECIMAL(12,2) DEFAULT NULL,
  `min_visits` INT DEFAULT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `winner_member_id` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_draw_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_draw_winner` FOREIGN KEY (`winner_member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Member Feedback
CREATE TABLE IF NOT EXISTS `member_feedback` (
  `id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `rating` INT NOT NULL,
  `comment` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_feedback_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_feedback_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 22. Reward Claims
CREATE TABLE IF NOT EXISTS `reward_claims` (
  `id` VARCHAR(255) NOT NULL,
  `reward_id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `points_spent` DECIMAL(12,2) NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_claim_reward` FOREIGN KEY (`reward_id`) REFERENCES `reward_catalog` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_claim_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_claim_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 23. Lucky Draw Entries
CREATE TABLE IF NOT EXISTS `lucky_draw_entries` (
  `id` VARCHAR(255) NOT NULL,
  `draw_id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL,
  `entered_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_entry_draw` FOREIGN KEY (`draw_id`) REFERENCES `lucky_draws` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_entry_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 24. Merchant Wallet Classes
CREATE TABLE IF NOT EXISTS `merchant_wallet_classes` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL UNIQUE,
  `google_class_id` VARCHAR(255) NOT NULL UNIQUE,
  `logo_url` TEXT DEFAULT NULL,
  `background_color` VARCHAR(50) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mwc_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 25. Member Wallet Passes
CREATE TABLE IF NOT EXISTS `member_wallet_passes` (
  `id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) NOT NULL UNIQUE,
  `wallet_class_id` VARCHAR(255) NOT NULL,
  `google_object_id` VARCHAR(255) NOT NULL UNIQUE,
  `status` VARCHAR(50) NOT NULL,
  `last_synced_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_mwp_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_mwp_class` FOREIGN KEY (`wallet_class_id`) REFERENCES `merchant_wallet_classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 26. Idempotency Records
CREATE TABLE IF NOT EXISTS `idempotency_records` (
  `id` VARCHAR(255) NOT NULL,
  `idempotency_key` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `endpoint` VARCHAR(255) NOT NULL,
  `status` VARCHAR(50) NOT NULL,
  `status_code` INT DEFAULT NULL,
  `response_body` TEXT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 27. Event Logs
CREATE TABLE IF NOT EXISTS `event_logs` (
  `id` VARCHAR(255) NOT NULL,
  `merchant_id` VARCHAR(255) NOT NULL,
  `member_id` VARCHAR(255) DEFAULT NULL,
  `event_type` VARCHAR(100) NOT NULL,
  `payload` JSON NOT NULL,
  `actor_id` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_event_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_event_member` FOREIGN KEY (`member_id`) REFERENCES `members` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
