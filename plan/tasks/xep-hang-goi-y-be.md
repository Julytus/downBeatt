# Task: xep-hang-goi-y — backend (agy)

Plan: plan/xep-hang-goi-y.md (đã duyệt 2026-11-11). Đọc §1 → §5 (đặc biệt §5.1 → §5.6), §7 (cả "Quyết định đã chốt" cuối mục), §9 (TC-01 → TC-14 loại unit, dữ liệu §9.1 / §9.2).

## Target
Module `business` (package `vn.aeoc.business.recommend` đã có từ lát 2.2; thêm `rank/` cho lớp thuần) + `entity` + `app` (migration, `application.yml`). Migration `V12__xep_hang_goi_y.sql` (mới nhất hiện tại là V11).

## Việc cần làm
Làm đúng 16 mục ở plan §7, theo thứ tự:
1. Migration `app/src/main/resources/db/migration/V12__xep_hang_goi_y.sql` đúng nguyên văn §4 → `sh scripts/ai/backend-restart.sh` → `mvn -q -DskipTests package` để sinh `REC_IMPRESSION`.
2. Entity: `RecImpression` (bảng + field `limit` không thuộc bảng; cột JSON `lut_ids` đọc theo khuôn `Plan.setLicense(Object)`, ghi chuỗi JSON như `PaymentOrderRepository` ghi `webhook_payload`), `RecommendResult` (POJO response), `Lut` thêm `reason`, `score` (không thuộc bảng).
3. `RecommendProperties` + `application.yml`: 8 khoá `recommend.*` ở §7 mục 3.
4. Chỉ mục: `listPublishedForIndex()` thêm `IS_PREMIUM`, `PUBLISHED_TIME`; record `ItemVector`; `LutVectorIndex.item / items / title / isPremium / publishedTime` (không đổi cách tính vector).
5. `rank/ScoreCalculator` (static): `cosine`, `rbf` (D = a.length), `contributions`, `score` (không cắt), `itemSim` (= `SimilarityService.sim`, cắt [0, 1]).
6. `rank/RankedItem` (record).
7. `rank/Recommender` (thuần): `excludedIds`, `premiumQuota`, `rankByProfile` (+ `selectPool`, `mmr` static), `rankPopular`, `recommend(...)` — hàm lát 3.1 sẽ gọi.
8. `rank/ReasonBuilder` (thuần): đúng bảng §5.5 (thứ tự dòng, ngoặc kép cong “ ” U+201C / U+201D, động từ `{v}`), quy tắc b\* / neo / thẻ / danh mục ở §7 mục 8.
9. `DownloadLogRepository.countByLutSince(since)` (một câu GROUP BY) + `LutDownloadService.recentDownloadCounts(since)`.
10. `LutService.similarAll(slug)`; **xoá** handler `related` khỏi `LutPublicController` (giữ `LutService.related` nguyên vẹn). Package `lut` không được import `recommend`.
11. `RecImpressionRepository` (`insertReturning`), `UserEventRepository.existsDismiss(userId, lutId)`.
12. `EventService.dismiss(userId, body)` (§5.2, `@Transactional`, phát `UserSignalChangedEvent(userId, null, "không quan tâm")` sau khi ghi) + `record(...)`: VIEW có `impressionId > 0` bỏ `existsRecent`.
13. `UserProfileService.profileOf`: chỉ `cache.put` khi `strategy != POPULAR`.
14. `RecommendService.forYou` (§5.1 / §3 luồng chính 2) + `related` (§5.3). Có `Clock`. Log `debug` "for-you {n} LUT, {ms} ms".
15. `RecommendController`: `POST /recommend/public/for-you` (body **không bắt buộc**: thiếu body → như hồ sơ rỗng, `limit` mặc định), `POST /recommend/dismiss`, `GET /lut/public/related` (`slug` bắt buộc → thiếu là 400 như cũ; `page`, `limit`, `anonId` tuỳ chọn; principal có thể null).
16. Unit test TC-01 → TC-14 (JUnit 5 + AssertJ + Mockito, không dựng Spring; tên test ghi ID TC). Ví dụ §9.1 dựng `ItemVector` bằng tay; bảng §9.2 cho `rankPopular`.

## Ràng buộc
- Hợp đồng §5 cố định: path, field JSON (`impressionId`, `strategy`, `items`; item có đủ khoá của `lut/public/get` + `reason`, `score`, `similarity` đúng điều kiện bảng đầu §5), làm tròn 4 chữ số, cách sắp, message nguyên văn "Không tìm thấy LUT" (`DATA_NOT_FOUND`). POJO `NON_NULL`: POPULAR không có khoá `score`; `items` rỗng thì không có khoá `impressionId`.
- `related` khi không có hồ sơ (POPULAR) hoặc c không có dòng `lut_similarity` phải trả **y như cũ** (spec `chi-muc-tuong-dong` không đổi). `similarity` không đổi nghĩa khi cá nhân hoá.
- Quota Premium: `floor(limit × 0.34 + 1e-9)`, áp cho mọi danh tính trừ người đăng nhập có subscription ACTIVE hôm nay; đếm trên danh sách cuối.
- Các "Quyết định đã chốt" cuối §7: không tự đổi. Không thêm resource / migration phân quyền, không `checkPermission`, không `@Async`, không thêm `ErrorCode`. Không sửa migration cũ.
- `rec_impression`: chỉ INSERT khi `items` khác rỗng; `anon_id` chữ thường (kể cả khi có token); `created_time = LocalDateTime.now(clock)`.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" test 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD" | tail -20` xanh, có test cho TC-01 → TC-14.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V12. `SHOW CREATE TABLE rec_impression` đúng §4.
3. Nhóm API của spec nghiệm thu (Claude viết sẵn, KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/xep-hang-goi-y.spec.ts -g "API" --reporter=line 2>&1 | tail -40` → dán dòng `N passed / M failed` (TC-22 được phép `skipped` nếu không có mạng tới payOS). Chạy thêm nhóm API của `chi-muc-tuong-dong.spec.ts` và `ho-so-nguoi-dung.spec.ts` (hồi quy `related`, `event`, `profile`).
4. Dán vào `worker_done` (rút gọn: `strategy`, `impressionId`, 12 cặp `slug / reason / score`): (a) `for-you` của một anonId mới; (b) của anonId đó sau 3 VIEW `xanh-dem`, `da-lat-suong`, `bang-gia`; (c) của một tài khoản mới chỉ tải `mua-thu-ha-noi`; (d) thời gian `for-you` từ log debug trên kho 36 LUT (mục tiêu < 200 ms).
