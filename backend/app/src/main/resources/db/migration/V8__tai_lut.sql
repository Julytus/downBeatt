-- =====================================================================
-- Migration V8: Tải LUT và nhật ký tải (download_log)
-- =====================================================================

CREATE TABLE IF NOT EXISTS `download_log` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `lut_id` INT NOT NULL,
  `plan_code` VARCHAR(20) NOT NULL,
  `ip` VARCHAR(45) NULL,
  `created_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_download_log_user` FOREIGN KEY (`user_id`) REFERENCES `user_app` (`id`),
  CONSTRAINT `fk_download_log_lut` FOREIGN KEY (`lut_id`) REFERENCES `lut` (`id`),
  KEY `idx_download_log_user` (`user_id`, `created_time`),
  KEY `idx_download_log_lut` (`lut_id`, `created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
