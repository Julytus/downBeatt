# Task: kiem-dinh-goi-y — backend (agy)

Plan: plan/kiem-dinh-goi-y.md (đã duyệt 2026-11-12). Đọc §1, §3, §4, §5 (đặc biệt §5.2 quy tắc, §5.3 bố cục Markdown, §5.5 dòng lệnh), §7, §9.1 (số tham chiếu), §9.2 (TC loại `unit` và `cli`), §11.

## Target
Module `business` — package `vn.aeoc.business.recommend.eval` (thêm gói con `stats`) và `vn.aeoc.business.recommend` (service, controller). Entity ở module `entity` (`.../data/mysql/recommend/`). Migration `V16__kiem_dinh_goi_y.sql` (mới nhất hiện có: V15).

## Việc cần làm (trích §7 — đọc nguyên văn §7 trong plan, đây là danh sách để đối chiếu)
1. Migration `backend/app/src/main/resources/db/migration/V16__kiem_dinh_goi_y.sql` đúng §4 (bảng `rec_eval_test`, unique `uk_rec_eval_test`). Restart rồi build để jOOQ sinh `REC_EVAL_TEST`.
2. Entity `RecEvalTest` (`params` parse JSON như `RecEvalRun`, thứ tự khoá §5.2; `id`, `batchCode`, `createdTime` có `@JsonIgnore`). DTO `RecEvalBatch`, `RecEvalSummary` (+ `ScenarioSummary`, `AlgorithmSummary`, `MetricStat { Double mean; Double std; }`), `RecEvalReport`. POJO `NON_NULL` (không có khoá `std` khi 1 hạt giống, không có `relChange` khi meanB = 0, không có `newLutDays` khi thiếu).
3. Gói `eval/stats` (lớp thuần, không Spring): `NormalDist`, `WilcoxonSignedRank`, `HolmCorrection`, `BootstrapCi` (+ `percentile`), `SeedStats`, `PairedTests`, `EvalSummaryBuilder`, `EvalReportWriter` — đúng từng công thức §7 mục 3. Markdown dùng `String.format(Locale.US, …)` rồi đổi `.` → `,`.
4. `EvalRunner`: `EvalSeedResult` thêm `SeedPerUser perUser`; ở `standard`, với mỗi thuật toán khác `random`, giữ NDCG@kTest từng người (lấy đúng giá trị `EvalMetrics.ndcg(sub, relMap, k)` đang tính). **Không đổi gì khác.**
5. `EvalProperties`: `seeds` mặc định `42,7,123,2026,4242`; thêm `bootstrap` (1000, hợp lệ 100 → 10000), `alpha` (0.05, hợp lệ 0.001 → 0.2); `validate()` trả `eval.bootstrap` / `eval.alpha`. Cập nhật `application-eval.yml`.
6. `EvalCommand`: giữ in từng hạt giống; sau vòng hạt giống gọi `PairedTests.build` (khi có `standard` và `cbf-full`), `recEvalRunService.saveBatch(runs, tests)` (một transaction), rồi in `== Tổng hợp lô {batchCode} · {n} hạt giống · {giây, 1 chữ số} giây ==`, dòng trống, và `EvalReportWriter.render(runs, tests)`. Mã thoát như cũ (tham số sai → 2).
7. Repository: `RecEvalTestRepository` (`insertAll`, `listByBatch`, `batchesWithTests`); `RecEvalRunRepository` thêm `listByBatch`, `batchCodes(pageable)`, `countBatches`, `listByBatches`.
8. `RecEvalRunService`: `batches(page, limit)` §5.1; `summary(batch)`, `report(batch)` (trim; rỗng / không có → `AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lô đánh giá")`; `fileName` = `ket-qua-danh-gia-{batchCode}.md`); `@Transactional saveBatch(runs, tests)` (run trước, test sau). Giữ hàm cũ.
9. `RecommendAdminController`: `GET /recommend/eval/batches`, `/recommend/eval/summary`, `/recommend/eval/report`; dòng đầu `checkPermission(principal, URI, "VIEW")`.

