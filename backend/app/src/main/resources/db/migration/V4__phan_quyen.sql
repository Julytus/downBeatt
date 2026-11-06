-- =====================================================================
-- V4: resource cho các trang quản trị phân quyền (module, tài nguyên, chức vụ, phân quyền).
-- Không ghi cứng id; chạy lại không bị trùng.
-- =====================================================================
SET NAMES utf8mb4;

INSERT INTO `module` (`name`, `code`, `description`, `active`)
SELECT 'Hệ thống', 'SYSTEM', 'Quản trị phân quyền: module, tài nguyên, chức vụ', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `module` WHERE `code` = 'SYSTEM');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Quản lý module', 'Nhóm tài nguyên theo module', 'MODULE', '/module/',
       '["VIEW", "ADD", "UPDATE", "DELETE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'SYSTEM')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'MODULE');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Quản lý tài nguyên', 'Tài nguyên được phân quyền (khớp URI của controller)', 'RESOURCE', '/resource/',
       '["VIEW", "ADD", "UPDATE", "DELETE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'SYSTEM')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'RESOURCE');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Quản lý chức vụ', 'Chức vụ (role) của tài khoản quản trị', 'ROLE', '/role/',
       '["VIEW", "ADD", "UPDATE", "DELETE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'SYSTEM')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'ROLE');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Phân quyền', 'Cấp hành động trên tài nguyên cho từng chức vụ', 'PERMISSION', '/permission/',
       '["VIEW", "UPDATE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'SYSTEM')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'PERMISSION');
