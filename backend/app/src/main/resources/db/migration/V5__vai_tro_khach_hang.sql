SET NAMES utf8mb4;

INSERT INTO `role` (`name`, `is_default`, `is_operator`)
SELECT 'Khách hàng', 1, 0 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `role` WHERE `name` = 'Khách hàng');

-- Chỉ một role mặc định: role được gán khi khách tự đăng ký
UPDATE `role` SET `is_default` = 0 WHERE `name` <> 'Khách hàng';
UPDATE `role` SET `is_default` = 1, `is_operator` = 0 WHERE `name` = 'Khách hàng';
