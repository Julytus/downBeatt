# Fix 2: quan-tri-goi-y — backend

Sau fix1, coordinator chạy lại: unit `business` 114 / 0 lỗi, nhóm API 10 / 10 xanh. Còn hai điểm lệch so với `plan/tasks/quan-tri-goi-y-be-fix1.md`. Chỉ sửa đúng hai điểm này.

## 1. Hoàn lại thay đổi ở `LutDownloadService` (ngoài phạm vi)

- Chỗ: `business/.../download/service/LutDownloadService.java`, dòng thêm `logRecord.setCreatedTime(LocalDateTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")));`.
- Vi phạm: fix1 mục "Không sửa đường ghi `user_event` / `download_log` (ngoài phạm vi lát này)". Dòng này còn gán cứng múi giờ, không qua `Clock`, và vẫn để phần lẻ giây cho MySQL làm tròn, nên đổi hành vi ghi của lát `tai-lut` (đếm lượt tải theo ngày dựa trên `created_time`) mà không có plan.
- Mong đợi: xoá dòng đó (và import thừa nếu có); `download_log.created_time` trở lại dùng giá trị mặc định của DB như trước. Dung sai ở `StatsCalculator` đủ để TC-14 xanh mà không cần dòng này.

## 2. Dung sai thành hằng số có chú thích

- Chỗ: `business/.../recommend/stats/StatsCalculator.java:90` (`minusSeconds(2)`) và `business/.../recommend/service/RecommendStatsService.java:136` (`minusSeconds(5)`).
- Mong đợi: một hằng số `public static final int CLOCK_SKEW_SECONDS = 2;` trong `StatsCalculator` với chú thích một dòng (DATETIME chỉ tới giây, hai đường ghi làm tròn khác nhau nên lượt tải có thể ghi sớm hơn lượt bấm tối đa 1 giây). Cả hai chỗ dùng chung hằng số này. Ca test TC-03 về dung sai trong `StatsCalculatorTest` dùng hằng số (tải lúc `t − CLOCK_SKEW_SECONDS` được đếm, `t − CLOCK_SKEW_SECONDS − 1` không đếm).

## Phạm vi được sửa
Chỉ 3 file trên + `StatsCalculatorTest`. Cấm `git stash/reset/checkout/clean`. Không chạy `java -jar` foreground; `curl` trong PowerShell phải gọi `curl.exe -m 10`.

## Nghiệm thu
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh (dán tổng `Tests run` từ `business/target/surefire-reports`).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng".
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "API" --workers=1 --reporter=line 2>&1 | tail -5` và `tests/e2e/tai-lut.spec.ts` cùng cách (hồi quy). Dán hai dòng `N passed`.
