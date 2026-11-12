---
title: Tinh chỉnh gợi ý (đánh giá phần 2) — tinh chỉnh trên tập kiểm định, 7 biến thể bỏ bớt, kịch bản người mới, chỉ số LUT mới
slug: tinh-chinh-goi-y
status: done   # draft → approved → in-progress → done | blocked
dot: docs/plan/README.md §3.1 phần 2 (thiết kế §8.3 tập kiểm định, §8.4.4 chỉ số cold-start, §8.5 biến thể, §8.6 bước 3, §8.8 Bảng 8.3–8.5, Phụ lục B)
module_be: business.recommend.eval (+ gói con `tune`) + business.recommend (lọc `scenario` ở eval/list)
resource_code: RECOMMEND
created: 2026-11-12
approved: 2026-11-12
---

# Tinh chỉnh gợi ý (đánh giá phần 2)

## 1. Mục tiêu và phạm vi

Phần 1 (`danh-gia-goi-y`) đã có bộ D1, chia dữ liệu, 8 chỉ số và 5 thuật toán chạy với **tham số mặc định**. Lô seed 42 cho kết quả: B2 Phổ biến NDCG@10 0,2782, còn M CBF đủ đặc trưng chỉ 0,0528. Nhật ký phần 1 nêu hai nguyên nhân. Thứ nhất, ứng viên của CBF vẫn chứa LUT người dùng đã xem ở phần dựng, trong khi các LUT đó luôn có rel = 0. Thứ hai, trình mô phỏng lấy 12 trên 24 LUT người dùng thấy từ danh sách phổ biến.

Sau plan này, lập trình viên chạy **một lệnh** (profile `eval`, như phần 1). Với mỗi hạt giống, lệnh này:

1. **Sửa giao thức chia dữ liệu**: loại khỏi ứng viên những LUT người dùng đã có sự kiện dương ở phần dựng, áp cho mọi thuật toán (`eval.exclude-seen`, mặc định bật, §11 câu 1).
2. **Tinh chỉnh M trên tập kiểm định** (§8.6 bước 3): 500 bộ trọng số khối → λ của MMR → chu kỳ bán rã × k. Tinh chỉnh **B3** theo cùng cách nhưng giữ trọng số chỉ thẻ (chỉ λ, chu kỳ bán rã, k). Phần tìm tham số chạy trên một đường tính nhanh. Unit test chứng minh đường nhanh cho cùng danh sách với `Recommender.recommend` thật.
3. Chạy trên phần kiểm **12 thuật toán**: 5 thuật toán cũ (B3 và M dùng tham số đã tinh chỉnh) cộng 7 biến thể M-mau, M-the, M-giam, M-mmr, M-kb, M-tron, M-mac-dinh (§8.5). Số liệu cuối luôn đi qua `ProfileBuilder` + `Recommender` thật.
4. Chạy **kịch bản người mới** (§8.4.4, H4): chỉ giữ sở thích khai báo và n = 0, 1, 3, 5 sự kiện đầu, đo B2, B3, M, M-kb.
5. Thêm chỉ số **LUT mới** (H5) vào mọi dòng: tỉ lệ danh sách có LUT mới và Recall trên LUT mới liên quan.
6. Ghi 28 dòng `rec_eval_run` cho mỗi hạt giống (12 dòng kịch bản chính + 16 dòng người mới), in Bảng 8.1, 8.3, 8.4, 8.5 và chi tiết tinh chỉnh dạng Markdown.

Ở `/admin/goi-y?tab=danh-gia`, quản trị có thêm bộ lọc "Kịch bản", nhãn của 7 biến thể, hai cột chỉ số LUT mới và badge "tinh chỉnh" trên các dòng dùng tham số đã tinh chỉnh.

| Có làm (lát này) | Không làm (để plan khác) |
|---|---|
| Migration `V15__tinh_chinh_goi_y.sql`: cột `scenario` của `rec_eval_run` | 5 hạt giống chính thức, trung bình ± độ lệch chuẩn, Wilcoxon + Holm, bootstrap, xuất Bảng 8.1 → 8.5 ra `docs/` (lát `kiem-dinh-goi-y`) |
| Loại LUT đã xem khỏi ứng viên (`eval.exclude-seen`), LUT mới (`eval.new-lut-days`) | Ghi trọng số đã tinh chỉnh vào `recommend.*` của cửa hàng (§11 câu 10) |
| Tinh chỉnh M (trọng số, λ, chu kỳ bán rã, k) và B3 (λ, chu kỳ bán rã, k) trên tập kiểm định | Sửa `Recommender` của cửa hàng để bỏ LUT đã xem khỏi "Dành cho bạn" (§11 câu 1) |
| 7 biến thể bỏ bớt, kịch bản người mới n = 0/1/3/5, 2 chỉ số LUT mới | Đổi bộ mô phỏng D1 (`generatorVersion` giữ 1, §11 câu 11) |
| `eval/list` lọc theo `scenario`; item có thêm `scenario` | D2 / D3 (kế hoạch tổng 3.2), nút chạy đánh giá trên giao diện, biểu đồ, xoá lần chạy |
| Thẻ "Đánh giá": bộ lọc "Kịch bản", 7 nhãn mới, 2 cột LUT mới, badge "tinh chỉnh", so sánh có thêm kịch bản | Thẻ tóm tắt kết quả tinh chỉnh riêng (xem bằng cách so sánh M với M-mac-dinh) |

## 2. Tác nhân và phân quyền

| Tác nhân | Quyền (resource `RECOMMEND`, uri `/recommend/`) | Ghi chú |
|---|---|---|
| Quản trị (`admin@downbeat.local`) | VIEW | Xem bảng, lọc, so sánh |
| Role được cấp VIEW `RECOMMEND` | VIEW | Như trên |
| Khách hàng, `noaccess@downbeat.local` | Không | 403 `FORBIDDEN` "Bạn không có quyền thực hiện thao tác này! Path: /recommend/, Action: VIEW"; không token → 401 |
| Lập trình viên (máy local) | — | Chạy `EvalCommand` bằng dòng lệnh |

Không thêm resource hay endpoint. Hai endpoint cũ giữ `checkPermission(principal, "/recommend/", "VIEW")` ở dòng đầu.

## 3. Luồng nghiệp vụ

**Luồng chính 1 — chạy đánh giá có tinh chỉnh (dòng lệnh):**
1. `java -jar backend/app/target/aeoc-backend.jar --spring.profiles.active=local,eval [--eval.seeds=42]`.
2. `EvalCommand` kiểm tham số (§5.4) và sinh `batchCode`.
3. Với mỗi hạt giống s, sinh D1 y hệt phần 1 (`CatalogGenerator`, `LutVectorIndex.build`, `UserSimulator`, cùng thứ tự `rng.split()`), rồi `rootRng.split()` lần thứ ba để lấy RNG cho tinh chỉnh.
4. `TimeSplitter` chế độ `valid` có exclude-seen. `Tuner` tinh chỉnh M (3 bước §7 mục 8), rồi B3 (bước 2, 3).
5. `TimeSplitter` chế độ `test` có exclude-seen. Chạy 12 thuật toán theo thứ tự §5.1, mỗi thuật toán một `RecEvalRun` `scenario = "standard"`.
6. `TimeSplitter.coldUser` với n = 0, 1, 3, 5 (cùng tập người). Với mỗi n chạy popular, cbf-tag, cbf-full, m-kb, mỗi lần một `RecEvalRun` `scenario = "cold-user-{n}"`.
7. Ghi cả lô trong một transaction, in các bảng §5.4, thoát mã 0.

**Luồng chính 2 — xem theo kịch bản:**
1. Quản trị mở thẻ "Đánh giá". Giao diện gọi `eval/list?scenario=standard&page=1&limit=20`, bảng hiện 12 dòng mỗi lô.
2. Chọn "Kịch bản" → "Người mới · 3 sự kiện". Giao diện gọi lại với `scenario=cold-user-3`, bảng hiện 4 dòng mỗi lô và một dòng giải thích kịch bản.

**Luồng chính 3 — xem tinh chỉnh thay đổi gì:**
1. Tích dòng "M CBF đủ đặc trưng" và "M-mac-dinh Tham số mặc định" của cùng lô, rồi bấm "So sánh".
2. Bảng "Chỉ số" cho thấy mức tăng hoặc giảm trên phần kiểm. Bảng "Tham số" đánh dấu "khác" ở `tuned`, các trọng số, λ, chu kỳ bán rã, k và cho thấy `tuning.validNdcg*` trên tập kiểm định.

**Luồng thay thế:**
- A1. `--eval.tune=false`: bỏ tinh chỉnh, B3 / M / biến thể dùng tham số mặc định (chạy nhanh để thử). `m-mac-dinh` khi đó trùng `cbf-full`.
- A2. Chạy lại đúng phần 1: `--eval.tune=false --eval.exclude-seen=false --eval.scenarios=standard --eval.algorithms=random,popular,popular-dd,cbf-tag,cbf-full` cho 8 chỉ số cũ và `userCount` bằng đúng lô phần 1 cùng hạt giống.
- A3. `--eval.scenarios=standard` hoặc `cold-user`: chỉ chạy một kịch bản. Tinh chỉnh vẫn chạy nếu kịch bản đó cần B3 / M.
- A4. "Kịch bản" → "Tất cả kịch bản": giao diện gọi `list` không có `scenario`.
- A5. Mở link `?tab=danh-gia&scen=cold-user-0&a=..&b=..`: bộ lọc và thẻ so sánh hiện ngay.

**Ngoại lệ:**
- E1. Không quyền → 403 / 401 (§2).
- E2. `get` id không có / thiếu id → 404 "Không tìm thấy lần chạy đánh giá" (giữ nguyên phần 1).
- E3. Tham số dòng lệnh sai → "Tham số đánh giá không hợp lệ: {khoá}", không ghi DB, mã 2.
- E4. Rỗng: "Chưa có lần chạy đánh giá nào" (chưa lọc gì) / "Không có lần chạy nào khớp bộ lọc." (§6.3).
- E5. Lỗi mạng / 5xx → "Không tải được dữ liệu" + "Thử lại".

```mermaid
sequenceDiagram
  actor D as Lập trình viên
  participant C as EvalCommand (profile eval)
  participant S as TimeSplitter
  participant T as Tuner (đường nhanh)
  participant R as ProfileBuilder + Recommender (code thật)
  participant DB as MySQL
  D->>C: java -jar … --spring.profiles.active=local,eval
  C->>C: sinh D1 (như phần 1), LutVectorIndex.build
  C->>S: split(valid, exclude-seen)
  C->>T: M: 500 bộ trọng số → λ → chu kỳ bán rã × k; B3: λ → chu kỳ bán rã × k
  T-->>C: tham số tốt nhất + bảng kết quả kiểm định
  C->>S: split(test, exclude-seen)
  loop 12 thuật toán
    C->>R: build(…, t0, props đã tinh chỉnh / biến thể) → recommend(K = 20)
  end
  C->>S: coldUser(n = 0, 1, 3, 5)
  loop n × (popular, cbf-tag, cbf-full, m-kb)
    C->>R: build(n sự kiện đầu + khai báo) → recommend
  end
  C->>DB: INSERT 28 dòng rec_eval_run / hạt giống (1 transaction / lô)
  C-->>D: Bảng 8.1, 8.3, 8.4, 8.5 + chi tiết tinh chỉnh, thoát 0
```

