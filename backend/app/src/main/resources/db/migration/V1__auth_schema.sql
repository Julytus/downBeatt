-- =====================================================================
-- V1: schema đăng nhập + phân quyền (module, resource, role, permission, user_app).
-- Một doanh nghiệp duy nhất: không có bảng branch / cột bsn_id.
-- KHÔNG sửa file migration đã chạy — đổi schema bằng file V<n+1>__<mô_tả>.sql mới.
-- =====================================================================
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `module` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(300) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `active` int DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_code_uindex` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tài nguyên được phân quyền; `uri` khớp hằng URI trong controller (vd '/store/')
CREATE TABLE IF NOT EXISTS `resource` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(300) DEFAULT NULL,
  `description` varchar(300) DEFAULT NULL,
  `code` varchar(100) DEFAULT NULL,
  `uri` varchar(300) DEFAULT NULL,
  `actions` json DEFAULT NULL,
  `active` int DEFAULT '1',
  `module_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `resource_code_uindex` (`code`),
  KEY `resource_uri_index` (`uri`),
  CONSTRAINT `resource_module_fk` FOREIGN KEY (`module_id`) REFERENCES `module` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- is_operator = 1: bỏ qua kiểm tra permission (toàn quyền)
CREATE TABLE IF NOT EXISTS `role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `is_default` int DEFAULT '0',
  `is_operator` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_name_uindex` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- actions: mảng JSON con của resource.actions, vd ["VIEW","ADD"]
CREATE TABLE IF NOT EXISTS `permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `resource_id` int NOT NULL,
  `role_id` int NOT NULL,
  `actions` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permission_role_resource_uindex` (`role_id`,`resource_id`),
  CONSTRAINT `permission_role_fk` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `permission_resource_fk` FOREIGN KEY (`resource_id`) REFERENCES `resource` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `user_app` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `alias` varchar(255) DEFAULT NULL,
  `avatar` text,
  `phone` varchar(20) DEFAULT NULL,
  `phone_verified` int DEFAULT '0',
  `email` varchar(255) DEFAULT NULL,
  `facebook_id` varchar(255) DEFAULT NULL,
  `gplus_id` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `has_password` int DEFAULT '0',
  `regis_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `gender` int DEFAULT NULL,
  `city_name` varchar(255) DEFAULT NULL,
  `subdistrict_name` varchar(255) DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `active` int DEFAULT '1',
  `first_time` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_app_phone_uindex` (`phone`),
  UNIQUE KEY `user_app_email_uindex` (`email`),
  KEY `user_app_role_index` (`role_id`),
  CONSTRAINT `user_app_role_fk` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
