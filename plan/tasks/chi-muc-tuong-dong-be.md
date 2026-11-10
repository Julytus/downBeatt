# Task: chi-muc-tuong-dong — backend (agy)

Plan: plan/chi-muc-tuong-dong.md (đã duyệt 10/11/2026). Đọc kỹ §3, §4, §5, §7, §9 (TC loại `unit`, bảng số liệu §9.1).
Lát này **chỉ có backend**: không có worker frontend chạy song song.

## Target
- Package mới `vn.aeoc.business.recommend` (`config`, `index`, `service`, `repository`), chỉ phụ thuộc một chiều vào `business.lut` (`lut` không gọi bean nào của `recommend`).
- Sửa `business.lut` (sự kiện, nguồn dữ liệu chỉ mục, `related` đổi ruột) và module `entity`.
- Migration `V10__chi_muc_tuong_dong.sql` (mới nhất hiện có là `V9__bo_suu_tap.sql`).

## Việc cần làm (làm đúng thứ tự plan §7; chi tiết từng bước nằm ở §7, không lặp lại hết ở đây)
1. Migration `app/src/main/resources/db/migration/V10__chi_muc_tuong_dong.sql` đúng nguyên văn SQL ở §4 → `sh scripts/ai/backend-restart.sh` → `mvn -q -DskipTests package` để sinh `LUT_SIMILARITY`.
2. Entity: `entity/.../data/mysql/recommend/LutSimilarity.java` (`id`, `lutId`, `similarLutId`, `score` Double); `Lut.java` thêm `private Double similarity;`.
3. Cấu hình: thêm khối `recommend:` §5.3 vào `backend/app/src/main/resources/application.yml` (file này đang có thay đổi chưa commit của người dùng — chỉ **thêm** khối mới, không đụng phần khác). `RecommendProperties` + `normalizedWeights()` + `IllegalStateException("recommend.weights không hợp lệ")` (§7 mục 3). `tag-synonyms` là `List<List<String>>`.
4. Phía `lut` (§7 mục 4): `LutCatalogChangedEvent`; `LutAdminService` phát sự kiện đúng bảng §5.2 (reason `"xuất bản"`, `"ẩn"`, `"sửa"`, `"đổi file .cube"`); `LutColorFeatureService.recompute` phát 1 sự kiện `"tính lại đặc trưng màu"` khi ≥ 1 LUT thành công; `@Order(0)` cho `LutColorFeatureBootstrap.onApplicationReady`; `LutCategoryRepository.getActiveNonSoftwareSlugsByLutIds`; `LutRepository.listPublishedForIndex` / `similarPublished` / `countSimilarPublished` (giữ `relatedPublished` / `countRelatedPublished` làm dự phòng); `LutService.listPublishedForIndex` (3 truy vấn `IN (…)`) và `related` (dùng bảng khi `countSimilarPublished > 0`, làm tròn `similarity` 4 chữ số; bằng 0 thì luật cũ, không có `similarity`).
5. Thuật toán thuần Java ở `recommend/index` (§7 mục 5): `TagNormalizer`, `TextTokenizer`, `LutVectorIndex` (bất biến, `static build(List<Lut>, RecommendProperties)`, đủ các hàm truy xuất liệt kê ở §7 mục 5).
6. `recommend/service/SimilarityService` (§7 mục 6): `blockSims`, `sim` (kẹp [0, 1]), `topSimilar` (thứ tự sim ↓, downloadCount ↓, id ↑; mỗi cặp tính một lần).
7. `recommend/service/LutIndexService` (§7 mục 7): `AtomicReference`, `ReentrantLock`, `rebuild(reason)` bắt mọi exception, giữ chỉ mục cũ khi lỗi, log đúng mẫu `Chỉ mục gợi ý: {N} LUT, {M} dòng lut_similarity, {ms} ms ({reason})`.
8. `recommend/repository/LutSimilarityRepository.replaceAll` (§7 mục 8): `@Transactional(propagation = REQUIRES_NEW)`, `DELETE` (không TRUNCATE) rồi chèn nhiều dòng một câu, lô 1000.
9. `recommend/service/LutIndexListener` (§7 mục 9): `@TransactionalEventListener(phase = AFTER_COMMIT, fallbackExecution = true)`; `@EventListener(ApplicationReadyEvent.class) @Order(100)` theo `build-on-startup`; `@Scheduled(cron = "${recommend.rebuild-cron:0 0 3 * * *}", zone = "Asia/Ho_Chi_Minh")`.
10. Unit test (JUnit 5 + AssertJ + Mockito, không dựng Spring) cho **TC-01 → TC-15** (§9.3), đặt ở `business/src/test/java/vn/aeoc/business/recommend/...`; lớp tiện ích `RecommendFixtures` dựng kho 3 LUT §9.1; cập nhật `LutAdminServiceTest` (constructor mới + TC-14) và `LutServiceTest` (TC-15). Tên mỗi test method / `@DisplayName` bắt đầu bằng ID TC. Số liệu kỳ vọng lấy nguyên từ §9.1 (sai số 0.0001).

