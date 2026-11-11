SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS rec_impression (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  anon_id CHAR(36) NULL,
  placement VARCHAR(20) NOT NULL,
  variant VARCHAR(20) NOT NULL,
  strategy VARCHAR(20) NOT NULL,
  lut_ids JSON NOT NULL,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_rec_impression_created (created_time),
  KEY idx_rec_impression_user (user_id, created_time),
  CONSTRAINT fk_rec_impression_user FOREIGN KEY (user_id) REFERENCES user_app(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
