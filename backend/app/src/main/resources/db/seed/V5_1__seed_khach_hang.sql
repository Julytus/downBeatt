SET NAMES utf8mb4;

INSERT INTO `user_app` (`name`, `email`, `password`, `has_password`, `role_id`, `active`, `first_time`)
SELECT 'Khách Miễn Phí', 'free@downbeat.local',
       '$2a$10$m4Xd2KRfgDRy66eoscq7BuukZym.dvadrm3p8LX4IUxSOJudLsAiu', 1,
       (SELECT `id` FROM `role` WHERE `name` = 'Khách hàng' LIMIT 1), 1, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM `user_app` WHERE `email` = 'free@downbeat.local');
