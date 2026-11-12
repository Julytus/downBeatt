# Task: danh-gia-goi-y — backend (agy)

Plan: plan/danh-gia-goi-y.md (đã duyệt 2026-11-12). Đọc §1, §2, §3, §4, §5 (§5.1 → §5.4), §7 (mục 1 → 15), §9 (TC-01 → TC-12, ví dụ tính tay §9.1), §11.

## Target
Module `business`: package mới `vn.aeoc.business.recommend.eval` (`sim/`, `split/`, `metric/`, `algo/`, `EvalRunner`, `EvalProperties`, `EvalCommand`) + `recommend` (entity, repository, service, 2 API trong `RecommendAdminController`). Migration `V14__danh_gia_goi_y.sql` (mới nhất hiện tại V13). Resource `RECOMMEND` (uri `/recommend/`) đã có từ V13, **không** thêm resource.

## Việc cần làm
Làm đúng 15 mục ở plan §7, theo thứ tự:
1. Migration `app/src/main/resources/db/migration/V14__danh_gia_goi_y.sql` đúng nguyên văn §4. Restart → build lại để sinh jOOQ `REC_EVAL_RUN`.
2. Entity `RecEvalRun` (§7 mục 2): `params` / `metrics` là `LinkedHashMap` giữ thứ tự; setter nhận `org.jooq.JSON` / `String` / `Map` như `RecImpression.setLutIds`.
3. `RecEvalRunRepository` (§7 mục 3): `list`, `count`, `insertAll`; thứ tự `batch_code DESC, id ASC`; `algorithm` / `batch` khớp đúng sau trim, rỗng = không lọc.
4. `RecEvalRunService` (§7 mục 4): chuẩn hoá page/limit §5.1; `get(null)` / không có → `AppException(DATA_NOT_FOUND, "Không tìm thấy lần chạy đánh giá")`; `saveBatch` `@Transactional`, gọi `insertAll` một lần.
5. `RecommendAdminController`: `GET /recommend/eval/list` (`algorithm`, `batch`, `page`, `limit`, đều không bắt buộc), `GET /recommend/eval/get` (`@RequestParam(required = false) Integer id`); dòng đầu `checkPermission(principal, URI, "VIEW")`.
6. `eval/sim/CubeWriter` (§7 mục 6): đúng 7 bước biến đổi, size 33, R chạy nhanh nhất, 6 chữ số; đọc lại bằng `CubeParser.parse` → `ColorFeatureExtractor.extract`.
7. `eval/sim/CatalogGenerator` (§7 mục 7): 8 nguyên mẫu, LUT giữa hai phong cách, thẻ theo luật + nhiễu + đồng nghĩa ít gặp, danh mục, 12 tác giả, tiêu đề / mô tả, `isPremium`, `publishedTime`, `downloadCount` 0, slug `eval-NNN`.
8. `eval/sim/UserSimulator` (§7 mục 8): gu ẩn, `U(u, i)`, ε cố định theo cặp (`mix(seed, u, i)`), phiên xử lý theo thời gian toàn cục, khai báo sở thích; thứ tự RNG cố định (không lặp `HashMap` khi quyết định thứ tự).
9. `eval/metric/EvalMetrics` (§7 mục 9): hàm tĩnh thuần, 8 chỉ số; phải khớp từng số ở §9.1 (sai số 1e-4).
10. `eval/split/TimeSplitter` (§7 mục 10): chế độ `test` và `valid`; gộp tín hiệu `UserSignal` **đúng cách** các repository hiện có đang gộp.
11. `eval/algo/` (§7 mục 11): `EvalAlgorithm`, `random` (20 lần lặp), `popular` (mọi lượt tải trước t0), `popular-dd` (`Recommender.rankPopular`), `cbf-tag`, `cbf-full` (`ProfileBuilder.build` + `Recommender.recommend`, `premiumLimited = false`); `props` là **bản sao sâu**, bean gốc không đổi; chạy K = max rồi lấy tiền tố.
12. `eval/EvalRunner` (§7 mục 12): `params` đúng khoá và **đúng thứ tự** bảng §5.1; `metrics` đúng khoá chuỗi `"5"`, `"10"`, `"20"` × 8 trường, làm tròn 4 chữ số; `createdTime` giờ VN cắt giây.
13. `eval/EvalProperties` (`validate()` §5.4) + `eval/EvalCommand` (`@Profile("eval")`, `ApplicationRunner`): in bảng §5.4 nguyên văn (tiêu đề, dòng tóm tắt, 5 nhãn thuật toán); lỗi tham số → in "Tham số đánh giá không hợp lệ: {khoá}", mã thoát 2, không ghi DB; lỗi khác → mã 1.
14. `app/src/main/resources/application-eval.yml` (§7 mục 14).
15. Hiệu năng: lần chạy mặc định ≤ 5 phút; báo thời gian thật trong worker_done.