## 4. Cơ sở dữ liệu

Migration: `V15__tinh_chinh_goi_y.sql`. Migration mới nhất hiện tại là `V14__danh_gia_goi_y.sql`.

```sql
SET NAMES utf8mb4;

ALTER TABLE `rec_eval_run`
  ADD COLUMN `scenario` VARCHAR(30) NOT NULL DEFAULT 'standard'
    COMMENT 'standard = phần kiểm 20% cuối; cold-user-{n} = người mới chỉ có khai báo và n sự kiện đầu'
    AFTER `algorithm`,
  ADD KEY `idx_rec_eval_run_scenario` (`scenario`, `batch_code`);
```

Các dòng cũ của phần 1 nhận `scenario = 'standard'`. Không thêm bảng, không unique, không xoá. Dữ liệu D1 và kết quả tinh chỉnh chi tiết **không** ghi DB: sinh lại được từ `seed`. Chỉ phần tóm tắt tinh chỉnh nằm trong `params.tuning`.

## 5. Hợp đồng API (cố định — nguồn sự thật cho cả BE và FE)

Giữ nguyên quy ước phần 1: thành công `{ "code": 200, "message": "OK", "result": … }`; lỗi `{ "path", "code", "errorCode", "message" }`; POJO `NON_NULL`; thời điểm `yyyy-MM-dd'T'HH:mm:ss` giờ VN; số chỉ số và số trong `tuning` làm tròn 4 chữ số.

### 5.1 `GET /api/recommend/eval/list?algorithm=&scenario=&batch=&page=&limit=` — quyền VIEW

- **Mới:** `scenario` khớp đúng sau trim; bỏ trống = không lọc; giá trị không có → `total` 0, `items` [] (không lỗi).
- Giữ nguyên: `algorithm`, `batch`, `page` (≤ 0 → 1), `limit` (mặc định 20, ≤ 0 → 20, > 100 → 100), thứ tự `batch_code` DESC, `id` ASC.
- Thứ tự chạy (cũng là thứ tự `id` trong lô), mỗi hạt giống:
  - `standard`: `random`, `popular`, `popular-dd`, `cbf-tag`, `cbf-full`, `m-mau`, `m-the`, `m-giam`, `m-mmr`, `m-kb`, `m-tron`, `m-mac-dinh`
  - rồi `cold-user-0`, `cold-user-1`, `cold-user-3`, `cold-user-5`, mỗi kịch bản theo thứ tự `popular`, `cbf-tag`, `cbf-full`, `m-kb`
  - nhiều hạt giống thì lặp lại theo từng hạt giống (hạt giống 1: 28 dòng, rồi hạt giống 2: 28 dòng).

Response `result` (rút gọn hai item):
```json
{
  "total": 28, "page": 1,
  "items": [
    {
      "id": 41, "batchCode": "20261113-091500", "dataset": "D1-sim", "algorithm": "cbf-full", "scenario": "standard",
      "userCount": 343, "createdTime": "2026-11-13T09:19:02",
      "params": {
        "seed": 42, "phase": "test", "lutCount": 300, "simUserCount": 500, "kValues": [5, 10, 20],
        "generatorVersion": 1, "catalogStart": "2026-01-01T00:00:00",
        "excludeSeen": true, "newLutDays": 14, "newLutUserCount": 61, "elapsedMs": 9120,
        "weights": { "tag": 0.10, "color": 0.35, "category": 0.05, "style": 0.30, "text": 0.05, "creator": 0.15 },
        "eventWeights": { "VIEW": 1.0, "PREVIEW": 2.0, "SEARCH": 0.5, "FILTER_STYLE": 0.5, "FAVORITE": 4.0, "DOWNLOAD": 5.0, "PURCHASE": 6.0, "DISMISS": -4.0 },
        "halfLifeDays": 14.0, "coldStartK": 2.0, "mmrLambda": 0.8, "candidateTop": 100,
        "historyDays": 180, "historyMaxPairs": 200, "popularDays": 30,
        "useDeclared": true, "tuned": true,
        "tuning": { "validUserCount": 188, "weightTrials": 500, "validNdcgDefault": 0.0612, "validNdcgWeights": 0.0835,
                    "validNdcgLambda": 0.0841, "validNdcgFinal": 0.0857, "validIldBase": 0.6020, "elapsedMs": 52310 }
      },
      "metrics": {
        "5":  { "precision": 0.0410, "recall": 0.1520, "ndcg": 0.1102, "hitRate": 0.1866, "ild": 0.6012, "styles": 2.4100, "coverage": 0.5233, "novelty": 5.9012, "newLutHit": 0.3120, "newLutRecall": 0.0820 },
        "10": { "…": 0 }, "20": { "…": 0 }
      }
    },
    {
      "id": 53, "batchCode": "20261113-091500", "dataset": "D1-sim", "algorithm": "m-kb", "scenario": "cold-user-0",
      "userCount": 212, "createdTime": "2026-11-13T09:19:02",
      "params": {
        "seed": 42, "phase": "cold-user", "lutCount": 300, "simUserCount": 500, "kValues": [5, 10, 20],
        "generatorVersion": 1, "catalogStart": "2026-01-01T00:00:00",
        "excludeSeen": true, "newLutDays": 14, "newLutUserCount": 40, "historyEvents": 0, "elapsedMs": 2100,
        "weights": { "…": 0 }, "eventWeights": { "…": 0 }, "halfLifeDays": 14.0, "coldStartK": 2.0, "mmrLambda": 0.8,
        "candidateTop": 100, "historyDays": 180, "historyMaxPairs": 200, "popularDays": 30,
        "useDeclared": false, "tuned": true
      },
      "metrics": { "5": { "…": 0 }, "10": { "…": 0 }, "20": { "…": 0 } }
    }
  ]
}
```
Các con số chỉ minh hoạ kiểu dữ liệu. Kết quả thật do lần chạy quyết định.

**`params`**: khoá theo đúng thứ tự dưới đây. Mở rộng `RecEvalRun.CANONICAL_PARAM_ORDER` và thêm thứ tự khoá con của `tuning`.

| Nhóm | Khoá |
|---|---|
| Chung (mọi dòng) | `seed`, `phase`, `lutCount`, `simUserCount`, `kValues`, `generatorVersion` (vẫn 1), `catalogStart`, **`excludeSeen`**, **`newLutDays`**, **`newLutUserCount`**, **`historyEvents`** (chỉ dòng `cold-user-*`), `elapsedMs` |
| `random` | `repeats` |
| `popular` | `popularWindow` |
| `popular-dd` | `popularDays` |
| `cbf-tag`, `cbf-full`, `m-*` | `weights` (sau chuẩn hoá), `eventWeights`, `halfLifeDays`, `coldStartK`, `mmrLambda`, `candidateTop`, `historyDays`, `historyMaxPairs`, `popularDays`, **`useDeclared`**, **`tuned`**, **`tuning`** (chỉ có ở dòng `cbf-tag`, `cbf-full` kịch bản `standard` khi `eval.tune = true`) |

- `phase`: dòng `standard` = `eval.phase` (mặc định `"test"`); dòng `cold-user-*` = `"cold-user"`.
- `halfLifeDays` = `0` nghĩa là **không suy giảm** (chu kỳ bán rã ∞), đúng ngữ nghĩa sẵn có của `ProfileBuilder` (`≤ 0` → hệ số 1).
- `newLutUserCount`: số người của kịch bản đó có ít nhất một LUT mới liên quan, là mẫu số của `newLutRecall`.
- `tuned`: `true` khi tham số lấy từ kết quả tinh chỉnh (`cbf-tag`, `cbf-full`, 6 biến thể khác `m-mac-dinh`); `false` ở `m-mac-dinh` và mọi dòng CBF khi `eval.tune = false`.
- `tuning` (thứ tự khoá đúng như sau): `validUserCount`, `weightTrials` (B3: 0), `validNdcgDefault`, `validNdcgWeights` (B3: bằng `validNdcgDefault`), `validNdcgLambda`, `validNdcgFinal`, `validIldBase`, `elapsedMs`. Mọi `validNdcg*` là NDCG@10 trên tập kiểm định. Bốn số này không giảm theo thứ tự trên (§7 mục 8).

**Giá trị tham số của từng thuật toán CBF.** Ký hiệu: *D* = bean `RecommendProperties` (giá trị của `GET /recommend/config`), *T* = kết quả tinh chỉnh M, *T3* = kết quả tinh chỉnh B3. Khi `eval.tune = false` thì *T* = *T3* = *D* (B3 vẫn giữ trọng số chỉ thẻ).

| algorithm | weights | eventWeights | halfLifeDays | coldStartK | mmrLambda | useDeclared |
|---|---|---|---|---|---|---|
| `cbf-tag` | `{tag 1, còn lại 0}` | D | T3 | T3 | T3 | true |
| `cbf-full` | T | D | T | T | T | true |
| `m-mau` | T bỏ `color`, chia lại theo tỉ lệ | D | T | T | T | true |
| `m-the` | T bỏ `tag`, chia lại theo tỉ lệ | D | T | T | T | true |
| `m-giam` | T | D | **0** | T | T | true |
| `m-mmr` | T | D | T | T | **1.0** | true |
| `m-kb` | T | D | T | T | T | **false** |
| `m-tron` | T | **dương = 1.0, `DISMISS` = −1.0** | T | T | T | true |
| `m-mac-dinh` | D | D | D | D | D | true |

`candidateTop`, `historyDays`, `historyMaxPairs`, `popularDays` luôn bằng *D*.

**`metrics`**: object có đúng các khoá chuỗi trong `kValues`. Mỗi khoá có đúng **10** trường theo thứ tự `precision`, `recall`, `ndcg`, `hitRate`, `ild`, `styles`, `coverage`, `novelty`, **`newLutHit`**, **`newLutRecall`** (định nghĩa ở §7 mục 6). Dòng cũ của phần 1 chỉ có 8 trường.

### 5.2 `GET /api/recommend/eval/get?id=` — quyền VIEW

Response `result`: một phần tử đúng như trong `items` của §5.1, có thêm `scenario`. Id thiếu hoặc không có → 404 (giữ nguyên).

### 5.3 Lỗi nghiệp vụ (không đổi so với phần 1)