## Ràng buộc (quyết định đã chốt — không tự đổi, xem §7 cuối và §11)
- Hợp đồng §5 cố định: `GET /api/lut/public/related` giữ path, query, `publicFields()` (không có `fileKey` / `status`), lỗi 404 `DATA_NOT_FOUND` "Không tìm thấy LUT", thiếu `slug` → 400. Chỉ thêm field `similarity` (làm tròn 4 chữ số; bảng lưu nguyên giá trị).
- Thứ tự `related`: `score` ↓, `downloadCount` ↓, `id` ↑. `total` = số dòng bảng của LUT đó mà LUT đích còn `PUBLISHED`.
- Dựng lại **đồng bộ sau commit, trước khi API trả về** (không `@Async`, không executor). Dựng lỗi không làm API quản trị lỗi.
- Xoá cứng, thay cả bảng mỗi lần dựng. Không có dòng `(i, i)`. `similarity-top` = 50.
- std tổng thể (chia n); z cắt về [-3, 3]; chiều std < 1e-12 → z = 0; LUT thiếu đặc trưng màu → z = 0 + log warn.
- Cặp âm tiết: liền nhau trong câu gốc, không ghép qua từ dừng, không ghép qua ranh giới tiêu đề / mô tả; chỉ giữ cặp có df ≥ 2.
- Vector rỗng có cosine = 0 với mọi vector (kể cả chính nó); không chia lại trọng số.
- Không thêm `resource`, không thêm endpoint. Không sửa migration cũ.
- Không dùng `@Idempotent`, Kafka, `BsnScope`.

## Phạm vi được sửa
Chỉ `backend/**`. Không sửa `frontend/**` (E2E `frontend/tests/e2e/chi-muc-tuong-dong.spec.ts` do Claude viết, đã có sẵn — đọc để biết kỳ vọng, KHÔNG sửa). Cấm `git stash/reset/checkout/clean`; không commit.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có đủ TC-01 → TC-15; TC-12 (1000 LUT) xong dưới 3 giây.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V10, log có dòng `Chỉ mục gợi ý: 36 LUT, 1260 dòng lut_similarity`.
3. Dán response của `curl -s "http://localhost:9500/api/lut/public/related?slug=noir&limit=3"` và `...?slug=kodak-400&limit=3` (chỉ cần `total` và cặp `slug` / `similarity` của từng item). Kỳ vọng ở §9.2: noir → chi-than 0.8574, bac-xam 0.7975, anh-trang 0.1189; kodak-400 → fuji-classic 0.7380, super-8 0.5944, chan-dung-mem 0.4952.
4. Chạy nhóm API của spec nghiệm thu: `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/chi-muc-tuong-dong.spec.ts -g "API" --reporter=line 2>&1 | tail -20` và dán dòng `N passed / M failed`.
