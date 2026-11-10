SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS lut_similarity (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  lut_id INT NOT NULL,
  similar_lut_id INT NOT NULL,
  score DOUBLE NOT NULL,
  CONSTRAINT uk_lut_similarity_pair UNIQUE (lut_id, similar_lut_id),
  KEY idx_lut_similarity_score (lut_id, score),
  CONSTRAINT fk_lut_similarity_lut FOREIGN KEY (lut_id) REFERENCES lut(id) ON DELETE CASCADE,
  CONSTRAINT fk_lut_similarity_similar FOREIGN KEY (similar_lut_id) REFERENCES lut(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
