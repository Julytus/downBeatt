-- =====================================================================
-- Migration V7: Gói và thanh toán payOS (plan, payment_order, subscription)
-- =====================================================================

CREATE TABLE IF NOT EXISTS `plan` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `name` VARCHAR(50) NOT NULL,
  `audience` VARCHAR(100) NOT NULL,
  `monthly_price` BIGINT NOT NULL,
  `yearly_monthly_price` BIGINT NOT NULL,
  `can_download_premium` TINYINT NOT NULL,
  `max_members` INT NOT NULL,
  `license` JSON NOT NULL,
  `features` JSON NOT NULL,
  `is_highlight` TINYINT NOT NULL DEFAULT 0,
  `sort_order` INT NOT NULL,
  `active` TINYINT NOT NULL DEFAULT 1,
  `created_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `payment_order` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `payos_order_code` BIGINT NOT NULL UNIQUE,
  `user_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `cycle` VARCHAR(10) NOT NULL,
  `amount` BIGINT NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `payos_payment_link_id` VARCHAR(100) NULL,
  `checkout_url` VARCHAR(500) NULL,
  `payos_reference` VARCHAR(100) NULL,
  `webhook_payload` JSON NULL,
  `source_lut_id` INT NULL,
  `paid_time` DATETIME NULL,
  `created_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payment_order_user` FOREIGN KEY (`user_id`) REFERENCES `user_app` (`id`),
  CONSTRAINT `fk_payment_order_plan` FOREIGN KEY (`plan_id`) REFERENCES `plan` (`id`),
  CONSTRAINT `fk_payment_order_lut` FOREIGN KEY (`source_lut_id`) REFERENCES `lut` (`id`) ON DELETE SET NULL,
  KEY `idx_payment_order_user_created` (`user_id`, `created_time`),
  KEY `idx_payment_order_status_created` (`status`, `created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `subscription` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `plan_id` INT NOT NULL,
  `order_id` INT NOT NULL,
  `cycle` VARCHAR(10) NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `auto_renew` TINYINT NOT NULL DEFAULT 1,
  `active_user_id` INT GENERATED ALWAYS AS (IF(`status` = 'ACTIVE', `user_id`, NULL)) STORED,
  `created_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_subscription_user` FOREIGN KEY (`user_id`) REFERENCES `user_app` (`id`),
  CONSTRAINT `fk_subscription_plan` FOREIGN KEY (`plan_id`) REFERENCES `plan` (`id`),
  CONSTRAINT `fk_subscription_order` FOREIGN KEY (`order_id`) REFERENCES `payment_order` (`id`),
  UNIQUE KEY `uq_subscription_active_user` (`active_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed 3 gói dịch vụ
INSERT INTO `plan` (`code`, `name`, `audience`, `monthly_price`, `yearly_monthly_price`, `can_download_premium`, `max_members`, `is_highlight`, `sort_order`, `active`, `license`, `features`)
SELECT 'free', 'Miễn phí', 'Cá nhân mới bắt đầu', 0, 0, 0, 1, 0, 1, 1,
       '["Video cá nhân trên kênh của bạn"]',
       '["Tải không giới hạn LUT miễn phí", "File .cube cho mọi phần mềm", "So sánh ảnh trước / sau khi áp LUT"]'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `plan` WHERE `code` = 'free');

INSERT INTO `plan` (`code`, `name`, `audience`, `monthly_price`, `yearly_monthly_price`, `can_download_premium`, `max_members`, `is_highlight`, `sort_order`, `active`, `license`, `features`)
SELECT 'pro', 'Pro', 'Nhà sáng tạo & freelancer', 99000, 79000, 1, 1, 1, 2, 1,
       '["Cá nhân & freelancer", "Dự án cho khách hàng", "Quảng cáo trên mạng xã hội"]',
       '["Mọi LUT miễn phí", "Toàn bộ LUT Premium", "LUT mới mỗi tuần", "Bộ sưu tập không giới hạn"]'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `plan` WHERE `code` = 'pro');

INSERT INTO `plan` (`code`, `name`, `audience`, `monthly_price`, `yearly_monthly_price`, `can_download_premium`, `max_members`, `is_highlight`, `sort_order`, `active`, `license`, `features`)
SELECT 'studio', 'Studio', 'Studio, agency & đội nhóm', 249000, 199000, 1, 5, 0, 3, 1,
       '["Đội nhóm tới 5 thành viên", "Khách hàng doanh nghiệp", "Truyền hình & quảng cáo trả phí"]',
       '["Mọi quyền lợi của Pro", "5 tài khoản thành viên", "Xuất hoá đơn VAT", "Hỗ trợ ưu tiên"]'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `plan` WHERE `code` = 'studio');