| Tình huống | HTTP | errorCode | Message (FE hiện nguyên văn) |
|---|---|---|---|
| Không token | 401 | có sẵn | (có sẵn của filter) |
| Không có VIEW `RECOMMEND` | 403 | `FORBIDDEN` | Bạn không có quyền thực hiện thao tác này! Path: /recommend/, Action: VIEW |
| `get` id không có / thiếu id | 404 | `DATA_NOT_FOUND` | Không tìm thấy lần chạy đánh giá |

### 5.4 Dòng lệnh `EvalCommand`

Khoá `eval.*` (mặc định trong `application-eval.yml`). **Đậm** là khoá mới hoặc khoá đổi mặc định:

| Khoá | Mặc định | Hợp lệ |
|---|---|---|
| `eval.seeds` | `42` | danh sách ≥ 1 số nguyên |
| `eval.luts` | 300 | 40 → 2000 |
| `eval.users` | 500 | 20 → 5000 |
| `eval.k-values` | `5,10,20` | mỗi số 1 → 50, không trùng |
| **`eval.algorithms`** | 12 mã theo thứ tự §5.1 | tập con của 12 mã, chạy theo thứ tự §5.1 |
| `eval.random-repeats` | 20 | 1 → 100 |
| `eval.phase` | `test` | `test` / `valid` (phần kiểm của kịch bản chính; tinh chỉnh luôn dùng `valid`) |
| `eval.dataset` | `D1-sim` | chỉ `D1-sim` |
| **`eval.tune`** | `true` | `true` / `false` |
| **`eval.tune-trials`** | 500 | 1 → 5000 (đã gồm bộ trọng số mặc định) |
| **`eval.exclude-seen`** | `true` | `true` / `false` |
| **`eval.new-lut-days`** | 14 | 1 → 60 |
| **`eval.scenarios`** | `standard,cold-user` | tập con khác rỗng của {`standard`, `cold-user`} |
| **`eval.cold-user-events`** | `0,1,3,5` | mỗi số 0 → 10, không trùng; chạy theo thứ tự tăng |

Kịch bản `cold-user` chỉ chạy các mã thuộc `eval.algorithms` ∩ {`popular`, `cbf-tag`, `cbf-full`, `m-kb`}. Nếu giao này rỗng thì bỏ qua kịch bản đó, không coi là lỗi.

Tham số sai → in "Tham số đánh giá không hợp lệ: {khoá}" ra stdout và stderr, không ghi DB, mã 2. Thành công → mã 0. Mỗi hạt giống in đúng các phần sau, theo thứ tự (dòng tiêu đề nguyên văn; bảng nào không có dữ liệu vì bị tắt bằng tham số thì bỏ cả phần):

```
== Đánh giá gợi ý · lô 20261113-091500 · D1-sim · hạt giống 42 ==
300 LUT · 500 người mô phỏng · 343 người được tính · 214.6 giây

-- Tinh chỉnh M trên tập kiểm định (188 người) --
Trọng số khối: 500 bộ, 5 bộ tốt nhất
| # | Thẻ | Màu | Danh mục | Phong cách | Văn bản | Tác giả | NDCG@10 |
|---|---|---|---|---|---|---|---|
| 214 | 0.10 | 0.35 | 0.05 | 0.30 | 0.05 | 0.15 | 0.0835 |
| … |
| mặc định | 0.30 | 0.25 | 0.15 | 0.15 | 0.10 | 0.05 | 0.0612 |
λ của MMR (ILD@10 tối thiểu 0.5719 = 95% của λ 0.7)
| λ | NDCG@10 | ILD@10 | Đạt |
|---|---|---|---|
| 0.5 | … | … | có |
| … |
Chu kỳ bán rã × k (NDCG@10)
| Chu kỳ bán rã | k = 2 | k = 5 | k = 10 |
|---|---|---|---|
| 7 | … | … | … |
| … |
| ∞ | … | … | … |
Chọn: trọng số thẻ 0.10 · màu 0.35 · danh mục 0.05 · phong cách 0.30 · văn bản 0.05 · tác giả 0.15 · λ 0.8 · chu kỳ bán rã 14 · k 2 · NDCG@10 kiểm định 0.0612 → 0.0857
-- Tinh chỉnh B3 trên tập kiểm định --
Chọn: λ 0.7 · chu kỳ bán rã 30 · k 5 · NDCG@10 kiểm định 0.0402 → 0.0455

-- So sánh với baseline (K = 10) --
| Thuật toán | P@10 | R@10 | NDCG@10 | HitRate@10 | ILD@10 | Phong cách / 10 | Coverage@10 | Novelty@10 |
| (B1, B2, B2-dd, B3, M — như phần 1) |

-- Bỏ bớt thành phần (K = 10) --
| Biến thể | NDCG@10 | Thay đổi so với M | ILD@10 |
|---|---|---|---|
| M | 0.1102 | — | 0.6012 |
| M-mau | … | -12.3% | … |
| (M-the, M-giam, M-mmr, M-kb, M-tron, M-mac-dinh) |

-- Người mới: NDCG@10 theo số sự kiện n (212 người có khai báo) --
| Thuật toán | n = 0 | n = 1 | n = 3 | n = 5 |
|---|---|---|---|---|
| B2 Phổ biến | … |
| B3 CBF chỉ thẻ | … |
| M CBF đủ đặc trưng | … |
| M-kb Bỏ sở thích khai báo | … |

-- LUT mới: xuất bản trong 14 ngày trước t0 (61 người có LUT mới liên quan) --
| Thuật toán | Tỉ lệ danh sách có LUT mới | Recall@10 trên LUT mới |
|---|---|---|
| (B1, B2, B2-dd, B3, M) |
```
Số in ra dùng dấu chấm thập phân, 4 chữ số; trọng số và λ 2 chữ số; riêng "Phong cách / 10" và "Novelty@10" dùng 2 chữ số, "Thay đổi so với M" 1 chữ số kèm dấu; chu kỳ bán rã 0 in là "∞". K của các bảng là 10 nếu có trong `k-values`, không thì K lớn nhất. Riêng phần tinh chỉnh luôn dùng K = 10.

## 6. Giao diện (chuỗi cố định — test E2E chọn theo đúng các chuỗi này)

Chỉ đổi nội dung thẻ **"Đánh giá"** (`/admin/goi-y?tab=danh-gia`); ba thẻ còn lại không đổi. Mọi chuỗi và hành vi của phần 1 không nhắc ở đây thì giữ nguyên.

### 6.1 Tham số URL

Thêm `scen`: `standard` (mặc định khi thiếu), `all`, `cold-user-0`, `cold-user-1`, `cold-user-3`, `cold-user-5`. Giá trị khác → `standard` (Zod `.catch`). Khi đổi `scen` thì đặt `page = 1`, giữ `algo`, `k`, `a`, `b`, `navigate({ replace: true })`. Khi `scen` là `all` thì request không có `scenario`; các giá trị còn lại gửi `scenario={scen}`.

### 6.2 Thanh công cụ

- `Select` mới **"Kịch bản"** (aria-label "Kịch bản"), đặt trước "Thuật toán", rộng `w-[220px]`, có các mục theo thứ tự: "Đánh giá chính", "Người mới · 0 sự kiện", "Người mới · 1 sự kiện", "Người mới · 3 sự kiện", "Người mới · 5 sự kiện", "Tất cả kịch bản".
- `Select` "Thuật toán": rộng `w-[260px]`, giữ "Tất cả thuật toán" + 5 nhãn cũ, thêm theo thứ tự:
  - `m-mau` "M-mau Bỏ khối màu"
  - `m-the` "M-the Bỏ khối thẻ"
  - `m-giam` "M-giam Bỏ suy giảm thời gian"
  - `m-mmr` "M-mmr Bỏ MMR"
  - `m-kb` "M-kb Bỏ sở thích khai báo"
  - `m-tron` "M-tron Sự kiện cùng trọng số"
  - `m-mac-dinh` "M-mac-dinh Tham số mặc định"
- Ở 390 px, các `Select` xuống dòng và rộng `w-full`, trang không tràn ngang.
- Khi `scen` là `cold-user-{n}`, dưới thanh công cụ có dòng chữ phụ (`text-sm text-muted-foreground`): "Người dùng mới chỉ có sở thích khai báo và {n} sự kiện đầu tiên; chỉ số đo trên các LUT họ tải hoặc yêu thích sau đó."

### 6.3 Bảng "Các lần chạy"

- Thêm cột **"Kịch bản"** ngay sau "Thuật toán". Nhãn: `standard` → "Đánh giá chính"; `cold-user-{n}` → "Người mới · {n} sự kiện"; mã lạ → hiện nguyên mã.
- Ô "Thuật toán": khi `params.tuned === true` thì thêm `Badge` (variant `secondary`) **"tinh chỉnh"** sau nhãn. Mã thuật toán lạ vẫn hiện nguyên mã.
- Thêm 2 cột chỉ số cuối bảng (sau "Novelty@{K}"), 4 chữ số `vi-VN`:
  - **"LUT mới@{K}"** (`newLutHit`), tooltip "Tỉ lệ người dùng có ít nhất một LUT mới trong K gợi ý đầu"
  - **"R LUT mới@{K}"** (`newLutRecall`), tooltip "Tỉ lệ LUT mới liên quan được gợi ý, chỉ tính người có LUT mới liên quan"
  - Dòng thiếu trường (lần chạy của phần 1) → "—".
- Trạng thái rỗng: "Chưa có lần chạy đánh giá nào" (kèm mô tả cũ) khi `algo` rỗng và `scen` ∈ {`standard`, `all`}; còn lại "Không có lần chạy nào khớp bộ lọc."
- Giữ nguyên: tiêu đề và dòng phụ của card, checkbox, viền tách lô, phân trang 20 dòng, khung cuộn ngang, skeleton, lỗi.

### 6.4 Thẻ "So sánh hai lần chạy"

- Nhãn A / B: kịch bản `standard` giữ nguyên dạng cũ "A: #{id} {nhãn thuật toán} · lô {batchCode} · hạt giống {seed}". Kịch bản khác chèn nhãn kịch bản sau nhãn thuật toán: "A: #{id} {nhãn thuật toán} · {nhãn kịch bản} · lô {batchCode} · hạt giống {seed}".
- Bảng "Chỉ số" thêm 2 dòng cuối "LUT mới@{K}", "R LUT mới@{K}" (4 chữ số). Một bên thiếu trường → ô đó "—", "Chênh lệch" và "Thay đổi" "—".
- Bảng "Tham số" làm phẳng như cũ: có cả `tuning.*`, `elapsedMs` bị bỏ ở mọi cấp, giá trị boolean hiện "true" / "false".

## 7. Việc backend (agy BE)

