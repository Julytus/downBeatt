SET NAMES utf8mb4;

ALTER TABLE `rec_eval_run`
  ADD COLUMN `scenario` VARCHAR(30) NOT NULL DEFAULT 'standard'
    COMMENT 'standard = phần kiểm 20% cuối; cold-user-{n} = người mới chỉ có khai báo và n sự kiện đầu'
    AFTER `algorithm`,
  ADD KEY `idx_rec_eval_run_scenario` (`scenario`, `batch_code`);
