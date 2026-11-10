SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS lut_color_feature (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lut_id INT NOT NULL,
  brightness DOUBLE NOT NULL,
  contrast DOUBLE NOT NULL,
  saturation DOUBLE NOT NULL,
  warmth DOUBLE NOT NULL,
  tint DOUBLE NOT NULL,
  shadow_a DOUBLE NOT NULL, shadow_b DOUBLE NOT NULL,
  highlight_a DOUBLE NOT NULL, highlight_b DOUBLE NOT NULL,
  is_mono TINYINT NOT NULL DEFAULT 0,
  computed_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_lut_color_feature_lut UNIQUE (lut_id),
  CONSTRAINT fk_lut_color_feature_lut FOREIGN KEY (lut_id) REFERENCES lut(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `module` (`name`, `code`, `description`, `active`)
SELECT 'Kho LUT', 'CATALOG', 'Quản trị LUT, danh mục, tác giả', 1 FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `module` WHERE `code` = 'CATALOG');

INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`, `module_id`)
SELECT 'Quản lý LUT', 'LUT, file .cube, đặc trưng màu, xuất bản', 'LUT', '/lut/',
       '["VIEW", "ADD", "UPDATE", "DELETE"]', 1, (SELECT `id` FROM `module` WHERE `code` = 'CATALOG')
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'LUT');