Package `vn.aeoc.business.recommend.eval` (thêm gói con `tune`). **Không sửa** `ProfileBuilder`, `Recommender`, `ScoreCalculator`, `LutVectorIndex`, `CubeParser`, `ColorFeatureExtractor`. Không sửa **`CatalogGenerator`, `UserSimulator`, `CubeWriter`** (D1 phải sinh y hệt phần 1, `generatorVersion` giữ 1). Các hàm đang có của `EvalMetrics` giữ nguyên, chỉ thêm hàm mới. Cần thêm hàm public ở các lớp cấm sửa thì `ask` trước.

1. **Migration** `app/src/main/resources/db/migration/V15__tinh_chinh_goi_y.sql` đúng §4. Restart, rồi build lại để jOOQ sinh `REC_EVAL_RUN.SCENARIO`.
2. **Entity** `RecEvalRun`:
   - thêm `scenario` (String);
   - `CANONICAL_PARAM_ORDER` chèn `excludeSeen`, `newLutDays`, `newLutUserCount`, `historyEvents` giữa `catalogStart` và `elapsedMs`, và thêm `useDeclared`, `tuned`, `tuning` vào cuối;
   - thứ tự khoá con của `tuning` theo §5.1;
   - `CANONICAL_METRIC_ORDER` thêm `newLutHit`, `newLutRecall`.
3. **Repository / Service / Controller**: `list(algorithm, scenario, batch, pageable)` và `count(...)` thêm điều kiện `SCENARIO`. `RecEvalRunService.list(algorithm, scenario, batch, page, limit)`: trim `scenario`, chuỗi rỗng thì coi như `null`. `RecommendAdminController` `eval/list` thêm `@RequestParam(required = false) String scenario`.
4. **`EvalProperties`**:
   - thêm `tune`, `tuneTrials`, `excludeSeen`, `newLutDays`, `scenarios`, `coldUserEvents` theo §5.4;
   - `ALLOWED_ALGORITHMS` đủ 12 mã, kèm một hằng `ALGORITHM_ORDER` (List) theo §5.1;
   - `validate()` trả đúng khoá §5.4: `eval.tune-trials`, `eval.new-lut-days`, `eval.scenarios`, `eval.cold-user-events`.
   - `application-eval.yml` thêm mặc định §5.4.
5. **`TimeSplitter`** (giữ chữ ký `split(dataset, ix, phase, popularDays)` cũ, hành vi y hệt, để test phần 1 không đổi):
   - Thêm `split(dataset, ix, phase, popularDays, boolean excludeSeen, int newLutDays)`. Khi `excludeSeen` bật, ứng viên bỏ mọi LUT có sự kiện `VIEW` / `PREVIEW` / `FAVORITE` / `DOWNLOAD` ở phần dựng. `DISMISS` để các thuật toán tự loại như cũ.
   - `EvalCase` thêm `Set<Integer> newLutIds`: các LUT **trong ứng viên** có `publishedTime` ∈ (t0 − `newLutDays` ngày, t0]. Thêm constructor phụ không có trường này (mặc định tập rỗng) để test cũ vẫn biên dịch.
   - Thêm `coldUser(dataset, ix, List<Integer> nValues, int popularDays, boolean excludeSeen, int newLutDays)` → `LinkedHashMap<Integer, List<EvalCase>>` theo n tăng dần:
     - Chỉ xét người có `declaredSlugs` khác rỗng và số sự kiện > max(n).
     - Với từng n: sự kiện sắp theo (time, order); phần dựng = n sự kiện đầu `[0, n)`; t0 = thời điểm sự kiện thứ n (chỉ số n); phần kiểm = `[n, hết)`.
     - rel, ứng viên, exclude-seen, `newLutIds`, lượt tải trước t0 và 30 ngày trước t0 tính **đúng như** `split`. Chỉ bỏ điều kiện "≥ 5 sự kiện phần dựng".
     - Chỉ giữ người có ít nhất 1 LUT rel ≥ 2 ở **mọi** n, nên mọi danh sách có cùng tập người, cùng thứ tự `userId` tăng dần. `signals` của n = 0 là danh sách rỗng.
6. **`EvalMetrics`** thêm hai hàm tĩnh thuần. L = danh sách cắt K đầu, N_u = `newLutIds`, R_u = tập LUT rel ≥ 2, R_new = R_u ∩ N_u.
   - `newLutHit(L, newIds, k)` = 1 nếu L ∩ N_u ≠ ∅, ngược lại 0. Lấy trung bình trên **mọi** người được tính.
   - `newLutRecall(L, relNew, k)` = |L ∩ R_new| / |R_new|. Chỉ lấy trung bình trên những người có R_new ≠ ∅; không ai có thì bằng 0. Số người đó ghi vào `params.newLutUserCount`.
   - `random`: tính như các chỉ số khác, trung bình qua các lần lặp.
7. **`eval/tune` — đường tính nhanh cho tinh chỉnh.** Đường nhanh chỉ dùng để chọn tham số; số liệu ghi DB luôn tính bằng `Recommender.recommend` thật. Đường nhanh phải cho **đúng cùng danh sách id** với `Recommender.recommend` (TC-03), nên phép tính số thực phải đúng thứ tự như code gốc:
   - **`ItemSimMatrix`**: với mỗi cặp **có thứ tự** (a, b) trong kho, lưu 6 độ tương đồng thô tính đúng như trong `ScoreCalculator.itemSim(a, b, ·)`: `cosine(a.tag, b.tag)`, `rbf(a.color, b.color)`, `cosine(a.category, b.category)`, phong cách bằng nhau 1 / 0, `cosine(a.text, b.text)`, tác giả bằng nhau 1 / 0.
     - Lưu đủ cả (a, b) lẫn (b, a) vì `cosine` cộng tích theo thứ tự map nhỏ hơn, nên kết quả không đối xứng tuyệt đối. Kho 300 LUT tốn khoảng 4 MB; 2000 LUT khoảng 190 MB, chấp nhận được.
     - `sim(a, b, w)` = `max(0, min(1, w.tag·s0 + w.color·s1 + w.category·s2 + w.style·s3 + w.text·s4 + w.creator·s5))`, cộng từ trái sang phải đúng như `itemSim`.
   - **`UserBlockSims`**: cho một (ca đánh giá, hồ sơ), gồm danh sách ứng viên đã bỏ `Recommender.excludedIds(profile)` và 6 độ tương đồng thô với hồ sơ. Lấy bằng `ScoreCalculator.contributions(profile.mixed(), item, ONES)` với `ONES` = Weights(1, 1, 1, 1, 1, 1).
   - **`FastCbfRanker.rank(UserBlockSims u, ItemSimMatrix m, Weights w, double lambda, int candidateTop, int k)`**:
     - `w` luôn lấy từ `props.normalizedWeights()`.
     - Hồ sơ `POPULAR` thì gọi thẳng `Recommender.rankPopular`.
     - Còn lại: score = 0.0 rồi cộng lần lượt `w.tag·s0`, `w.color·s1`, `w.category·s2`, `w.style·s3`, `w.text·s4`, `w.creator·s5` (đúng thứ tự `LinkedHashMap` của `contributions`). Sắp xếp bằng đúng bộ so sánh của `rankByProfile` (score giảm dần, `downloadCount` giảm dần, id tăng dần), rồi gọi **`Recommender.selectPool(sorted, candidateTop, k, false)`** và **`Recommender.mmr(pool, simFn, k, lambda, Integer.MAX_VALUE)`**.
   - Hồ sơ không phụ thuộc trọng số khối, chỉ phụ thuộc (chu kỳ bán rã, k, trọng số sự kiện). Vì vậy mỗi bộ (chu kỳ bán rã, k) dựng hồ sơ và `UserBlockSims` một lần, rồi dùng lại cho mọi bộ trọng số và mọi λ.
8. **`eval/tune/WeightSampler` và `Tuner`** (một lượt, theo đúng thứ tự §8.6):
   - **Lấy mẫu trọng số**: bộ số 0 = trọng số mặc định đã chuẩn hoá. Các bộ sau rút bằng RNG tinh chỉnh (`rootRng.split()` lần thứ ba, sau hai lần split của phần 1):
     - rút 5 số khác nhau trong 1..25 bằng `rng.nextInt(25) + 1`, trùng thì rút lại, rồi sắp tăng p1 < … < p5;
     - các phần là (p1 − 1, p2 − p1 − 1, p3 − p2 − 1, p4 − p3 − 1, p5 − p4 − 1, 25 − p5), tổng bằng 20;
     - trọng số = phần / 20 theo thứ tự tag, color, category, style, text, creator;
     - bộ trùng với bộ đã có thì bỏ, rút tới khi đủ `eval.tune-trials` bộ khác nhau (tính cả bộ số 0).
   - **Bước 1 — trọng số (chỉ M)**: chấm mọi bộ với λ, chu kỳ bán rã, k mặc định → NDCG@10 trên tập kiểm định. Chọn bộ cao nhất; bằng nhau (|Δ| < 1e-12) thì lấy chỉ số nhỏ hơn.
   - **Bước 2 — λ ∈ {0.5, 0.6, 0.7, 0.8, 0.9, 1.0}**: với trọng số vừa chọn, gọi `ILD_base` = ILD@10 ở λ = 0.7 (ghi `validIldBase`). Trong các λ có ILD@10 ≥ 0.95 · `ILD_base` − 1e-12, chọn λ có NDCG@10 cao nhất; bằng nhau thì lấy λ gần 0.7 hơn, rồi λ nhỏ hơn.
   - **Bước 3 — chu kỳ bán rã ∈ {7, 14, 30, 60, 0 (∞)} × k ∈ {2, 5, 10}**, với trọng số và λ đã chọn: chọn NDCG@10 cao nhất. Bằng nhau thì ưu tiên (30, 5) nếu nó nằm trong nhóm bằng nhau, không thì lấy ô đầu theo thứ tự lưới (chu kỳ bán rã như liệt kê, rồi k tăng dần).
   - **B3**: trọng số cố định `{tag 1, còn lại 0}`; chạy bước 2 và 3. `weightTrials` = 0, `validNdcgWeights` = `validNdcgDefault`.
   - Mỗi bước đều có sẵn giá trị đang dùng (bộ mặc định ở bước 1, λ 0.7 luôn đạt ràng buộc ở bước 2, ô (30, 5) ở bước 3), nên `validNdcgDefault ≤ validNdcgWeights ≤ validNdcgLambda ≤ validNdcgFinal`.
   - **NDCG@10 và ILD@10 kiểm định** là trung bình trên các ca của `split(…, "valid", …, excludeSeen, newLutDays)`, tính bằng `EvalMetrics.ndcg` / `EvalMetrics.ild` đang có.
   - `TuningResult` giữ: tham số chọn, `tuning` (§5.1) và bảng chi tiết để in (5 bộ trọng số tốt nhất kèm bộ mặc định, bảng λ, lưới chu kỳ bán rã × k). Bảng chi tiết không ghi DB.
   - `Tuner` không bao giờ nhận ca `test`. Chỉ `EvalRunner` dựng ca, và ca truyền vào `Tuner` luôn là ca `valid`.
