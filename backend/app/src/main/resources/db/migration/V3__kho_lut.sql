CREATE TABLE IF NOT EXISTS creator (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) COLLATE utf8mb4_0900_as_ci NOT NULL,
  slug VARCHAR(120) NOT NULL UNIQUE,
  bio VARCHAR(500) NULL, avatar_url VARCHAR(500) NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lut (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(150) NOT NULL UNIQUE,
  title VARCHAR(150) COLLATE utf8mb4_0900_as_ci NOT NULL,
  description VARCHAR(1000) COLLATE utf8mb4_0900_as_ci NULL,
  creator_id INT NOT NULL,
  style VARCHAR(30) NOT NULL,
  is_premium TINYINT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  cover_url VARCHAR(500) NULL,
  preview_type VARCHAR(20) NOT NULL DEFAULT 'BEFORE_AFTER',
  before_url VARCHAR(500) NULL, after_url VARCHAR(500) NULL, preview_video_url VARCHAR(500) NULL,
  file_key VARCHAR(300) NULL, file_size_kb INT NULL, lut_size SMALLINT NULL,
  download_count INT NOT NULL DEFAULT 0,
  published_time DATETIME NULL,
  created_by INT NULL,
  created_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_lut_creator FOREIGN KEY (creator_id) REFERENCES creator(id),
  CONSTRAINT fk_lut_created_by FOREIGN KEY (created_by) REFERENCES user_app(id) ON DELETE SET NULL,
  KEY idx_lut_status_published (status, published_time),
  KEY idx_lut_status_downloads (status, download_count),
  KEY idx_lut_creator (creator_id), KEY idx_lut_style (style)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lut_category (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE, name VARCHAR(80) NOT NULL,
  group_code VARCHAR(20) NOT NULL, description VARCHAR(300) NULL,
  is_popular TINYINT NOT NULL DEFAULT 0, sort_order INT NOT NULL DEFAULT 0,
  status TINYINT NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lut_category_map (
  lut_id INT NOT NULL, category_id INT NOT NULL,
  PRIMARY KEY (lut_id, category_id), KEY idx_lut_category_category (category_id),
  CONSTRAINT fk_lcm_lut FOREIGN KEY (lut_id) REFERENCES lut(id) ON DELETE CASCADE,
  CONSTRAINT fk_lcm_category FOREIGN KEY (category_id) REFERENCES lut_category(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS lut_tag (
  lut_id INT NOT NULL, tag VARCHAR(50) COLLATE utf8mb4_0900_as_ci NOT NULL,
  PRIMARY KEY (lut_id, tag), KEY idx_lut_tag_tag (tag),
  CONSTRAINT fk_lut_tag_lut FOREIGN KEY (lut_id) REFERENCES lut(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'dien-anh','Điện ảnh','phong-cach','Tông màu như phim chiếu rạp: tương phản sâu, vùng tối dày, da người vẫn tự nhiên.',1,1,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='dien-anh');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'co-dien','Cổ điển','phong-cach','Màu phai nhẹ, vàng ấm như ảnh cũ, hợp vlog hoài niệm và MV.',0,2,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='co-dien');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'phim-nhua','Phim nhựa','phong-cach','Mô phỏng các dòng film Kodak, Fuji: grain nhẹ, màu mềm và có chiều sâu.',1,3,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='phim-nhua');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'den-trang','Đen trắng','phong-cach','Đen trắng nhiều sắc độ, từ mềm mại đến tương phản mạnh.',0,4,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='den-trang');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'am-ap','Ấm áp','tong-mau','Vàng cam ấm, hợp hoàng hôn, chân dung và khung cảnh mùa thu.',0,5,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='am-ap');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'lanh','Lạnh','tong-mau','Xanh lạnh và trầm, tạo cảm giác yên tĩnh, bí ẩn.',0,6,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='lanh');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'teal-orange','Teal & Orange','tong-mau','Cặp màu bổ túc kinh điển của Hollywood: nền xanh mòng két, da cam ấm.',1,7,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='teal-orange');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'ruc-ro','Rực rỡ','tong-mau','Màu bão hoà, tươi sáng, nổi bật trên mạng xã hội.',0,8,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='ruc-ro');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'du-lich','Du lịch','dip','Làm nổi bật trời, biển và phong cảnh cho video du lịch.',1,9,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='du-lich');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'dam-cuoi','Đám cưới','dip','Da sáng, màu mềm và lãng mạn cho phóng sự cưới.',1,10,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='dam-cuoi');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'chan-dung','Chân dung','dip','Giữ màu da đẹp, tách chủ thể khỏi nền.',0,11,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='chan-dung');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'ban-dem','Ban đêm','dip','Giữ chi tiết vùng tối, làm đèn đường và neon thêm lung linh.',0,12,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='ban-dem');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'premiere-pro','Premiere Pro','phan-mem','LUT .cube dùng ngay trong Lumetri Color của Premiere Pro.',0,13,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='premiere-pro');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'davinci-resolve','DaVinci Resolve','phan-mem','Kéo thả vào node Color của DaVinci Resolve.',1,14,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='davinci-resolve');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'final-cut-pro','Final Cut Pro','phan-mem','Dùng với hiệu ứng Custom LUT của Final Cut Pro.',0,15,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='final-cut-pro');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'capcut','CapCut','phan-mem','Nhập LUT vào mục Điều chỉnh của CapCut bản máy tính.',0,16,1 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='capcut');
INSERT INTO lut_category (slug,name,group_code,description,is_popular,sort_order,status)
SELECT 'tet','Tết','dip','Tông màu ấm cho dịp Tết.',0,17,0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM lut_category WHERE slug='tet');
