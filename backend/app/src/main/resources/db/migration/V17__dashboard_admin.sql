SET NAMES utf8mb4;

INSERT INTO `module` (`name`, `code`, `description`, `active`)
SELECT 'Kinh doanh', 'SALES', 'Bảng số liệu, gói, đơn hàng, khách hàng', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `module` WHERE `code` = 'SALES');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Bảng số liệu', 'Doanh thu, đơn đã thanh toán, khách mới, gói đang dùng, top LUT, tỉ lệ Premium', 'DASHBOARD', '/dashboard/',
       '["VIEW"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'SALES')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'DASHBOARD');

ALTER TABLE `payment_order` ADD KEY `idx_payment_order_status_paid` (`status`, `paid_time`);