9. **`eval/algo`**:
   - Thêm `ConfiguredCbfAlgorithm(String code, LutVectorIndex ix, RecommendProperties props, boolean useDeclared)`: dựng hồ sơ bằng `ProfileBuilder.build(ix, c.signals(), useDeclared ? c.declaredSlugs() : List.of(), c.t0(), props)`, rồi xếp hạng bằng `Recommender.recommend(profile, c.candidates(), c.downloadCounts30DaysBeforeT0(), k, false, props)`.
   - `CbfFullAlgorithm`, `CbfTagAlgorithm` giữ được (TC-08 phần 1 vẫn pass) hoặc chuyển thành lớp mỏng gọi `ConfiguredCbfAlgorithm`.
   - Thêm `EvalVariants.props(code, T, T3, D)` → (bản sao sâu `RecommendProperties`, `useDeclared`) đúng bảng §5.1. Dùng `copyProperties` có sẵn; bean gốc không bao giờ bị đổi.
   - Biến thể bỏ khối (`m-mau`, `m-the`): đặt khối đó = 0, giữ nguyên các khối khác để `normalizedWeights()` tự chia lại. Nếu tổng còn lại bằng 0 (T chỉ có đúng khối bị bỏ) thì 5 khối còn lại mỗi khối 0.2.
10. **`EvalRunner`**:
    - Giữ `List<RecEvalRun> run(long seed, EvalProperties p, String batchCode)` và thêm `EvalSeedResult runWithReport(…)` (gồm danh sách dòng + `TuningResult` của M và B3 để in).
    - Thứ tự: sinh D1 → chỉ mục → `ItemSimMatrix` (chỉ khi cần tinh chỉnh) → `split(valid)` → tinh chỉnh M (khi có `cbf-full` hoặc `m-*` khác `m-mac-dinh` trong `algorithms`), tinh chỉnh B3 (khi có `cbf-tag`) → `split(test)` → 12 thuật toán → `coldUser` → các dòng `cold-user-*`.
    - `params` và `metrics` đúng §5.1. `userCount` = số ca của kịch bản. `createdTime` dùng chung cho cả lô.
