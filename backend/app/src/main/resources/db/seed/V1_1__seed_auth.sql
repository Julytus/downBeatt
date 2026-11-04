-- =====================================================================
-- Seed CHỈ cho môi trường local (profile local: spring.flyway.locations có classpath:db/seed).
-- Mật khẩu mọi tài khoản: Admin@123 (bcrypt, cost 10)
--   admin@downbeat.local     — Quản trị (operator, toàn quyền)
--   noaccess@downbeat.local  — không có quyền nào (role mặc định)
-- =====================================================================
SET NAMES utf8mb4;

INSERT IGNORE INTO `role` (`id`, `name`, `is_default`, `is_operator`) VALUES
  (1, 'Quản trị', 0, 1),
  (2, 'Không quyền', 1, 0);

INSERT IGNORE INTO `user_app` (`id`, `name`, `email`, `phone`, `password`, `has_password`, `role_id`, `active`, `first_time`) VALUES
  (1, 'Administrator', 'admin@downbeat.local', '0900000000',
   '$2a$10$m4Xd2KRfgDRy66eoscq7BuukZym.dvadrm3p8LX4IUxSOJudLsAiu', 1, 1, 1, 0),
  (2, 'Nhân viên không quyền', 'noaccess@downbeat.local', '0900000001',
   '$2a$10$m4Xd2KRfgDRy66eoscq7BuukZym.dvadrm3p8LX4IUxSOJudLsAiu', 1, 2, 1, 0);
