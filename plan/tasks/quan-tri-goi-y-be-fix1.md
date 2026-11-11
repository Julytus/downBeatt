# Fix 1: quan-tri-goi-y — backend

Coordinator đã chạy `E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "API"` trên backend hiện tại (restart 18:42): 7 passed / 3 failed (TC-11, TC-12, TC-14). Hai lỗi dưới đây. Không sửa gì khác.

## Lỗi 1 — `builtTime` / `lastErrorTime` có phần lẻ giây (TC-11, TC-12)

- Chỗ: `business/.../recommend/service/LutIndexService.java:93` (`.builtTime(LocalDateTime.now(clock))`) và `:104` (`errTime = LocalDateTime.now(clock)`).
- Vi phạm: plan §5.1 / §5.2, response mẫu `"builtTime": "2026-11-12T09:00:04"` (đến giây, như mọi thời điểm khác của API).
- Bằng chứng: `GET /recommend/config` → `index.builtTime = "2026-11-11T18:43:02.0134592"`; `POST /recommend/rebuild` → `builtTime = "2026-11-11T18:43:21.1016016"`.
- Mong đợi: cắt tới giây (`LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS)`) cho cả `builtTime` và `lastErrorTime`. Cập nhật TC-08 trong `LutIndexServiceTest` nếu `Clock` cố định có phần lẻ giây.

## Lỗi 2 — lượt tải ngay sau khi bấm bị bỏ sót vì lệch giây khi ghi (TC-14)

- Chỗ: `business/.../recommend/stats/StatsCalculator.java:90` (`!d.time().isBefore(viewEv.time())`) và `business/.../recommend/service/RecommendStatsService.java` (cận dưới `minClickTime` truyền cho `DownloadLogRepository.listForStats`).
- Vi phạm: plan §5.3 "tải cùng LUT trong 30 phút sau khi bấm".
- Bằng chứng (DB local, TC-14 chạy lúc 18:43): khách 906 bấm `user_event` id 668 (VIEW, lut 17, impression 597) ghi `created_time = 18:43:23`; sau đó gọi tải, `download_log` id 146 (user 906, lut 17) ghi `created_time = 18:43:22`. Thứ tự gọi thật là bấm rồi mới tải, nhưng hai đường ghi làm tròn giây khác nhau (một bên DB cắt giây, một bên làm tròn phần lẻ của `LocalDateTime` Java), nên lượt tải "sớm hơn" lượt bấm 1 giây và không được đếm → `summary.downloaded` không tăng.
- Mong đợi: so sánh có dung sai 1 giây ở cả hai chỗ, vì `DATETIME` chỉ chính xác tới giây:
  - `StatsCalculator`: điều kiện thành `!d.time().isBefore(viewEv.time().minusSeconds(1))` (cận trên giữ `plusMinutes(windowMinutes)`). Đặt dung sai thành hằng số có chú thích lý do.
  - `RecommendStatsService`: cận dưới truy vấn `minClickTime.minusSeconds(1)`.
  - Thêm một ca vào `StatsCalculatorTest` (ghi ID TC-03): bấm lúc `t`, tải cùng LUT lúc `t − 1s` → được đếm; tải lúc `t − 2s` → không đếm.
- Không sửa đường ghi `user_event` / `download_log` (ngoài phạm vi lát này).

## Phạm vi được sửa
Chỉ `backend/**`. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD" | tail -20` xanh.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng". Mọi lệnh `curl` kiểm tra phải kèm `-m 10` (lần trước một lệnh `curl -I` treo cả tiếng).
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "API" --workers=1 --reporter=line 2>&1 | tail -15` → TC-10 → TC-18 xanh. Dán dòng `N passed / M failed` vào `worker_done`.
