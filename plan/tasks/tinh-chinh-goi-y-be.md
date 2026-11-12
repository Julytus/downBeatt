# Task: tinh-chinh-goi-y — backend (agy)

Plan: plan/tinh-chinh-goi-y.md (đã duyệt 2026-11-12). Đọc kỹ §1, §3, §4, §5 (toàn bộ, nhất là bảng tham số §5.1 và bản in §5.4), §7, §9 (§9.1 dữ liệu tính tay + TC loại `unit` TC-01 → TC-12), §11.

## Target
Module `business`, package `vn.aeoc.business.recommend.eval` (đã có từ lát `danh-gia-goi-y`) + gói con mới `eval.tune` + `eval.algo`. Repository / service / controller của `rec_eval_run` (lọc `scenario`). Migration `V15__tinh_chinh_goi_y.sql` (mới nhất hiện tại là V14).

## Việc cần làm
Làm đúng 13 mục ở plan §7, theo thứ tự:
1. Migration V15 đúng §4 → `sh scripts/ai/backend-restart.sh` → build lại để jOOQ sinh `REC_EVAL_RUN.SCENARIO`.
2. `RecEvalRun`: `scenario`, `CANONICAL_PARAM_ORDER` mở rộng, thứ tự khoá con của `tuning`, `CANONICAL_METRIC_ORDER` thêm `newLutHit`, `newLutRecall`.
3. Repository / `RecEvalRunService.list(algorithm, scenario, batch, page, limit)` (trim, rỗng → null) / `RecommendAdminController` `eval/list` thêm `scenario`.
4. `EvalProperties` + `application-eval.yml`: 6 khoá mới §5.4, 12 mã + `ALGORITHM_ORDER`, `validate()` đúng tên khoá.
5. `TimeSplitter`: overload `split(…, excludeSeen, newLutDays)`, `EvalCase.newLutIds` (+ constructor phụ), `coldUser(…)`. Giữ nguyên chữ ký và hành vi `split` cũ.
6. `EvalMetrics.newLutHit`, `newLutRecall` (hàm tĩnh thuần, không chia 0).
7. `eval/tune`: `ItemSimMatrix`, `UserBlockSims`, `FastCbfRanker` — **cùng danh sách id** với `Recommender.recommend` (thứ tự cộng số thực đúng như code gốc, xem §7 mục 7).
8. `eval/tune`: `WeightSampler`, `Tuner`, `TuningResult` — đúng quy tắc chọn và phá hoà §7 mục 8.
9. `eval/algo`: `ConfiguredCbfAlgorithm`, `EvalVariants.props(code, T, T3, D)` (bản sao sâu, bean gốc không đổi).
10. `EvalRunner`: `run(...)` giữ, thêm `runWithReport(...)`; thứ tự và nội dung 28 dòng §5.1.
11. `EvalCommand`: in đúng các phần §5.4 (tiêu đề nguyên văn, định dạng số).
12. Hiệu năng ≤ 10 phút cho lệnh mặc định; không đa luồng; số liệu cuối luôn qua `ProfileBuilder` + `Recommender` thật.
13. Tự kiểm (mục Nghiệm thu dưới).

## Ràng buộc
- Hợp đồng §5 cố định: tên khoá, thứ tự khoá `params` / `tuning` / `metrics`, giá trị `scenario`, thứ tự dòng, message lỗi (§5.3 không đổi so với phần 1; §5.4 "Tham số đánh giá không hợp lệ: {khoá}", mã 2).
- **Không sửa** (diff phải rỗng): `ProfileBuilder`, `Recommender`, `ScoreCalculator`, `LutVectorIndex`, `CubeParser`, `ColorFeatureExtractor`, `CatalogGenerator`, `UserSimulator`, `CubeWriter`. Cần thêm hàm public / đổi phạm vi truy cập ở các lớp này thì `ask` trước (vd. `Recommender.selectPool`, `mmr`, `rankPopular`, `excludedIds` nếu hiện chưa public).
- D1 phải sinh y hệt phần 1 (`generatorVersion` 1, cùng thứ tự `rng.split()`; RNG tinh chỉnh là lần split thứ ba).
- `Tuner` không bao giờ nhận ca `test`.
- Test cũ phần 1 (`EvalUnitTest`, `RecEvalRunServiceTest`) phải xanh; chỉ được ghi rõ tham số cũ, không đổi kỳ vọng.
- Không sửa migration cũ. Không thêm resource / endpoint (quyền vẫn `checkPermission(principal, "/recommend/", "VIEW")`).
- Không dùng `git stash/reset/checkout/clean` (worktree dùng chung với worker frontend).

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Không sửa `frontend/**`, `plan/**`, `docs/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, thời gian, `batchCode` — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có test cho TC-01 → TC-11 (tên test chứa ID TC), và TC-12 (test cũ phần 1) vẫn xanh.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V15.
3. `cd backend && mvn -q -DskipTests package`, rồi từ gốc repo chạy **hai lần** (timeout ≥ 15 phút mỗi lần, không chạy foreground không timeout):
   `java -jar backend/app/target/aeoc-backend.jar --spring.profiles.active=local,eval --eval.seeds=42`
   Báo: mã thoát, `batchCode` và thời gian của hai lô; dán phần "-- Bỏ bớt thành phần (K = 10) --" và dòng "Chọn: …" của M và B3 của lần chạy thứ hai.
4. Restart lại backend :9500 nếu lệnh eval làm nó dừng; xác nhận `curl -s "http://localhost:9500/api/v3/api-docs" | grep -c scenario` > 0.
5. Liệt kê các lớp cấm sửa và xác nhận `git diff --stat` của chúng rỗng.