## Ràng buộc
- Hợp đồng §5 cố định: path, tên tham số, field, kiểu, **thứ tự khoá `params`**, mã lỗi, message nguyên văn. E2E `frontend/tests/e2e/danh-gia-goi-y.spec.ts` (nhóm "API") kiểm đúng các điểm này — đọc để biết, KHÔNG sửa.
  - `cbf-full.params.weights` phải bằng `GET /recommend/config` → `normalizedWeights` làm tròn 4 chữ số; `eventWeights` bằng `config.eventWeights` (8 khoá đúng thứ tự); `halfLifeDays`, `coldStartK`, `mmrLambda`, `candidateTop`, `historyDays`, `historyMaxPairs`, `popularDays` bằng số tương ứng trong `config.params` (`half-life-days`, …). `catalogStart` = `"2026-01-01T00:00:00"`, `generatorVersion` = 1, `phase` = `"test"`, `kValues` = `[5, 10, 20]`.
  - Hai lần chạy cùng `--eval.seeds=42` phải ra `metrics`, `userCount`, `params` (trừ `elapsedMs`) **giống hệt** (NFR-08): không dùng `Math.random`, `new Random()` không hạt giống, thời gian thật, hay thứ tự lặp `HashMap/HashSet` khi chọn / sắp.
  - Spec còn kiểm hợp lý: coverage@10 random > popular, styles@10 popular-dd ≥ popular, ndcg@10 và recall@10 cbf-full > random, recall / hitRate không giảm theo K.
- **Không sửa** `ProfileBuilder`, `Recommender`, `ScoreCalculator`, `LutVectorIndex`, `CubeParser`, `ColorFeatureExtractor` (plan §10: diff phải rỗng). Cần thêm hàm public nhỏ ở các lớp đó, hoặc `RecommendProperties.copy()`, thì `ask` trước.
- Không unique, không xoá. Không sửa migration cũ. Không `@Idempotent`, Kafka, `@Async`.
- Profile `eval` không được làm hỏng profile `local` thường: `EvalCommand` chỉ là bean khi có profile `eval`; backend :9500 vẫn lên bình thường.
- Quá 5 phút thì `ask` trước khi tối ưu; không viết lại MMR.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Cấm `git stash/reset/checkout/clean`. Worktree có sẵn thay đổi chưa commit của người dùng (`backend/.env.example`, `backend/CLAUDE.md`, `backend/app/src/main/resources/application.yml`, `backend/authenticate/.../RestService.java`, `backend/business/.../billing/service/OrderService.java`): giữ nguyên, không sửa thêm.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP, thời gian — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có test cho TC-01 → TC-11 (tên test ghi ID TC).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V14.
3. Từ gốc repo, chạy **hai lần** (chạy nền hoặc có timeout, không chạy foreground không giới hạn):
   `java -jar backend/app/target/aeoc-backend.jar --spring.profiles.active=local,eval --eval.seeds=42`
   → mã thoát 0, dán bảng Markdown của lần 2 + thời gian chạy. Chạy thêm `--eval.algorithms=xyz` và `--eval.users=10` → dán dòng lỗi + mã thoát 2.
4. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/danh-gia-goi-y.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed`.
5. Xác nhận `git diff --stat` không có 6 lớp cấm sửa ở trên.
