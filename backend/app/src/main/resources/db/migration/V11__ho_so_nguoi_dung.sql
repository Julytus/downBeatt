SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS user_preference (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT NOT NULL,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_user_preference UNIQUE (user_id, category_id),
  CONSTRAINT fk_user_preference_user FOREIGN KEY (user_id) REFERENCES user_app(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_preference_category FOREIGN KEY (category_id) REFERENCES lut_category(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS user_event (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  anon_id CHAR(36) NULL,
  event_type VARCHAR(20) NOT NULL,
  lut_id INT NULL,
  value VARCHAR(100) COLLATE utf8mb4_0900_as_cs NULL,
  impression_id BIGINT NULL,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_user_event_user (user_id, created_time),
  KEY idx_user_event_anon (anon_id, created_time),
  KEY idx_user_event_lut (lut_id, event_type),
  KEY idx_user_event_created (created_time),
  CONSTRAINT fk_user_event_user FOREIGN KEY (user_id) REFERENCES user_app(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_event_lut FOREIGN KEY (lut_id) REFERENCES lut(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