11. **`EvalCommand`**: in đúng các phần §5.4 cho từng hạt giống. Nhãn dùng chung một bảng 12 mã §6.2; bảng cold-start lấy nhãn "B2 Phổ biến", "B3 CBF chỉ thẻ", "M CBF đủ đặc trưng", "M-kb Bỏ sở thích khai báo". Mã thoát giữ như phần 1.
12. **Hiệu năng**: lần chạy mặc định (300 LUT, 500 người, 1 hạt giống, tune 500 bộ, 2 kịch bản) **≤ 10 phút** trên máy dev. Báo thời gian thật trong `worker_done`. Quá 10 phút thì `ask` trước khi tối ưu; không được thay đường thật bằng đường nhanh khi tính số liệu cuối, và không được dùng đa luồng.
13. **Tự kiểm trước `worker_done`**:
    - `mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh;
    - restart (V15 đã áp);
    - chạy lệnh mặc định **hai lần** (lô L1, L2) để Claude có dữ liệu E2E; báo `batchCode` và thời gian của hai lô.

    Lệnh (từ gốc repo, sau `mvn -q -DskipTests package` trong `backend/`): `java -jar backend/app/target/aeoc-backend.jar --spring.profiles.active=local,eval --eval.seeds=42`. Lệnh chạy vài phút, nên chạy với timeout ≥ 15 phút, không chạy foreground không có timeout.

Unit test bắt buộc: các TC loại `unit` ở §9 + bộ tối thiểu của `backend/AGENTS.md` cho list. Test cũ của phần 1 (`EvalUnitTest`, `RecEvalRunServiceTest`) phải xanh. Chỉ được sửa test cũ khi cần ghi rõ tham số cũ (ví dụ `algorithms` 5 mã, `tune=false`, `exclude-seen=false`, `scenarios=standard`), **không đổi kỳ vọng**.

## 8. Việc frontend (agy FE)

1. `lib/types/recommend.ts`: `EvalMetricSetDTO` thêm `newLutHit?: number`, `newLutRecall?: number`; `RecEvalRunDTO` thêm `scenario: string`; `EvalListParams` thêm `scenario?: string`.
2. `lib/axios/recommend-admin.ts`: `listEvalRuns` gửi `scenario` khi có.
3. `lib/tanstack/options/recommend-admin.ts`: key của `createEvalRunsQueryOptions` thêm `scenario` (sau `algorithm`).
4. `components/admin/recommend/labels.ts`:
   - `EVAL_ALGORITHMS` đủ 12 mã theo thứ tự §5.1, `EVAL_ALGORITHM_LABELS` thêm 7 nhãn §6.2;
   - thêm `EVAL_SCENARIO_OPTIONS` (6 mục §6.2) và `evalScenarioLabel(code)` (§6.3);
   - `EVAL_METRICS` thêm 2 mục §6.3, đánh dấu `optional: true` để ô thiếu trường hiện "—".
5. `components/admin/recommend/eval-runs-table.tsx`: `Select` "Kịch bản", độ rộng hai `Select`, dòng chữ phụ của kịch bản người mới, cột "Kịch bản", `Badge` "tinh chỉnh", 2 cột mới, logic trạng thái rỗng §6.3.
6. `components/admin/recommend/eval-compare-card.tsx`: nhãn A / B §6.4, 2 dòng chỉ số mới, xử lý trường thiếu.
7. `components/admin/recommend/eval-tab.tsx`: nhận `scen`, gọi `list` với `scenario` theo §6.1, chuyển `onScenarioChange`.
8. `routes/admin/goi-y.tsx`: search schema thêm `scen` (§6.1) và truyền xuống `EvalTab`; không đổi ba thẻ còn lại.
9. `lib/api.gen.ts`: chạy `pnpm api:types` nếu backend :9500 đã có `scenario`. Nếu chưa, ghi trong `worker_done` để Claude chạy lại ở bước review.

Component shadcn dùng: có sẵn `select`, `badge`, `tooltip`, `table`, `checkbox`, `card`, `button`, `skeleton`, `empty`; không cần `shadcn add`.

## 9. Test case

### 9.1 Dữ liệu tính tay

**(a) LUT mới — TC-08.** Ba người, K = 5 và K = 2:

| Người | L | `newLutIds` | R (rel ≥ 2) | R_new |
|---|---|---|---|---|
| u1 | [A, B, C, D, E] | {C, F} | {B, F} | {F} |
| u2 | [F, G, H, I, J] | {F, G} | {F} | {F} |
| u3 | [A, B, C, D, E] | ∅ | {A} | ∅ |

| Chỉ số | K = 5 | K = 2 |
|---|---|---|
| newLutHit từng người | 1, 1, 0 → trung bình **0.6667** | 0, 1, 0 → **0.3333** |
| newLutRecall (chỉ u1, u2) | 0, 1 → **0.5000** | 0, 1 → **0.5000** |
| newLutUserCount | 2 | 2 |

Biên: không người nào có R_new → `newLutRecall` = 0, `newLutUserCount` = 0, không lỗi chia 0.

**(b) Biến thể bỏ khối — TC-02.** T = {tag 0.30, color 0.25, category 0.15, style 0.15, text 0.10, creator 0.05}:
- `m-mau` → {0.4000, 0, 0.2000, 0.2000, 0.1333, 0.0667}
- `m-the` → {0, 0.3571, 0.2143, 0.2143, 0.1429, 0.0714}
- T = {0, 1, 0, 0, 0, 0}: `m-mau` → {0.2, 0, 0.2, 0.2, 0.2, 0.2}

**(c) Chọn λ — TC-04.** Kết quả kiểm định giả (λ: NDCG@10, ILD@10): 0.5: 0.10, 0.80 · 0.6: 0.11, 0.78 · 0.7: 0.11, 0.76 · 0.8: 0.12, 0.73 · 0.9: 0.13, 0.70 · 1.0: 0.14, 0.60.
- `ILD_base` = 0.76, ngưỡng 0.722.
- λ đạt ngưỡng: 0.5, 0.6, 0.7, 0.8. Chọn **0.8**.
- Mọi NDCG bằng nhau → chọn 0.7.
- Chỉ 0.6 và 0.8 cùng cao nhất (0.12) và đều đạt ngưỡng → chọn 0.6 (cùng cách 0.7, lấy λ nhỏ hơn).

**(d) Kịch bản người mới — TC-07.** Mọi LUT xuất bản 2026-01-01. Thời điểm t1 … t8 cách nhau 1 ngày, t1 = 2026-03-01.
- Người A (khai báo `am-ap`): e0 t1 VIEW 1 · e1 t2 PREVIEW 1 · e2 t3 DOWNLOAD 1 · e3 t4 VIEW 2 · e4 t5 VIEW 3 · e5 t6 VIEW 4 · e6 t7 PREVIEW 4 · e7 t8 FAVORITE 4.
- Người B (khai báo `lanh`): e0 VIEW 5 · e1 PREVIEW 5 · e2 FAVORITE 5 · e3…e7 VIEW 6, 7, 8, 9, 10.
- Người C (không khai báo): sự kiện giống A.

| n | t0 của A | R của A | Ứng viên của A (exclude-seen) | signals của A |
|---|---|---|---|---|
| 0 | t1 | {1, 4} (rel 1 = 3, rel 4 = 2) | đủ | rỗng |
| 1 | t2 | {4} | bỏ 1 | VIEW 1 |
| 3 | t4 | {4} | bỏ 1 | VIEW 1, PREVIEW 1, DOWNLOAD 1 (mỗi loại count 1) |
| 5 | t6 | {4} (rel 2) | bỏ 1, 2, 3 | thêm VIEW 2, VIEW 3 |

B có R = ∅ từ n = 3 (vì 5 nằm ở phần dựng), nên bị loại ở **mọi** n. C không khai báo nên bị loại. Kết quả: mỗi n đúng một ca (người A). Với `excludeSeen = false` ở n = 5, ứng viên vẫn có 1, 2, 3.

### 9.2 Bảng test case

Tiền điều kiện chung cho `api` / `e2e`:
- backend :9500 đã có V15;
- agy BE đã chạy hai lần lệnh mặc định `--eval.seeds=42`. Spec tìm hai lô này qua `eval/list?algorithm=m-mac-dinh&scenario=standard&limit=2`: **L2** = lô mới nhất có `m-mac-dinh`, **L1** = lô liền trước;
- vẫn còn lô của phần 1 (dòng có `params` không có `excludeSeen`).

| ID | Loại | Mô tả | Tiền điều kiện | Bước | Kết quả mong đợi |
|---|---|---|---|---|---|
| TC-01 | unit | `WeightSampler` | seed 42, trials 500 | Rút hai lần; rút với seed 7 | 500 bộ khác nhau; bộ 0 = mặc định chuẩn hoá; mọi bộ khác: 6 số không âm, mỗi số × 20 là số nguyên (sai số 1e-9), tổng 1 (sai số 1e-9); hai lần seed 42 giống hệt, seed 7 khác |
| TC-02 | unit | `EvalVariants.props` | T, T3, D như §9.1 (b), bean `RecommendProperties` mặc định | Lấy props của 9 mã CBF | Đúng bảng §5.1: `m-mau`, `m-the` khớp §9.1 (b) sai số 1e-4 (sau `normalizedWeights()`); `m-giam` halfLife 0; `m-mmr` λ 1.0; `m-kb` useDeclared false; `m-tron` 7 loại dương = 1.0, DISMISS = −1.0; `m-mac-dinh` = D; `cbf-tag` tag 1 + T3; sau khi gọi, bean vẫn có `weights.tag` 0.30, `mmrLambda` 0.7 |
| TC-03 | unit | Đường nhanh bằng đường thật | Kho 80 LUT, 60 người, seed 7; ca `valid` và `test` có exclude-seen (lấy 30 ca đầu mỗi chế độ) | Với 8 bộ trọng số (mặc định, chỉ thẻ, 6 bộ của `WeightSampler`) × λ {0.5, 1.0} × (chu kỳ bán rã, k) {(30, 5), (0, 2)}: so `FastCbfRanker.rank(…, K = 20)` với `Recommender.recommend(ProfileBuilder.build(…), candidates, counts30, 20, false, props)` | Hai danh sách id **bằng nhau tuyệt đối** ở mọi tổ hợp (kể cả thứ tự) |
| TC-04 | unit | Quy tắc chọn của `Tuner` | Kết quả giả | (1) chọn trọng số: NDCG [0.05, 0.07, 0.07, 0.06]; (2) λ như §9.1 (c), 3 trường hợp; (3) lưới: (14, 2) và (30, 5) cùng cao nhất / (14, 2) và (60, 10) cùng cao nhất | (1) chỉ số 1; (2) 0.8 / 0.7 / 0.6; (3) (30, 5) / (14, 2) |
| TC-05 | unit | `Tuner` chạy thật cỡ nhỏ | Kho 80, 60 người, seed 7, trials 30 | Tinh chỉnh M và B3 hai lần | Hai lần giống hệt; M: `weightTrials` 30, bảng trọng số 30 dòng, bảng λ 6 dòng, lưới 15 ô; `validNdcgDefault ≤ Weights ≤ Lambda ≤ Final`; λ ∈ lưới, chu kỳ bán rã ∈ {7, 14, 30, 60, 0}, k ∈ {2, 5, 10}; B3: trọng số vẫn chỉ thẻ, `weightTrials` 0; `validUserCount` = số ca `split(valid)`; bean không đổi |
| TC-06 | unit | `TimeSplitter.split` exclude-seen + LUT mới | Dữ liệu TC-03 của phần 1 (người 1), thêm: t1 … t10 cách 1 ngày từ 2026-03-01; X, Y, P, Q, W, V, M xuất bản 2026-01-01; LUT R xuất bản 2026-02-27 | `test`, `excludeSeen` true / false; `newLutDays` 14 / 7 | true: ứng viên không có X, Y, P, Q, V, N; có M, W, R. false: như phần 1 (có X …). `newLutIds` = {R} với 14 ngày, ∅ với 7 ngày. rel, R, signals, t0 giống hệt phần 1 |
| TC-07 | unit | `TimeSplitter.coldUser` | §9.1 (d) | `nValues` [0, 1, 3, 5], exclude-seen true; rồi false | Đúng bảng §9.1 (d): mỗi n một ca của A, t0 / R / ứng viên / signals như bảng; B, C bị loại; với false ở n = 5 ứng viên có 1, 2, 3 |
| TC-08 | unit | `EvalMetrics` LUT mới | §9.1 (a) | Tính K = 5, K = 2; biên không có R_new | Khớp §9.1 (a) sai số 1e-4; biên = 0, không ngoại lệ |
| TC-09 | unit | `EvalRunner` cỡ nhỏ | luts 80, users 60, seed 7, trials 30, mặc định còn lại | Chạy hai lần; chạy thêm với `tune=false` | 28 dòng đúng thứ tự và `scenario` §5.1; `params` đúng khoá và thứ tự từng loại; `tuning` chỉ ở `cbf-tag`, `cbf-full` `standard`; `tuned` đúng §5.1; `m-*` lấy đúng T; mỗi kịch bản cùng `userCount`; 16 dòng `cold-user-*` cùng `userCount`; `historyEvents` = n; `metrics` đủ 3 K × 10 trường, trong khoảng hợp lệ (như TC-09 phần 1, `newLutHit` / `newLutRecall` ∈ [0, 1]); hai lần giống hệt (trừ `elapsedMs`). `tune=false`: không có `tuning`, `tuned` false, `metrics` của `m-mac-dinh` = `cbf-full` |
| TC-10 | unit | `EvalProperties.validate` khoá mới | | `tune-trials` 0 / 5001; `new-lut-days` 0 / 61; `scenarios` [] / [xyz]; `cold-user-events` [-1] / [11] / [3, 3]; `algorithms` [m-mau, cbf-full] (hợp lệ); mặc định | Lỗi đúng khoá `eval.tune-trials` ×2, `eval.new-lut-days` ×2, `eval.scenarios` ×2, `eval.cold-user-events` ×3; hai trường hợp cuối hợp lệ |
| TC-11 | unit | Service lọc `scenario` | Mock repository | `list(null, " cold-user-3 ", null, 1, 20)`; `list(null, "  ", …)` | Repository nhận `"cold-user-3"` / `null` |
| TC-12 | unit | Hồi quy phần 1 | | `mvn test` module `business` | `EvalUnitTest` (TC-01 → 10 phần 1), `RecEvalRunServiceTest` xanh, kỳ vọng không đổi |
| TC-13 | cli | Lệnh mặc định | Backend đã build | Claude xem log hai lần chạy của agy BE; tự chạy lại một lần, đo thời gian | Mã 0, ≤ 10 phút; stdout có đủ tiêu đề §5.4 ("-- Tinh chỉnh M trên tập kiểm định", "-- So sánh với baseline (K = 10) --", "-- Bỏ bớt thành phần (K = 10) --", "-- Người mới: NDCG@10 theo số sự kiện n", "-- LUT mới: xuất bản trong 14 ngày trước t0"); bảng bỏ bớt có 8 dòng, bảng người mới 4 dòng; `rec_eval_run` thêm 28 dòng cùng `batch_code` |
| TC-14 | cli | Chạy lại đúng phần 1 (A2) | Có lô phần 1 seed 42 (ví dụ `20261112-034424`) | Chạy lệnh A2 | Mã 0; 5 dòng `standard`; 8 chỉ số cũ ở cả 3 K và `userCount` **bằng đúng** lô phần 1 cùng thuật toán; có thêm `newLutHit`, `newLutRecall`; `excludeSeen` false, `tuned` false ở `cbf-tag` / `cbf-full` |
| TC-15 | cli | Tham số sai | | `--eval.scenarios=xyz`; `--eval.tune-trials=0` | Mã 2; in "Tham số đánh giá không hợp lệ: eval.scenarios" / "…: eval.tune-trials"; số dòng `rec_eval_run` không đổi |
| TC-16 | api | Phân quyền | | `eval/list?scenario=standard`, `eval/get?id=<id L2>` với khách mới, `noaccess`, không token | Khách mới, `noaccess`: 403 `FORBIDDEN` "… Path: /recommend/, Action: VIEW"; không token: 401 |
| TC-17 | api | Kịch bản chính của L2 | L2 | `eval/list?batch=<L2>&scenario=standard&limit=20` | `total` 12; `algorithm` đúng thứ tự 12 mã; mọi `scenario` "standard"; cùng `userCount`; `excludeSeen` true, `newLutDays` 14, `generatorVersion` 1; `tuned` true ở `cbf-tag`, `cbf-full`, `m-mau` … `m-tron`, false ở `m-mac-dinh`, không có khoá ở B1, B2, B2-dd; `tuning` chỉ ở `cbf-tag`, `cbf-full`; `cbf-full.tuning`: `weightTrials` 500, `validNdcgDefault ≤ Weights ≤ Lambda ≤ Final`; `cbf-full.weights` tổng 1 (± 1e-3), `mmrLambda` ∈ {0.5 … 1.0}, `halfLifeDays` ∈ {7, 14, 30, 60, 0}, `coldStartK` ∈ {2, 5, 10}; `cbf-tag.weights.tag` 1, `cbf-tag.tuning.weightTrials` 0 |
| TC-18 | api | Biến thể suy ra từ M | L2 | Đọc 12 item của TC-17 và `GET /recommend/config` | `m-mau.weights.color` 0, các khối khác = M ÷ (1 − M.color) (± 1e-3; nếu M.color = 1 thì mỗi khối 0.2); `m-the` tương tự với `tag`; `m-giam.halfLifeDays` 0, còn lại = M; `m-mmr.mmrLambda` 1; `m-kb.useDeclared` false; `m-tron.eventWeights` 7 loại = 1, DISMISS = −1; `m-mac-dinh`: `weights` = `normalizedWeights`, `eventWeights`, `halfLifeDays`, `coldStartK`, `mmrLambda` = `config` (`half-life-days`, `cold-start-k`, `mmr-lambda`) |
| TC-19 | api | `metrics` và kiểm tra hợp lý | L2 `standard` | Đọc 12 item | Mỗi item đủ "5", "10", "20" × 10 trường; precision / recall / ndcg / hitRate / coverage / newLutHit / newLutRecall ∈ [0, 1]; recall, hitRate, newLutHit không giảm theo K; ndcg@10 và recall@10 của `cbf-full` > `random`; coverage@10 `random` > `popular`. M so với B2, M so với `m-mac-dinh`: **không** kiểm, báo cáo đúng số đo |
| TC-20 | api | Kịch bản người mới | L2 | `eval/list?batch=<L2>&scenario=cold-user-{n}` với n = 0, 1, 3, 5 | Mỗi n đúng 4 item thứ tự `popular`, `cbf-tag`, `cbf-full`, `m-kb`; cả 16 item cùng `userCount` (> 0); `params.phase` "cold-user", `historyEvents` = n; `m-kb.useDeclared` false; `cbf-full` cùng `weights` / `mmrLambda` / `halfLifeDays` / `coldStartK` với `cbf-full` `standard` của L2 |
| TC-21 | api | Chạy lại ra đúng kết quả (NFR-08) | L1, L2 | `eval/list?batch=<L1>&limit=100` và `<L2>`, ghép theo (`scenario`, `algorithm`) | 28 cặp; `metrics`, `userCount`, `scenario` giống hệt; `params` giống hệt sau khi bỏ `elapsedMs` ở mọi cấp (kể cả `tuning.elapsedMs`) |
| TC-22 | api | Lọc và `get` | L1, L2, lô phần 1 | (1) `scenario=cold-user-3`; (2) `scenario=khong-co`; (3) `scenario=%20cold-user-3%20`; (4) `scenario=cold-user-3&algorithm=m-kb`; (5) không `scenario`, `batch=<L2>`; (6) `get?id=<id một dòng phần 1>`; (7) `get?id=<id m-kb cold-user-0 L2>`; (8) `get?id=999999` | (1) mọi item `cold-user-3`, item đầu thuộc L2; (2) `total` 0, `items` []; (3) như (1); (4) mọi item `m-kb` + `cold-user-3`; (5) `total` 28; (6) `scenario` "standard", không có `newLutHit`; (7) bằng đúng item tương ứng của `list` (so sâu); (8) 404 `DATA_NOT_FOUND` "Không tìm thấy lần chạy đánh giá" |
| TC-23 | e2e | Kịch bản mặc định | admin, L2 | `/admin/goi-y` → "Đánh giá" | Đúng 1 request `eval/list` có `scenario=standard&page=1&limit=20`; "Kịch bản" hiện "Đánh giá chính"; 12 dòng đầu (L2) có nhãn đúng thứ tự §6.2; cột "Kịch bản" "Đánh giá chính"; badge "tinh chỉnh" ở đúng 8 dòng (B3, M, M-mau, M-the, M-giam, M-mmr, M-kb, M-tron); có tiêu đề cột "LUT mới@10", "R LUT mới@10", rê chuột "LUT mới@10" thấy tooltip §6.3; ô "LUT mới@10" dòng M = `metrics["10"].newLutHit` định dạng `vi-VN` 4 chữ số; một dòng phần 1 (lọc `algo=cbf-full`, trang có lô cũ) hiện "—" ở 2 cột mới |
| TC-24 | e2e | Đổi kịch bản | Như TC-23 | "Kịch bản" → "Người mới · 3 sự kiện"; rồi "Tất cả kịch bản" | URL `scen=cold-user-3`, request `scenario=cold-user-3&page=1`; 4 dòng đầu "B2 Phổ biến", "B3 CBF chỉ thẻ", "M CBF đủ đặc trưng", "M-kb Bỏ sở thích khai báo"; cột "Kịch bản" "Người mới · 3 sự kiện"; thấy dòng "Người dùng mới chỉ có sở thích khai báo và 3 sự kiện đầu tiên; chỉ số đo trên các LUT họ tải hoặc yêu thích sau đó."; "Tất cả kịch bản" → URL `scen=all`, request **không** có `scenario` |
| TC-25 | e2e | Lọc biến thể | Như TC-23 | "Thuật toán" → "M-mau Bỏ khối màu" | Request có `algorithm=m-mau` và `scenario=standard`; mọi dòng nhãn "M-mau Bỏ khối màu"; URL `algo=m-mau` |
| TC-26 | e2e | So sánh M với M-mac-dinh; so sánh dòng người mới | L2 | (a) Tích dòng M và M-mac-dinh của L2 → "So sánh"; (b) mở `?tab=danh-gia&scen=cold-user-0&a=<id popular cold-user-0 L2>&b=<id cbf-full cold-user-0 L2>` | (a) Nhãn "A: #… M CBF đủ đặc trưng · lô L2 · hạt giống 42" (không có nhãn kịch bản); bảng "Chỉ số" có dòng "LUT mới@10", "R LUT mới@10"; bảng "Tham số": dòng `tuned` A "true" B "false" có "khác", dòng `tuning.validNdcgFinal` B "—" có "khác", dòng `excludeSeen` không có "khác". (b) Nhãn "A: #… B2 Phổ biến · Người mới · 0 sự kiện · lô L2 · hạt giống 42"; "Kịch bản" hiện "Người mới · 0 sự kiện"; 2 dòng được tích |
| TC-27 | e2e | URL sai và trạng thái rỗng theo kịch bản | admin | (a) Mở `?tab=danh-gia&scen=abc`; (b) chặn `**/recommend/eval/list*` trả `{ total 0, page 1, items [] }`, mở `?tab=danh-gia`; (c) như (b) với `scen=cold-user-3` | (a) "Kịch bản" hiện "Đánh giá chính", request có `scenario=standard`, trang không lỗi; (b) "Chưa có lần chạy đánh giá nào"; (c) "Không có lần chạy nào khớp bộ lọc." |
| TC-28 | e2e | Điện thoại | Viewport 390×844, admin | `?tab=danh-gia&scen=cold-user-0` | `findHorizontalOverflow` rỗng; khung bảng cuộn ngang được; hai `Select` hiện đủ, không tràn |

Loại: `unit` = agy BE (JUnit) · `cli` = Claude chạy tay ở bước review BE · `api` / `e2e` = Claude trong `frontend/tests/e2e/tinh-chinh-goi-y.spec.ts`.

### 9.3 Đối chiếu

- Endpoint §5 → TC `api`: `eval/list` TC-16 → 22 · `eval/get` TC-16, 22.
- Lỗi §5.3 → TC `api`: 401 / 403 TC-16 · 404 TC-22. Lỗi dòng lệnh §5.4 → TC-10 (unit), TC-15 (cli).
- Luồng §3: chính 1 TC-01 → 09, 13 · chính 2 TC-23, 24 · chính 3 TC-26 · A1 TC-09 · A2 TC-14 · A3 TC-09 (ghi chú: Claude chạy thêm `--eval.scenarios=cold-user` nếu còn thời gian) · A4 TC-24 · A5 TC-26 · E1 TC-16 · E2 TC-22 · E3 TC-10, 15 · E4 TC-27 · E5 hồi quy TC-24 của `danh-gia-goi-y.spec.ts`.
- Thiết kế: §8.6 bước 3 TC-01, 04, 05 · §8.5 biến thể TC-02, 18 · §8.4.4 người mới TC-07, 20 · §8.4.4 LUT mới TC-06, 08 · NFR-08 TC-21 · "đánh giá gọi đúng code thật" TC-03, TC-14.
- Tổng: 12 `unit` (TC-01 → 12), 3 `cli` (TC-13 → 15), 7 `api` (TC-16 → 22), 6 `e2e` (TC-23 → 28).

## 10. Tiêu chí hoàn thành

- [x] Mọi TC ở §9 pass. Hồi quy `danh-gia-goi-y.spec.ts`, `quan-tri-goi-y.spec.ts` vẫn pass. Lô mới nhất nay có 28 dòng, nên Claude sửa `danh-gia-goi-y.spec.ts` để L1, L2 là hai lô cũ của phần 1 (dòng có `params` không có `excludeSeen`), không còn là hai lô mới nhất.
- [x] `mvn test`, `pnpm build`, `pnpm lint` xanh
- [x] `ProfileBuilder`, `Recommender`, `ScoreCalculator`, `LutVectorIndex`, `CubeParser`, `ColorFeatureExtractor`, `CatalogGenerator`, `UserSimulator`, `CubeWriter` không đổi (diff rỗng)
- [x] Lệnh mặc định ≤ 10 phút / hạt giống
- [x] Bảng in ra của lô seed 42 (cả phần tinh chỉnh) chép vào `docs/chuc-nang/tinh-chinh-goi-y.md` kèm nhận xét đúng số đo, kể cả khi M vẫn thua B2
- [x] Có `docs/chuc-nang/tinh-chinh-goi-y.md`

## 11. Rủi ro / câu hỏi mở

Mỗi mục dưới đây plan đã chọn sẵn một phương án và đã viết vào §4 → §9. Nói "duyệt" là giữ tất cả; muốn đổi mục nào thì ghi số mục.

1. **Loại LUT đã xem khỏi ứng viên, chỉ ở trình đánh giá, áp cho mọi thuật toán** (`eval.exclude-seen` mặc định `true`).
   - Thiết kế §8.3 định nghĩa LUT liên quan là LUT "chưa có tín hiệu dương trong phần dựng hồ sơ", và phần 1 tính cả VIEW / PREVIEW là tín hiệu dương. Vì vậy gợi ý lại LUT đã xem chắc chắn bị tính sai. CBF chịu thiệt nặng nhất, vì LUT đã xem chính là LUT giống hồ sơ nhất.
   - Phương án khác: thu hẹp "tín hiệu dương" về FAVORITE / DOWNLOAD, khi đó LUT đã xem mà sau này tải vẫn tính là đúng.
   - `Recommender` của cửa hàng **không đổi**: "Dành cho bạn" vẫn có thể hiện LUT khách đã xem. Có nên bỏ LUT đã xem khỏi "Dành cho bạn" hay không là quyết định sản phẩm, để lát khác nếu cần.
2. **Thứ tự tinh chỉnh một lượt**: trọng số → λ → chu kỳ bán rã × k, đúng thứ tự liệt kê ở §8.6. Mỗi bước có sẵn giá trị đang dùng, nên NDCG kiểm định không giảm qua các bước.
3. **Chu kỳ bán rã ∞ ghi là `halfLifeDays = 0`**: đúng ngữ nghĩa sẵn có của `ProfileBuilder` và chú thích trong `application.yml` ("≤ 0 nghĩa là không suy giảm"). JSON không có giá trị vô cực.
4. **M-mac-dinh = toàn bộ tham số mặc định** (trọng số, λ, chu kỳ bán rã, k), tức đúng cấu hình cửa hàng hiện tại, để đo được toàn bộ lợi ích của tinh chỉnh. Thiết kế §8.5 ghi "trọng số khối mặc định, không tinh chỉnh". Phương án khác: chỉ trọng số mặc định, λ / chu kỳ bán rã / k lấy từ kết quả tinh chỉnh.
5. **M-tron**: 7 loại sự kiện dương có trọng số 1, DISMISS giữ dấu là −1. Nếu đặt DISMISS = +1 thì LUT bị bỏ qua lại kéo hồ sơ về phía nó.
6. **M-kb**: không truyền sở thích khai báo (`useDeclared = false`). Người được tính đều đã có hành vi, nên cách này tương đương α = 0. Ở kịch bản người mới n = 0, M-kb tự rơi về phổ biến xen kẽ, đúng như cửa hàng khi khách bỏ qua bước chọn phong cách.
7. **LUT mới = LUT xuất bản trong 14 ngày trước t0** (`eval.new-lut-days`). Thiết kế §8.4.4 viết "xuất bản trong giai đoạn kiểm tra", nhưng từ phần 1 ứng viên chỉ gồm LUT xuất bản ≤ t0, nên không thuật toán nào gợi ý được LUT xuất bản sau t0. LUT xuất bản ngay trước t0 vẫn có rất ít lượt tải, nên vẫn đo đúng bài toán LUT mới. Kho 300 LUT rải trong 120 ngày cho khoảng 35 LUT mới mỗi ca.
8. **Kịch bản người mới**:
   - chỉ tính người có khai báo (H4 hỏi về bước chọn phong cách);
   - phần kiểm là mọi sự kiện từ vị trí n đến hết;
   - cùng một tập người cho cả 4 giá trị n, để đường NDCG theo n so sánh được;
   - thêm **M-kb** vào Bảng 8.4 (thiết kế chỉ có B2, B3, M), để thấy trực tiếp tác dụng của sở thích khai báo.
9. **Thêm cột `scenario`** vào `rec_eval_run` (thiết kế §4.7 không có), thay vì nhét kịch bản vào `params`: lọc bằng chỉ mục được và giao diện có bộ lọc riêng.
10. **Không ghi trọng số đã tinh chỉnh vào `recommend.*` của cửa hàng** ở lát này. Mỗi hạt giống cho một kết quả tinh chỉnh khác nhau; nên chọn sau `kiem-dinh-goi-y` (5 hạt giống), ví dụ lấy trung vị, rồi sửa `application.yml` bằng một bản sửa nhỏ.
11. **Không đổi bộ mô phỏng D1**, kể cả khi M vẫn thua B2 sau lát này. β_u (chạy theo số đông) và "nửa phổ biến, nửa ngẫu nhiên" đều nằm trong thiết kế §8.2.1, §8.9. Sửa bộ mô phỏng cho tới khi M thắng là chỉnh dữ liệu theo kết quả. Kết quả báo cáo đúng như đo được (§8.1); nếu M thua, phân tích nguyên nhân trong báo cáo.
12. **Đường nhanh khi tinh chỉnh** (§7 mục 7): 500 bộ trọng số chạy bằng đường thật mất khoảng 500 × 8 giây ≈ 65 phút, nên phần tìm tham số dùng ma trận tương đồng tính trước. TC-03 bắt buộc hai đường cho **cùng danh sách** ở mọi tổ hợp thử. Số liệu ghi DB vẫn chạy bằng `Recommender.recommend` thật.
13. **Rủi ro quá khớp**: tập kiểm định chỉ có khoảng 8% sự kiện của mỗi người (ước tính 150 đến 250 người được tính), mà phải chọn 1 trong 500 bộ trọng số. Vì vậy M đã tinh chỉnh có thể không hơn M-mac-dinh trên phần kiểm. Trường `tuning.validNdcg*` cho phép so kết quả trên tập kiểm định với phần kiểm; báo cáo ghi rõ nếu xảy ra. 5 hạt giống ở `kiem-dinh-goi-y` sẽ cho thấy độ ổn định.
14. **Thời gian chạy**: ước tính 3 đến 5 phút mỗi hạt giống (tinh chỉnh khoảng 1 phút, 9 thuật toán CBF trên phần kiểm khoảng 75 giây, kịch bản người mới khoảng 1 phút); giới hạn 10 phút.

## 12. Nhật ký thực hiện (do /cook và /doc-chuc-nang ghi — nối các phiên A/B/C)

| Thời điểm | Sự kiện |
|---|---|
| 2026-11-12 | Lập plan (draft) |
| 2026-11-12 | Người dùng duyệt (approved), giữ cả 14 phương án mặc định §11 |
| 2026-11-12 | Phiên A — bắt đầu cook (status in-progress). Preflight xanh: Orca ready, MySQL/MinIO healthy, backend :9500 200. File bẩn có sẵn trước khi giao (không phải của worker): `.env.example`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `backend/.env.example`, `backend/CLAUDE.md`, `backend/app/src/main/resources/application.yml`, `backend/authenticate/.../RestService.java`, `backend/business/.../billing/service/OrderService.java`, `docker-compose*.yml`, `docs/plan/README.md`, `docs/tai-lieu-thiet-ke.md`, `frontend/.env.example`, `frontend/AGENTS.md`, `frontend/playwright.config.ts`, `frontend/src/components/shop/home/{hero-section.tsx,home-data.ts}`, `frontend/vite.config.ts`, `plan/*` (README, _template, go-redis-mail, goi-thanh-toan, kho-lut, tai-lut, thiet-ke-tong-quat, trang-chu, tasks/kho-lut-*), `scripts/ai/chup-anh-readme.mjs` |
| 2026-11-12 | E2E nghiệm thu: `frontend/tests/e2e/tinh-chinh-goi-y.spec.ts` (API TC-16 → 22, UI TC-23 → 28; `--list` 13 test). Sửa `danh-gia-goi-y.spec.ts` theo §10: nhóm API chọn L1/L2 là hai lô phần 1 (params không có `excludeSeen`); nhóm giao diện chuyển sang `latestStd()` = lô mới nhất `scenario=standard` (5 dòng đầu vẫn random → cbf-full), vì thẻ mặc định lọc `standard` và lô phần 1 không còn ở trang 1; cập nhật tiêu đề cột (thêm "Kịch bản", 2 cột LUT mới), nhãn thuật toán cho phép badge "tinh chỉnh", bảng "Chỉ số" so sánh 9 → 11 dòng, `weights.tag` của M không còn cố định 0,3 |
| 2026-11-12 | Task spec: `plan/tasks/tinh-chinh-goi-y-be.md` (BE tự chạy lệnh mặc định 2 lần → L1, L2), `plan/tasks/tinh-chinh-goi-y-fe.md`. Orca run `run_bab615aa1a02`, coordinator `term_9684e52e-0cf0-4f36-be3c-feb0b35e5d90` (mọi lệnh kèm `--from`, `check` kèm `--terminal`; worktree `path:C:/Users/JulytusChu/Desktop/Code/DownBeat`) |
| 2026-11-12 | agy BE: dispatch `ctx_7b37b1677bb7`, terminal `term_3793d4ba-5e65-48fc-bac1-d57dde6feb30` (gemini-3.8-flash-high) · agy FE: dispatch `ctx_08b6bb230824`, terminal `term_beb31512-36f2-4e56-8209-89cd092c25be` (gemini-3.8-flash-high). Cả hai đã nhận đề (Working / Generating) |
| 2026-11-12 | **phiên A xong** — phiên B: `/cook tinh-chinh-goi-y` → bước 4 (check `--run run_bab615aa1a02 --terminal term_9684e52e-0cf0-4f36-be3c-feb0b35e5d90`) |
| 2026-11-12 | Phiên B — agy FE `worker_done` (succeeded, 03:29Z): 8 file FE theo §8, build xanh, lint 0 error/2 warning, E2E chưa chạy (BE chưa xong). BE còn đang implementing |
| 2026-11-12 | Review FE vòng 0: chỉ sửa 8 file `frontend/src/**` đúng §8, không chạm `tests/e2e`; diff khớp §6 (Select Kịch bản, badge, 2 cột mới, nhãn A/B, "—" khi thiếu trường); build xanh, lint 0 error (2 warning có sẵn ngoài lát). Còn chờ `pnpm api:types` sau khi BE xong |
| 2026-11-12 | agy BE `worker_done` (succeeded, 03:56Z): 23 file (V15, gói `eval/tune` 6 lớp, `ConfiguredCbfAlgorithm`, `EvalVariants`, EvalRunner/Command, 2 lớp test); báo chạy 2 lô L1, L2, mỗi lô ~220,6 s |
| 2026-11-12 | Review BE vòng 0: chỉ sửa `backend/**` (+ jOOQ sinh lại); không chạm lớp cấm sửa. `mvn test` business 139/139 xanh (EvalPart2UnitTest TC-01 → 11, EvalUnitTest 10, RecEvalRunServiceTest). Restart OK (V15). E2E `-g "API"` 7/7 xanh (TC-16 → 22). L1 `20261112-103857`, L2 `20261112-104314` giống hệt 28 dòng. Ghi chú không chặn: `Tuner` bước 1 gắn cứng chu kỳ bán rã 30 / k 5 / λ 0,7 thay vì đọc D (hiện trùng giá trị `application.yml`) |
| 2026-11-12 | CLI (Claude tự chạy): TC-15 hai lệnh sai → mã 2, in đúng khoá; TC-14 A2 → lô `20261112-110524` (5 dòng), 8 chỉ số × 3 K và `userCount` trùng khít lô phần 1 `20261112-034424`, `excludeSeen`/`tuned` false; TC-13 lệnh mặc định → lô `20261112-110716` (28 dòng), mã 0, **430,5 s** (agy báo 220,6 s khi máy rảnh), đủ tiêu đề §5.4, bảng bỏ bớt 8 dòng, bảng người mới 4 dòng. Stdout tiếng Việt bị vỡ dấu khi chuyển hướng ra file (bảng mã console Windows, như phần 1). `pnpm api:types`: `api.gen.ts` +2 dòng `scenario`, khớp `lib/types/recommend.ts`. Backend :9500 tự tắt một lần giữa chừng (không rõ nguyên nhân, không do lệnh eval vì eval không mở cổng) → restart lại OK |
| 2026-11-12 | Số liệu L2 (NDCG@10 standard): B1 0,0379 · B2 0,3599 · B2-dd 0,3388 · B3 0,0499 · M 0,0631 · M-mau 0,0624 · M-the 0,0744 · M-giam 0,0665 · M-mmr 0,0739 · M-kb 0,0557 · M-tron 0,0591 · M-mac-dinh 0,0608. Người mới (n = 0/1/3/5, 355 người): B2 0,4686/0,4665/0,4707/0,4686 · B3 0,2063/0,1637/0,1489/0,1431 · M 0,2426/0,2181/0,2001/0,1867 · M-kb 0,3883/0,1443/0,1476/0,1463 |
| 2026-11-12 | E2E có giao diện (`E2E_SLOWMO=400`, headed): **13/13 xanh** (API TC-16 → 22, UI TC-23 → 28); ảnh tài liệu 7 tấm ở `docs/chuc-nang/img/tinh-chinh-goi-y/` (01-danh-gia-chinh … 07-dien-thoai). Hồi quy `danh-gia-goi-y.spec.ts` 13/13 xanh |
| 2026-11-12 | Release worker `ctx_7b37b1677bb7`, `ctx_08b6bb230824` (reclaimable rỗng). Số vòng sửa: BE 0, FE 0. Lệch plan: không có lệch hợp đồng; ghi chú nhỏ `Tuner` bước 1 gắn cứng D (xem trên); thời gian lệnh mặc định 220–430 s tuỳ tải máy. **phiên B xong** — tiếp: `/doc-chuc-nang tinh-chinh-goi-y` |
| 2026-11-12 | Phiên C — viết `docs/chuc-nang/tinh-chinh-goi-y.md` (7 ảnh, bảng đo lô L2 `20261112-104314`), plan → done, commit + push + mở PR. Số liệu: JUnit `business` 139/139, Playwright 13/13 (7 API + 6 giao diện), hồi quy `danh-gia-goi-y.spec.ts` 13/13; BE 0 vòng sửa, FE 0 vòng sửa. Kết quả đo: M NDCG@10 0,0631 vẫn thua B2 0,3599 (báo cáo đúng số đo, §11 câu 11) |
