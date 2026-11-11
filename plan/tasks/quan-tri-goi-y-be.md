# Task: quan-tri-goi-y — backend (agy)

Plan: plan/quan-tri-goi-y.md (đã duyệt 2026-11-11). Đọc §1 → §5 (đặc biệt §5.1 → §5.6), §7 (cả "Quyết định đã chốt" cuối mục), §9 (TC-01 → TC-09 loại unit, dữ liệu §9.1).

## Target
Module `business` (package `vn.aeoc.business.recommend`: thêm `controller/RecommendAdminController`, `service/RecommendAdminService`, `service/RecommendStatsService`, `repository/RecommendCustomerRepository`, `stats/StatsCalculator` thuần) + `business.lut` (`LutRepository.idsMissingFeature`) + `entity` (POJO không thuộc bảng) + `app` (migration, `application.yml`). Migration `V13__quan_tri_goi_y.sql` (mới nhất hiện tại là V12). Không có bảng mới → không cần sinh lại jOOQ.

## Việc cần làm
Làm đúng 13 mục ở plan §7, theo thứ tự:
1. Migration `app/src/main/resources/db/migration/V13__quan_tri_goi_y.sql` đúng nguyên văn §4 (module `RECOMMENDER`, resource `RECOMMEND` uri `/recommend/`, actions `["VIEW", "UPDATE"]`; không cấp permission) → `sh scripts/ai/backend-restart.sh`.
2. Entity (`@JsonInclude(NON_NULL)`, `entity/.../data/mysql/recommend/`): `RecommendConfig`, `IndexStatus`, `RebuildResult` (+ `FeatureFailure`), `RecommendStats` (+ `StatsRow`, `PositionStat`), `CustomerOption`, `TryProfileRequest`, `TryProfileResult`, `ColorTerm`. `Lut.java` thêm `Map<String, Double> contributions` (không thuộc bảng, như `score`).
3. `RecommendProperties` + `application.yml`: `stats-download-window-minutes: 30`, `stats-max-days: 366`.
4. `LutIndexService`: `status()`, `rebuildOrThrow(reason)`, `rebuild(reason)` gọi `rebuildOrThrow` và bắt lỗi như cũ; thêm `Clock`.
5. `LutRepository.idsMissingFeature()` (một câu `LEFT JOIN lut_color_feature … WHERE f.id IS NULL`, `file_key` khác rỗng, mọi trạng thái, sắp id tăng).
6. `RecommendService`: tách `rank(...)` dùng chung, gọi thẳng `Recommender.recommend(...)`; `forYou` giữ nguyên hợp đồng + hành vi; thêm `tryProfile(TryProfileRequest)` theo §5.5.
7. `UserProfileService.computeFresh(userId, anonId)` (không đọc / ghi cache).
8. `stats/StatsCalculator.compute(...)` đúng bảng định nghĩa §5.3 (record đầu vào `ImpressionRow`, `EventRow`, `DownloadRow` như §7 mục 8).
9. Repository: `RecImpressionRepository.listForStats`, `UserEventRepository.listByImpressionIds` (chia lô 1000), `DownloadLogRepository.listForStats`, `RecommendCustomerRepository.search / findById`.
10. `RecommendStatsService.stats(from, to)`: parse strict (`2026-02-30` là lỗi), validate đúng thứ tự §5.6, khoảng `[from 00:00, to + 1 ngày 00:00)`, impression rỗng thì không gọi 2 repository còn lại.
11. `RecommendAdminService`: `config()` (§5.1, `LinkedHashMap` đúng thứ tự khoá, làm tròn 4), `rebuild()` (§5.2, handler **không** `@Transactional`), `customers(keyword, limit)` (§5.4).
12. `RecommendAdminController` (`URI = "/recommend/"`): 5 endpoint §5, `checkPermission` ở **dòng đầu** mỗi handler (403 thắng 400), `try-profile` dùng `@RequestBody(required = false)`.
13. Unit test TC-01 → TC-09 (JUnit 5 + AssertJ + Mockito, không dựng Spring; tên test ghi ID TC). Test cũ của `RecommendService` (TC-10 lát 2.3) phải xanh nguyên vẹn, chỉ được sửa chữ ký mock nếu bắt buộc, không giảm assertion (TC-07).

## Ràng buộc
- Hợp đồng §5 cố định: path, field JSON, thứ tự khoá (`weights` / `normalizedWeights` 6 khoá, `eventWeights` 8 khoá, `params` đúng 19 khoá theo thứ tự §5.1, `color` 10 phần tử theo thứ tự §5.5), làm tròn 4 chữ số, message nguyên văn bảng §5.6, `errorCode` `FORBIDDEN` / `BAD_REQUEST` / `DATA_NOT_FOUND` / `INTERNAL_ERROR`. Không thêm `ErrorCode`.
- `config.index`: không có khoá khi chưa từng dựng; `lastError` / `lastErrorTime` chỉ khi lần dựng gần nhất lỗi. Ngày giờ `yyyy-MM-dd'T'HH:mm:ss` theo `Clock` của app.
- `try-profile`: không đụng cache hồ sơ, không INSERT `rec_impression`, không ghi `user_event`. `anonId` trả về chữ thường. `userId` hợp lệ thì bỏ qua `anonId`. Thứ tự `items` phải **trùng** `for-you` của chính khách đó (spec TC-15 so sánh). POPULAR: item không có `score` / `contributions`; `color = []` khi hồ sơ không có màu.
- `customers`: `keyword` trim, rỗng → 10 tài khoản mới nhất; `LIKE` trên email hoặc name phải không phân biệt hoa thường / dấu (spec TC-17 tìm "ho so 123" ra khách tên "Thử Hồ Sơ 123"; kiểm collation cột `user_app.name`, nếu không phải `_ci`/`_ai` thì dùng `COLLATE utf8mb4_unicode_ci` trong câu so sánh).
- Hướng phụ thuộc một chiều: `recommend` → `lut`, `download`, `billing`; package `lut` không import `recommend`.
- Các "Quyết định đã chốt" cuối §7: không tự đổi. Không `@Async`. Không sửa migration cũ.
- Worktree có sẵn thay đổi chưa commit của người dùng (`backend/app/src/main/resources/application.yml`, `backend/authenticate/.../RestService.java`, `backend/business/.../billing/service/OrderService.java`, `backend/.env.example`, `backend/CLAUDE.md`): giữ nguyên các thay đổi đó, chỉ thêm phần của mình.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" test 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD" | tail -20` xanh, có test cho TC-01 → TC-09.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V13. `SELECT code, uri, actions FROM resource WHERE code = 'RECOMMEND'` đúng §4.
3. Nhóm API của spec nghiệm thu (Claude viết sẵn, KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "API" --workers=1 --reporter=line 2>&1 | tail -40` → dán dòng `N passed / M failed`. Hồi quy: nhóm API của `xep-hang-goi-y.spec.ts` (for-you không đổi; TC-22 được phép `skipped` nếu không có mạng tới payOS), `dac-trung-mau.spec.ts`, `phan-quyen.spec.ts`.
4. Dán vào `worker_done` (rút gọn) đúng mục "Nghiệm thu riêng" cuối §7: (a) `config`; (b) `rebuild`; (c) `stats` 30 ngày trên DB local (chỉ `summary` + số dòng `byVariant` / `byPosition`); (d) `try-profile` của `admin@downbeat.local` và của một `anonId` vừa xem 3 LUT lạnh (`strategy`, 12 cặp `slug / score`); (e) `SELECT COUNT(*) FROM rec_impression` trước / sau (d).
