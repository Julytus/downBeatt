-- =====================================================================
-- Migration V9: Bộ sưu tập (collection, collection_item)
-- =====================================================================

CREATE TABLE IF NOT EXISTS `collection` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL COLLATE utf8mb4_0900_as_ci,
  `created_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_collection_user` FOREIGN KEY (`user_id`) REFERENCES `user_app` (`id`) ON DELETE CASCADE,
  CONSTRAINT `uq_collection_user_name` UNIQUE (`user_id`, `name`),
  KEY `idx_collection_user` (`user_id`, `updated_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `collection_item` (
  `collection_id` INT NOT NULL,
  `lut_id` INT NOT NULL,
  `created_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`collection_id`, `lut_id`),
  CONSTRAINT `fk_collection_item_collection` FOREIGN KEY (`collection_id`) REFERENCES `collection` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collection_item_lut` FOREIGN KEY (`lut_id`) REFERENCES `lut` (`id`) ON DELETE CASCADE,
  KEY `idx_collection_item_lut` (`lut_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
