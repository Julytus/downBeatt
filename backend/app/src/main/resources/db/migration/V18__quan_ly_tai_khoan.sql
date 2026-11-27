SET NAMES utf8mb4;

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Quản lý tài khoản', 'Xem tài khoản, gói, đơn, lượt tải; khoá / mở khoá; đổi chức vụ', 'USER', '/user/',
       '["VIEW", "UPDATE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'SYSTEM')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'USER');