## Ràng buộc
- Hợp đồng §5 cố định: path, tên field, thứ tự khoá (test item, `params` 9 khoá), làm tròn, message nguyên văn. `eval/list`, `eval/get` không đổi.
- **Không sửa** (diff phải rỗng): `ProfileBuilder`, `Recommender`, `ScoreCalculator`, `LutVectorIndex`, `CubeParser`, `ColorFeatureExtractor`, `CatalogGenerator`, `UserSimulator`, `CubeWriter`, `TimeSplitter`, `EvalVariants`, mọi lớp trong `eval/algo` và `eval/tune`. `EvalMetrics` chỉ được thêm hàm. Cần hàm public ở lớp cấm sửa thì `ask` trước.
- Số liệu cũ phải giữ nguyên: mọi `metrics` / `params` / `userCount` của hạt giống 42 phải giống hệt lô phần 2 (`20261112-104314`) trừ `elapsedMs` (TC-09 (3), TC-20 E2E).
- **Không thêm dependency Maven** (tự cài erfc / phân phối chuẩn).
- Không xoá dữ liệu cũ trong `rec_eval_run` (E2E cần lô phần 1 và lô phần 2 còn nguyên).
- Không đa luồng. Không `@Idempotent` / Kafka.
- Cấm `git stash/reset/checkout/clean` (worktree dùng chung với worker frontend).

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Không sửa `plan/**`, `frontend/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có đủ test TC-01 → TC-11 (§9.2, số tham chiếu §9.1); `EvalUnitTest`, `EvalPart2UnitTest`, `RecEvalRunServiceTest` xanh, **không đổi kỳ vọng** (nếu dựa vào `seeds` mặc định `[42]` thì ghi rõ `setSeeds(List.of(42L))` trong test).
2. `sh scripts/ai/backend-restart.sh` → backend sẵn sàng, Flyway áp V16.
3. `cd backend && mvn -q -DskipTests package`, rồi từ gốc repo chạy **đúng thứ tự** (mỗi lệnh ghi lại `batchCode`, mã thoát, tổng giây):
   1. **S1**: `java -jar backend/app/target/aeoc-backend.jar --spring.profiles.active=local,eval --eval.seeds=42,7 --eval.luts=80 --eval.users=120 --eval.tune-trials=30`
   2. **S2**: lặp lại đúng lệnh S1
   3. **TC-15**: thêm `--eval.bootstrap=50` vào lệnh S1 → mã 2, in "Tham số đánh giá không hợp lệ: eval.bootstrap"; rồi `--eval.alpha=0` → mã 2, "…: eval.alpha". Số dòng `rec_eval_run` / `rec_eval_test` không đổi.
   4. **O** (chính thức, chạy **cuối cùng** để là lô mới nhất): `java -jar backend/app/target/aeoc-backend.jar --spring.profiles.active=local,eval` — mất 18 đến 36 phút: **chạy nền, timeout ≥ 60 phút**, không chạy foreground. Ghi số giây của từng hạt giống (dòng đầu báo cáo mỗi hạt giống) — mỗi hạt giống phải ≤ 10 phút.
4. Sau O: backend :9500 phải đang chạy (restart nếu lệnh eval làm nó dừng). curl (token từ `POST /api/user/authenticate` admin@downbeat.local / Admin@123): `eval/batches?limit=5`, `eval/summary?batch=<O>` (rút gọn: `seeds`, số `scenarios`, `tests[0]`), `eval/report?batch=<O>` (20 dòng đầu `markdown`), và `eval/summary?batch=khong-co` (404). Dán response rút gọn.
5. E2E API (Claude đã viết sẵn, không sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/kiem-dinh-goi-y.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed`.
6. Báo cáo worker_done gồm: batchCode S1, S2, O; thời gian từng lô và từng hạt giống của O; kết quả 1 → 5.
