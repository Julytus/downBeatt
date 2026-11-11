SET NAMES utf8mb4;

INSERT INTO `module` (`name`, `code`, `description`, `active`)
SELECT 'Hệ gợi ý', 'RECOMMENDER', 'Cấu hình, số liệu và công cụ thử hồ sơ của bộ gợi ý', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `module` WHERE `code` = 'RECOMMENDER');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Quản trị gợi ý', 'Cấu hình, tính lại chỉ mục, số liệu trực tuyến, thử hồ sơ', 'RECOMMEND', '/recommend/',
       '["VIEW", "UPDATE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'RECOMMENDER')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'RECOMMEND');
