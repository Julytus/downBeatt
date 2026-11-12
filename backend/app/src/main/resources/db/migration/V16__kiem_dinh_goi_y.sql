SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `rec_eval_test` (
  `id`            INT          NOT NULL AUTO_INCREMENT,
  `batch_code`    VARCHAR(20)  NOT NULL COMMENT 'Lô rec_eval_run được kiểm định',
  `scenario`      VARCHAR(30)  NOT NULL COMMENT 'standard (lát này chỉ kiểm định kịch bản chính)',
  `metric`        VARCHAR(20)  NOT NULL COMMENT 'ndcg',
  `k`             INT          NOT NULL COMMENT '10 (hoặc K lớn nhất nếu k-values không có 10)',
  `algorithm_a`   VARCHAR(30)  NOT NULL COMMENT 'cbf-full (M)',
  `algorithm_b`   VARCHAR(30)  NOT NULL COMMENT 'Thuật toán so sánh',
  `seed_count`    INT          NOT NULL,
  `pair_count`    INT          NOT NULL COMMENT 'Số cặp (hạt giống, người dùng)',
  `nonzero_count` INT          NOT NULL COMMENT 'Số cặp có chênh lệch khác 0 (Wilcoxon chỉ xếp hạng các cặp này)',
  `mean_a`        DOUBLE       NOT NULL,
  `mean_b`        DOUBLE       NOT NULL,
  `mean_diff`     DOUBLE       NOT NULL,
  `ci_low`        DOUBLE       NOT NULL,
  `ci_high`       DOUBLE       NOT NULL,
  `rel_change`    DOUBLE       NULL     COMMENT '(mean_a - mean_b) / mean_b × 100; NULL khi mean_b = 0',
  `w_plus`        DOUBLE       NOT NULL,
  `z`             DOUBLE       NOT NULL,
  `p_value`       DOUBLE       NOT NULL COMMENT 'Hai phía, chưa hiệu chỉnh',
  `p_holm`        DOUBLE       NOT NULL,
  `conclusion`    VARCHAR(10)  NOT NULL COMMENT 'better / worse / no-diff',
  `params`        JSON         NOT NULL COMMENT 'Phương pháp, alpha, số lần bootstrap, hạt giống bootstrap',
  `created_time`  DATETIME     NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rec_eval_test` (`batch_code`, `scenario`, `metric`, `k`, `algorithm_a`, `algorithm_b`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
