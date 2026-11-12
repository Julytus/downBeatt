SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `rec_eval_run` (
  `id`           INT          NOT NULL AUTO_INCREMENT,
  `batch_code`   VARCHAR(20)  NOT NULL COMMENT 'Mã lô yyyyMMdd-HHmmss: các dòng ghi trong cùng một lần chạy EvalCommand',
  `dataset`      VARCHAR(30)  NOT NULL COMMENT 'D1-sim (D2-real ở lát 3.2)',
  `algorithm`    VARCHAR(30)  NOT NULL COMMENT 'random, popular, popular-dd, cbf-tag, cbf-full (biến thể ở lát sau)',
  `params`       JSON         NOT NULL COMMENT 'Hạt giống, cỡ dữ liệu, trọng số, tham số',
  `metrics`      JSON         NOT NULL COMMENT 'Chỉ số theo K',
  `user_count`   INT          NOT NULL COMMENT 'Số người dùng được tính',
  `created_time` DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_rec_eval_run_batch` (`batch_code`, `id`),
  KEY `idx_rec_eval_run_algorithm` (`algorithm`, `batch_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
