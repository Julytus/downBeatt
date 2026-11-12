# Kế hoạch triển khai tổng: DownBeat

Lập ngày 10/11/2026 từ [docs/tai-lieu-thiet-ke.md](../tai-lieu-thiet-ke.md) (chương 12) và [plan/thiet-ke-tong-quat.md](../../plan/thiet-ke-tong-quat.md) §9. Đây là bản đồ tổng: **giai đoạn → lát chức năng → hạng mục → việc con**. Chi tiết từng lát (API, test case) nằm ở `plan/<slug>.md`, lập bằng `/plan-feature <slug>` khi tới lượt.

## Cách đánh dấu

- Trạng thái lát: `chưa làm` → `đang lập plan` → `đã duyệt` → `đang cook` → `done` (hoặc `blocked` kèm lý do).
- Mỗi việc con là một ô `[ ]`; xong thì đổi thành `[x]`. Lát chuyển `done` khi `/doc-chuc-nang` đóng plan; lúc đó mọi ô của lát được tích và dòng tương ứng ở bảng tiến độ đổi sang `done` kèm ngày.
- Giai đoạn `done` khi mọi lát bắt buộc trong giai đoạn đều `done`.
- Ai cập nhật: `/plan-feature` (khi tạo / duyệt plan), `/cook` (khi bắt đầu, xong phiên B), `/doc-chuc-nang` (khi đóng lát).

## Bảng tiến độ

| Thứ tự | Giai đoạn | Lát | Phụ thuộc | Trạng thái |
|---|---|---|---|---|
| 0.1 | 0. Nền tảng | `go-redis-mail` | | done |
| 0.2 | 0. Nền tảng | `trang-chu` | | done |
| 0.3 | 0. Nền tảng | `kho-lut` | | done |
| 0.4 | 0. Nền tảng | phân quyền theo role (V4, không qua plan) | | done (07/11/2026) |
| 1.1 | 1. Cửa hàng | `tai-khoan-khach` | | done (10/11/2026) |
| 1.2 | 1. Cửa hàng | `dac-trung-mau` | 0.3 | done (10/11/2026) |
| 1.3 | 1. Cửa hàng | `quan-ly-lut` | 0.3, 0.4, 1.2 | done (10/11/2026) |
| 1.4 | 1. Cửa hàng | `goi-thanh-toan` | 1.1 | done (10/11/2026) |
| 1.5 | 1. Cửa hàng | `tai-lut` | 0.3, 1.4 | done (10/11/2026) |
| 1.6 | 1. Cửa hàng | `bo-suu-tap` | 0.3, 1.1 | done (10/11/2026) |
| 2.1 | 2. Hệ gợi ý | `chi-muc-tuong-dong` (hồ sơ sản phẩm + độ tương đồng) | 1.2, 1.3 | done (10/11/2026) |
| 2.2 | 2. Hệ gợi ý | `ho-so-nguoi-dung` (sự kiện, hồ sơ, cold-start) | 1.1, 1.5, 1.6, 2.1 | done (11/11/2026) |
| 2.3 | 2. Hệ gợi ý | `xep-hang-goi-y` (tính điểm, MMR, giải thích, "Dành cho bạn") | 2.2 | done (11/11/2026) |
| 2.4 | 2. Hệ gợi ý | `quan-tri-goi-y` | 2.3 | done (11/11/2026) |
| 3.1 | 3. Đánh giá | `danh-gia-goi-y` (phần 1; đề xuất tách thêm `tinh-chinh-goi-y`, `kiem-dinh-goi-y`) | 2.3 | phần 1 done (12/11/2026); phần 2 `tinh-chinh-goi-y` done (12/11/2026); phần 3 chưa làm |
| 3.2 | 3. Đánh giá | thu thập D2 / D3 (người dùng thử) | 2.3 | chưa làm |
| 4.1 | 4. Quản trị số liệu | `dashboard-admin` | 1.4, 1.5 | chưa làm |
| 5.1 | 5. Plugin (tuỳ chọn) | `kho-plugin` | 3.1 | chưa làm |
| 5.2 | 5. Plugin (tuỳ chọn) | `goi-y-plugin` | 5.1 | chưa làm |
| 6.1 | 6. Báo cáo, bảo vệ | hoàn thiện báo cáo và demo | tất cả | chưa làm |

Làm song song được (khác bảng, khác màn hình): **1.1 ∥ 1.2**, **1.6 ∥ 1.5**, **2.1 ∥ 1.4 / 1.5 / 1.6** (2.1 chỉ cần dữ liệu kho, không cần tài khoản), **4.1** chen vào bất cứ lúc nào sau 1.5, **3.2** chạy nền trong khi làm 2.4 và 3.1.

## Lý do sắp xếp

1. **Hệ gợi ý là trọng tâm đồ án**, nên dồn các lát nó cần (1.1 tài khoản, 1.2 đặc trưng màu, 1.5 tải, 1.6 bộ sưu tập) lên trước; `dashboard-admin` không phục vụ gợi ý nên lùi xuống giai đoạn 4.
2. **Tách `dac-trung-mau` ra khỏi `goi-y-lut` và làm trước `quan-ly-lut`**: nút "Xuất bản" của `quan-ly-lut` phải kiểm "file .cube đã trích được đặc trưng màu", và upload .cube phải trả `LUT_FILE_INVALID`. Có `CubeParser` + `ColorFeatureExtractor` trước thì `quan-ly-lut` làm trọn ngay một lượt, đồng thời 36 LUT mẫu có đặc trưng màu sẵn cho lát gợi ý.
3. **Chia lát `goi-y-lut` của thiết kế thành 4 lát theo đúng các tầng thuật toán ở chương 7**: lát gốc quá to cho một lượt worker (đặc trưng, chỉ mục, hồ sơ, 5 API, 3 khối giao diện, trang quản trị). Mỗi tầng dùng kết quả của tầng trước và kiểm được riêng bằng unit test:
   - **2.1 hồ sơ sản phẩm + sim(i, j)** (§7.2, §7.3): chạy được ngay trên 36 LUT, thay luật "cùng phong cách" của "Có thể bạn cũng thích".
   - **2.2 hồ sơ người dùng + cold-start** (§7.4, §7.5): cần đủ nguồn tín hiệu (xem, tải, yêu thích, mua, khai báo).
   - **2.3 tính điểm + xếp hạng** (§7.6): score(u, i), MMR, quota Premium, câu giải thích, API `for-you`.
   - **2.4 quản trị gợi ý** (§9.4): cấu hình, thống kê, "Thử hồ sơ".
4. **`goi-thanh-toan` cần khoá payOS**: nếu người dùng chưa đưa khoá, lát vẫn làm được với `mock-pay` (profile local), cắm payOS thật sau bằng một bản sửa nhỏ. Không để payOS chặn cả chuỗi.
5. **Đánh giá cần người dùng thật (D2, D3) mất khoảng 2 tuần**, nên bắt đầu tuyển người thử ngay khi `goi-y-lut` chạy được, song song với 2.2 và 3.1.

---

## Giai đoạn 0. Nền tảng — done

- [x] **0.1 `go-redis-mail`**: gỡ Redis và mail, refresh token sang MySQL (V2), Caffeine. Tài liệu: [docs/chuc-nang/go-redis-mail.md](../chuc-nang/go-redis-mail.md)
- [x] **0.2 `trang-chu`**: landing page `/` (chỉ frontend). Tài liệu: [docs/chuc-nang/trang-chu.md](../chuc-nang/trang-chu.md)
- [x] **0.3 `kho-lut`**: V3, 6 API công khai, 36 LUT mẫu có .cube và ảnh thật trên MinIO, cửa hàng đổi sang API. Tài liệu: [docs/chuc-nang/kho-lut.md](../chuc-nang/kho-lut.md)
- [x] **0.4 Phân quyền theo role**: V4, trang `/admin/chuc-vu`, `/admin/phan-quyen`, `/admin/tai-nguyen`, `/admin/module`. Làm ngoài luồng plan (commit `5339c1a`), chưa có `docs/chuc-nang/`.
  - [ ] Bổ sung tài liệu chức năng phân quyền (ảnh đã có ở `docs/chuc-nang/img/phan-quyen/`)

## Giai đoạn 1. Cửa hàng hoàn chỉnh — done

### 1.1 `tai-khoan-khach` — done (10/11/2026) ([plan/tai-khoan-khach.md](../../plan/tai-khoan-khach.md))

Thiết kế: §2.4, §3.6, §5.3, §6.2 (chỉ phần đăng ký). Migration: role Khách hàng.

- [x] Plan: `/plan-feature tai-khoan-khach` → duyệt (10/11/2026)
- [x] Backend
  - [x] Migration: role `Khách hàng` (`is_default = 1`), role `Không quyền` đổi `is_default = 0`
  - [x] `POST /account/register` (lỗi `EMAIL_EXISTS`), trả token như đăng nhập
  - [x] `GET /account/me` (tạm trả `plan = free` khi chưa có bảng subscription)
  - [x] Khách hàng gọi endpoint quản trị bị 403
- [x] Frontend
  - [x] Hộp thoại đăng nhập / đăng ký ở cửa hàng dùng API thật (thay `lib/mock/account.ts`)
  - [x] Menu tài khoản ở header (tên, gói, đăng xuất)
  - [x] Bấm "Tải" khi chưa đăng nhập mở hộp thoại đăng ký
- [x] E2E + review + tài liệu (`/cook`, `/doc-chuc-nang`). Tài liệu: [docs/chuc-nang/tai-khoan-khach.md](../chuc-nang/tai-khoan-khach.md)

### 1.2 `dac-trung-mau` — done (10/11/2026) ([plan/dac-trung-mau.md](../../plan/dac-trung-mau.md), tách từ `goi-y-lut`)

Thiết kế: §7.2.4, Phụ lục A, UT-01 đến UT-05. Bảng: `lut_color_feature`.

- [x] Plan → duyệt
- [x] Backend
  - [x] `CubeParser`: đọc .cube 17 / 33 / 65, `DOMAIN_MIN/MAX`, từ chối LUT 1D và file lỗi (`LUT_FILE_INVALID`)
  - [x] `ColorFeatureExtractor`: lấy mẫu 17^3, đổi CIELAB, tính 10 đặc trưng
  - [x] Migration bảng `lut_color_feature`
  - [x] Tính đặc trưng cho 36 LUT mẫu đang có (lệnh nạp lại trong `tools/seed` hoặc khi khởi động)
  - [x] Unit test UT-01 đến UT-05
- [x] Frontend: thành phần "Đặc trưng màu" (9 thanh + cờ đen trắng, `lut-color-feature-card.tsx`) dùng lại được ở `/admin/luts`; trang `/admin/dac-trung-mau`
- [x] E2E + review + tài liệu (`/cook`, `/doc-chuc-nang`). Tài liệu: [docs/chuc-nang/dac-trung-mau.md](../chuc-nang/dac-trung-mau.md)

### 1.3 `quan-ly-lut` — done (10/11/2026) ([plan/quan-ly-lut.md](../../plan/quan-ly-lut.md), phần LUT; danh mục / tác giả đề xuất tách lát)

Thiết kế: §5.6 (lut, lut-category, creator), §6.6, §9.4. Resource: `LUT`, `LUT_CATEGORY`, `CREATOR`.

- [x] Plan → duyệt (10/11/2026)
- [x] Backend
  - [x] Migration resource + permission cho role quản trị (resource `LUT` có sẵn từ `dac-trung-mau`, lát này không thêm migration)
  - [ ] CRUD `lut`, `lut-category`, `creator` theo khuôn `list/get/update/delete`
    > Xong phần `lut` (+ `GET /lut/creators` cho ô chọn). CRUD `lut-category`, `creator` (resource `LUT_CATEGORY`, `CREATOR`) dời sang lát riêng theo plan §1.
  - [x] `upload` multipart: .cube (bucket riêng tư, gọi `ColorFeatureExtractor`), ảnh jpg/png/webp, video mp4/webm ≤ 50 MB; từ chối svg/html
  - [x] `publish/{id}`: kiểm `PREVIEW_MISSING`, đặc trưng màu, `LUT_FEATURE_MISSING` (≥ 3 thẻ, ≥ 1 danh mục); `hide/{id}`
  - [x] Slug sinh từ tiêu đề, trùng thêm `-2`, `-3`
- [x] Frontend
  - [x] `/admin/luts`: bảng lọc trạng thái, form thêm / sửa, chọn kiểu xem trước, upload, thẻ "Đặc trưng màu", nút xuất bản / ẩn
  - [ ] `/admin/danh-muc`, `/admin/tac-gia`
    > Dời sang lát riêng cùng CRUD danh mục / tác giả.
- [x] E2E + review + tài liệu (`/cook`, `/doc-chuc-nang`). Tài liệu: [docs/chuc-nang/quan-ly-lut.md](../chuc-nang/quan-ly-lut.md)

> Đề xuất lát nhỏ riêng **`seed-minio`** (người dùng chọn 10/11/2026, làm sau 1.3): máy mới chạy Flyway có 36 LUT trong DB nhưng MinIO trống (ảnh hỏng, không đo được đặc trưng màu) cho tới khi chạy tay `tools/seed/kho-lut/build.py` (Python + mạng). Cần cách nạp sẵn file ảnh / .cube / video lên MinIO sau khi seed.

### 1.4 `goi-thanh-toan` — done (10/11/2026) ([plan/goi-thanh-toan.md](../../plan/goi-thanh-toan.md))

> Tách làm ba lát (người dùng đồng ý 10/11/2026): `goi-thanh-toan` (gói, đơn, payOS, webhook, subscription, tác vụ 00:10, `/pricing`, trang kết quả, nhắc gia hạn) → `goi-cua-toi` (`order/my-list`, `subscription/cancel`, lịch sử đơn, huỷ gói) → `quan-tri-don-hang` (resource PLAN / ORDER / CUSTOMER, trang quản trị đơn, khách, sửa giá).

Thiết kế: §2.2, §4.5, §5.4 (order, subscription), §6.4, §6.5, §6.8 (tác vụ 00:10). Resource: `PLAN`, `ORDER`, `CUSTOMER`.

- [x] Trước khi lập plan: tài liệu payOS (khoá người dùng đặt vào `backend/.env` trước khi cook)
- [x] Chốt vấn đề mở #1 (nâng cấp: quy đổi ngày còn lại sang gói mới, gia hạn bất cứ lúc nào) và #3 (demo bằng khoá payOS thật, giá hạ tạm)
- [x] Plan → duyệt (10/11/2026)
- [x] Backend (lát `goi-thanh-toan` nghiệm thu xong 10/11/2026; phần còn lại thuộc `goi-cua-toi` / `quan-tri-don-hang`)
  - [x] Migration `plan` (3 gói), `payment_order` (có sẵn cột `source_lut_id`), `subscription` (cột sinh `active_user_id` UNIQUE)
    - resource `PLAN` / `ORDER` / `CUSTOMER` dời sang `quan-tri-don-hang`
  - [x] `GET /plan/public/list` (cache)
  - [x] `order/create` (backend tự tính tiền, `PLAN_ACTIVE`, `PAYMENT_GATEWAY_ERROR`), `order/get`, `order/cancel`, `order/mock-pay` (chỉ local)
    - `order/my-list` dời sang `goi-cua-toi`
  - [x] Webhook payOS: chữ ký (`INVALID_SIGNATURE`), so số tiền, `UPDATE ... WHERE status = 'PENDING'`, kích hoạt / gia hạn / nâng cấp subscription
  - [ ] `subscription/cancel` (tắt tự gia hạn); `account/me` trả gói và hạn thật
    - `account/me` trả gói và hạn thật: xong; `subscription/cancel` dời sang `goi-cua-toi`
  - [x] Tác vụ 00:10: subscription quá hạn và đơn PENDING quá 24 giờ chuyển `EXPIRED`
  - [ ] Quản trị: `plan/list,update`, `order/list,get`, `customer/list,get` — lát `quan-tri-don-hang`
- [x] Frontend
  - [x] `/pricing` đọc API, nút mua → payOS; `/thanh-toan/ket-qua` hỏi trạng thái mỗi 2 giây
  - [x] Hộp thoại nâng cấp (nhớ `sourceLutId`), nhắc gia hạn khi còn 3 ngày (không gửi email)
  - [ ] Menu tài khoản: lịch sử đơn, huỷ gói — lát `goi-cua-toi` (lát này đã thêm "Gia hạn gói", "Nâng cấp lên Studio")
  - [ ] `/admin/don-hang`, `/admin/khach-hang`, sửa giá gói — lát `quan-tri-don-hang`
- [x] E2E (có webhook lặp, sai chữ ký, sai số tiền) + review + tài liệu
  - E2E + review: xong (27/27); tài liệu: `docs/chuc-nang/goi-thanh-toan.md`

### 1.5 `tai-lut` — done (10/11/2026) ([plan/tai-lut.md](../../plan/tai-lut.md))

Thiết kế: §4.6, §6.3. Bảng: `download_log`.

- [x] Plan → duyệt (10/11/2026)
- [x] Backend
  - [x] Migration `download_log`
  - [x] `POST /lut/download`: 401, 404 khi chưa xuất bản, 403 `PLAN_REQUIRED`; ghi log + tăng `download_count` bằng một câu UPDATE; link ký sẵn 5 phút
- [x] Frontend: nút "Tải LUT" dùng API, 403 mở hộp thoại nâng cấp, tải xong hiện "LUT tương tự"
- [x] E2E + review + tài liệu
  - E2E (21/21) + review xong; tài liệu: `docs/chuc-nang/tai-lut.md`

### 1.6 `bo-suu-tap` — done (10/11/2026) ([plan/bo-suu-tap.md](../../plan/bo-suu-tap.md))

Thiết kế: §4.6, §5.4 (collection), §6.7.

- [x] Plan → duyệt (10/11/2026)
- [x] Backend: migration `collection`, `collection_item`; 6 API (plan chốt 6, không phải 5: thêm `item/remove`); gói Miễn phí tối đa 3 bộ
- [x] Frontend: nút "Lưu vào bộ sưu tập" ở thẻ / trang chi tiết, trang bộ sưu tập của tôi
- [x] E2E + review + tài liệu
  - E2E (31/31) + review xong; tài liệu: `docs/chuc-nang/bo-suu-tap.md`

## Giai đoạn 2. Hệ gợi ý theo nội dung — done

Bốn lát dưới đây thay cho lát `goi-y-lut` của thiết kế. Đặc trưng màu từ file .cube (§7.2.4) đã nằm ở lát 1.2. Mọi tham số lấy từ `recommend.*` (Phụ lục B) qua một đối tượng cấu hình, để trình đánh giá ở 3.1 chạy được nhiều cấu hình mà không sửa mã.

### 2.1 `chi-muc-tuong-dong` — done (10/11/2026) ([plan/chi-muc-tuong-dong.md](../../plan/chi-muc-tuong-dong.md))

Thiết kế: §7.1, §7.2, §7.3, §7.8 (`LutVectorIndex`, `SimilarityService`), UT-06. Bảng: `lut_similarity`.

- [x] Plan → duyệt (10/11/2026)
- [x] Backend
  - [x] Cấu hình `recommend.*` (trọng số khối, `similarity-top`, bảng đồng nghĩa thẻ, danh sách từ dừng)
  - [x] Hồ sơ sản phẩm 6 khối (§7.2)
    - [x] Khối thẻ: chuẩn hoá thẻ + gộp đồng nghĩa, TF-IDF với idf = ln((N + 1) / (df + 1)) + 1, chuẩn L2
    - [x] Khối danh mục: multi-hot nhân IDF, chuẩn L2, **bỏ nhóm `phan-mem`**
    - [x] Khối phong cách: one-hot 8 chiều theo `lut.style`
    - [x] Khối màu: đọc `lut_color_feature`, z-score trên toàn kho, cắt [-3, 3]; mean / std tính lại mỗi lần dựng
    - [x] Khối văn bản: NFC, tách âm tiết, bỏ từ dừng, âm tiết đơn + cặp âm tiết (giữ cặp có ở ≥ 2 LUT), tf = 1 + ln(số lần), TF-IDF, chuẩn L2
    - [x] Khối tác giả: one-hot `creator_id`
  - [x] `LutVectorIndex`: giữ vector thưa của mọi LUT `PUBLISHED`; dựng bản mới rồi thay tham chiếu (không khoá đọc)
    - Lệch: dựng đồng bộ trong luồng gọi sau commit, không dùng luồng riêng (AGENTS cấm xử lý bất đồng bộ; plan §7 mục 7)
  - [x] Độ tương đồng (§7.3): cosine cho 5 khối rời rạc, RBF exp(-‖z_i − z_j‖² / 2D) cho khối màu, tổng có trọng số
  - [x] Bảng `lut_similarity`: top 50 mỗi LUT, tính lại toàn bảng khi xuất bản / sửa / ẩn (móc vào `publish`, `hide` của lát 1.3) và tác vụ 03:00
  - [x] `GET /lut/public/related` đổi từ luật sang `sim(c, j)` (chưa có phần cá nhân hoá 0.2), giữ nguyên hợp đồng (chỉ thêm field `similarity`)
  - [x] Unit test: UT-06 (sim(i, i) = 1, đối xứng, trong [0, 1]); TF-IDF và RBF trên ví dụ nhỏ tính tay
- [x] Frontend: không đổi (cùng hợp đồng `related`); kiểm lại "Có thể bạn cũng thích" không chứa chính LUT đang xem (UI-05)
- [x] E2E (related trả LUT cùng gu, LUT bị ẩn biến khỏi related) + review: 12/12 test xanh
- [x] Tài liệu `docs/chuc-nang/chi-muc-tuong-dong.md`

### 2.2 `ho-so-nguoi-dung` — done (11/11/2026) ([plan/ho-so-nguoi-dung.md](../../plan/ho-so-nguoi-dung.md))

Thiết kế: §6.2, §7.4, §7.5.1, §5.5 (`event`, `merge-anon`, `clear-history`), §5.3 (`preference`), §9.3 (bước chọn phong cách, ghi sự kiện), UT-07 đến UT-09, API-03, API-04, API-07 đến API-09. Bảng: `user_preference`, `user_event`.

- [x] Plan → duyệt (10/11/2026)
- [x] Backend
  - [x] Migration `user_preference`, `user_event`
  - [x] Thu tín hiệu
    - [x] `account/preference` GET / POST, thay toàn bộ, tối đa 12, slug sai trả `PREFERENCE_INVALID`
    - [x] `recommend/public/event`: VIEW, PREVIEW, SEARCH, FILTER_STYLE; luôn trả 200; chống ghi lặp 30 phút; chuẩn hoá từ khoá
    - [x] `merge-anon` (UPDATE `user_id` theo `anon_id`), `clear-history` (chỉ xoá `user_event`), tác vụ 00:30 xoá sự kiện > 180 ngày
  - [x] `UserProfileService` (§7.4)
    - [x] Đọc 5 nguồn: `user_event`, `collection_item` (4), `download_log` (5), `payment_order.source_lut_id` đơn PAID (6), `user_preference`
    - [x] Gộp theo cặp (LUT, loại): c = w · (1 + ln(số lần)) · 0.5^(số ngày / 30); giới hạn 180 ngày, 200 cặp
    - [x] Hồ sơ hành vi H_u: khối rời rạc chia cho Σ|c| (DISMISS kéo ra xa); khối màu chỉ trung bình tín hiệu dương
    - [x] SEARCH vào khối thẻ + văn bản, FILTER_STYLE vào khối phong cách
    - [x] Hồ sơ khai báo E_u (§7.5.1): phong cách one-hot trung bình, danh mục multi-hot IDF, thẻ / màu / văn bản **mượn trọng tâm** các LUT thuộc danh mục đã chọn
    - [x] Trộn P_u = α·E_u + (1 − α)·H_u, α = k / (k + n), k = 5; xác định strategy `PROFILE / PREFERENCE / POPULAR`
    - [x] Nhận thời điểm tham chiếu làm tham số (cho 3.1); cache Caffeine 5 phút, xoá khi tải / lưu bộ sưu tập / dismiss / lưu sở thích
      - Xoá cache khi dismiss: chỗ phát sự kiện thuộc lát 2.3 (`xep-hang-goi-y`); listener đã sẵn.
  - [x] Unit test UT-07 (suy giảm 30 ngày còn một nửa), UT-08 (chỉ khai báo: α = 1, PREFERENCE), UT-09 (5 LUT: α = 0.5)
- [x] Frontend
  - [x] `anonId` trong localStorage (bọc try/catch), gửi sự kiện không chờ: VIEW, PREVIEW (kéo thanh / video 3 giây), SEARCH (chờ 1 giây), FILTER_STYLE
  - [x] Gọi `merge-anon` sau đăng nhập / đăng ký
  - [x] Bước 2 "Chọn phong cách" (ảnh mẫu, 1 đến 5 phong cách, Bỏ qua) + mục "Sở thích màu", "Xoá lịch sử gợi ý" trong menu tài khoản
- [x] E2E + review + tài liệu
  - E2E (28/28) + review xong (11/11/2026); tài liệu: `docs/chuc-nang/ho-so-nguoi-dung.md`

### 2.3 `xep-hang-goi-y` — done (11/11/2026) ([plan/xep-hang-goi-y.md](../../plan/xep-hang-goi-y.md))

Thiết kế: §7.5.2 đến §7.5.4, §7.6, §7.7, §5.5 (`for-you`, `dismiss`), §9.3 (khối "Dành cho bạn"), UT-10 đến UT-12, API-01, API-02, API-05, API-06, API-10, UI-01 đến UI-04. Bảng: `rec_impression`, resource `RECOMMEND`.

- [x] Chốt vấn đề mở #6 (LUT Premium tối đa 1/3 danh sách cho gói Miễn phí và khách vãng lai): floor(K × 0.34), 4 trên 12; gói Pro / Studio không giới hạn (11/11/2026)
- [x] Plan → duyệt (11/11/2026)
- [x] Backend
  - [x] Migration `rec_impression` (V12)
    - resource `RECOMMEND` dời sang lát 2.4 `quan-tri-goi-y` (plan §11 câu 5): API lát này chỉ dành cho khách, chưa có trang quản trị
  - [x] `Recommender` (§7.6.2)
    - [x] Ứng viên: LUT `PUBLISHED`, loại LUT đã tải và đã dismiss
    - [x] score(u, i) = Σ w_b · sim_b(P_u, x_i) trên toàn kho, lấy top 100
    - [x] MMR: λ · score − (1 − λ) · max sim(i, j ∈ S), λ = 0.7, K = 12
    - [x] Quota Premium 1/3 cho gói Miễn phí / vãng lai, bỏ qua LUT Premium khi đủ quota
    - [x] Hoà điểm: `download_count` giảm dần, rồi id
  - [x] Cold-start mức 3 (§7.5.2, §7.5.4): phổ biến 30 ngày xen kẽ phong cách; kho chưa có lượt tải thì xếp theo mới nhất, xen kẽ phong cách
  - [x] Câu giải thích (§7.6.4): khối đóng góp lớn nhất + LUT neo + động từ theo sự kiện mạnh nhất
  - [x] `related` thêm phần cá nhân hoá: 0.8 · sim(c, j) + 0.2 · score(u, j) khi có hồ sơ
  - [x] API `recommend/public/for-you` (ghi `rec_impression`, trả `impressionId`, `strategy`), `recommend/dismiss`
  - [x] Unit test UT-10 (dismiss), UT-11 (quota Premium), **UT-12 (ví dụ tính tay §7.7: thứ tự D, B, E, C, khớp 3 chữ số)**
- [x] Frontend
  - [x] Khối "Dành cho bạn" / "Phổ biến tuần này" ở `/luts`: 12 thẻ cuộn ngang, câu giải thích, skeleton, lỗi thì ẩn
  - [x] "Không quan tâm" (chỉ khi đăng nhập), hoàn tác 5 giây rồi mới gửi API
  - [x] Gắn `impressionId` vào sự kiện VIEW khi bấm thẻ từ khối gợi ý
- [x] E2E (API-01, API-02, API-05, API-06, API-10, UI-01 đến UI-04) + review + tài liệu
  - E2E (22/22) + review xong (11/11/2026); tài liệu: `docs/chuc-nang/xep-hang-goi-y.md`

### 2.4 `quan-tri-goi-y` — done (11/11/2026) ([plan/quan-tri-goi-y.md](../../plan/quan-tri-goi-y.md))

Thiết kế: §5.6 (recommend), §9.4 `/admin/goi-y`, API-11, UI-06.

- [x] Plan → duyệt (11/11/2026)
- [x] Backend
  - [x] `GET /recommend/config` (trọng số, tham số đang dùng), `POST /recommend/rebuild`
  - [x] `GET /recommend/stats?from=&to=`: CTR, tỉ lệ tải, tỉ lệ bỏ qua theo vị trí và biến thể (từ `rec_impression` + `user_event.impression_id`)
  - [x] API "Thử hồ sơ": hồ sơ một khách (phong cách, thẻ, màu nổi bật) + 12 gợi ý kèm điểm từng khối
  - [x] Khách hàng gọi bị 403 (API-11)
- [x] Frontend: `/admin/goi-y` ba thẻ "Cấu hình", "Đánh giá" (để trống tới 3.1), "Trực tuyến"; công cụ "Thử hồ sơ"; nút "Tính lại chỉ mục"
- [x] E2E + review + tài liệu
  - E2E 19/19 + review xong (11/11/2026); tài liệu: `docs/chuc-nang/quan-tri-goi-y.md`

## Giai đoạn 3. Đánh giá thuật toán

### 3.1 `danh-gia-goi-y` — phần 1 + phần 2 `tinh-chinh-goi-y` done (12/11/2026) ([plan/danh-gia-goi-y.md](../../plan/danh-gia-goi-y.md), phần 1 của 3)

Thiết kế: chương 8, UT-13. Bảng: `rec_eval_run`, schema riêng `downbeat_eval` (đã chốt bỏ: D1 sinh trong bộ nhớ, plan §11 câu 2). Tách 3 lát: `danh-gia-goi-y` (D1, chia dữ liệu, chỉ số, 5 thuật toán, API, thẻ "Đánh giá") → `tinh-chinh-goi-y` (tinh chỉnh, biến thể, cold-start) → `kiem-dinh-goi-y` (5 hạt giống, Wilcoxon, bảng báo cáo).

- [x] Plan → duyệt (12/11/2026, phần 1 `danh-gia-goi-y`)
- [x] Plan phần 2 `tinh-chinh-goi-y` → duyệt ([plan/tinh-chinh-goi-y.md](../../plan/tinh-chinh-goi-y.md), 12/11/2026)
- [x] Dữ liệu
  - [x] Kho đánh giá 300 LUT sinh tham số (sinh trong bộ nhớ bằng `CatalogGenerator` + `CubeWriter`, không dùng `downbeat_eval` / `tools/seed`, plan §11 câu 2)
  - [x] Bộ mô phỏng người dùng D1 theo hạt giống cố định
- [ ] Backend
  - [x] Migration `rec_eval_run`, profile `eval`
  - [x] Chia dữ liệu theo thời gian (§8.3): phần dựng hồ sơ / kiểm định / kiểm tra theo t0 từng người
  - [x] Chỉ số Precision / Recall / NDCG / ILD / Coverage và chỉ số cold-start (UT-13)
    - [x] 8 chỉ số P / R / NDCG / HitRate / ILD / phong cách / Coverage / Novelty (phần 1)
    - [x] Chỉ số cold-start: kịch bản người mới n = 0 / 1 / 3 / 5 + 2 chỉ số LUT mới (`tinh-chinh-goi-y`, 12/11/2026)
  - [x] `EvalRunner` gọi đúng `Recommender` và `UserProfileService` thật (không viết lại thuật toán)
  - [x] Các thuật toán so sánh (§8.5)
    - [x] B1 Ngẫu nhiên (20 lần, lấy trung bình)
    - [x] B2 Phổ biến (chỉ đếm lượt tải trước t0) và B2-dd (phổ biến xen kẽ phong cách)
    - [x] B3 CBF chỉ thẻ (cùng hồ sơ, suy giảm, cold-start, MMR)
    - [x] M CBF đủ 6 khối (thuật toán đề xuất)
  - [x] Biến thể bỏ bớt: M-mau, M-the, M-giam, M-mmr, M-kb, M-tron, M-mac-dinh (`tinh-chinh-goi-y`, 12/11/2026)
  - [x] Tinh chỉnh trên tập kiểm định: 500 bộ trọng số khối ngẫu nhiên, λ ∈ {0.5 … 1.0}, chu kỳ bán rã ∈ {7, 14, 30, 60, ∞}, k ∈ {2, 5, 10}; B3 cũng được tinh chỉnh (`tinh-chinh-goi-y`, 12/11/2026)
  - [ ] Chạy 5 hạt giống, K = 5 / 10 / 20 (phần 1 đã có K = 5 / 10 / 20 và `eval.seeds` nhiều hạt giống; chạy 5 hạt giống chính thức ở `kiem-dinh-goi-y`)
  - [ ] Kiểm định thống kê (Wilcoxon), in bảng Markdown cho báo cáo (phần 1 đã in bảng mỗi hạt giống; Wilcoxon ở `kiem-dinh-goi-y`)
  - [x] `GET /recommend/eval/list` (+ `eval/get`)
- [x] Frontend: thẻ "Đánh giá" ở `/admin/goi-y` (bảng các lần chạy, chọn hai lần để so sánh)
- [ ] Kết quả: bảng theo mẫu §8.8 đưa vào báo cáo (sau `kiem-dinh-goi-y`)
- [x] E2E + review + tài liệu (phần 1)
  - [x] E2E 13/13 + review BE/FE (12/11/2026)
  - [x] Tài liệu (`/doc-chuc-nang danh-gia-goi-y`, [docs/chuc-nang/danh-gia-goi-y.md](../chuc-nang/danh-gia-goi-y.md))
- [x] E2E + review + tài liệu (phần 2 `tinh-chinh-goi-y`)
  - [x] E2E 13/13 + hồi quy phần 1 13/13 + review BE/FE, 0 vòng sửa (12/11/2026)
  - [x] Tài liệu (`/doc-chuc-nang tinh-chinh-goi-y`, [docs/chuc-nang/tinh-chinh-goi-y.md](../chuc-nang/tinh-chinh-goi-y.md))

### 3.2 Thu thập D2 / D3 — chưa làm (không phải lát code)

- [ ] Chốt vấn đề mở #5: số người thử (mục tiêu 20 đến 30 người, 2 tuần)
- [ ] Dựng bản chạy thử cho người dùng truy cập được
- [ ] Thu D2 (hành vi thật) và khảo sát D3 (cảm nhận)
- [ ] Chạy `EvalRunner` trên D2, viết phân tích; không đủ người thì ghi rõ hạn chế, chỉ dùng D1

## Giai đoạn 4. Quản trị số liệu

### 4.1 `dashboard-admin` — chưa làm

Thiết kế: §5.6 (dashboard), §9.4 `/admin`. Resource: `DASHBOARD`.

- [ ] Plan → duyệt
- [ ] Backend: migration resource; `GET /dashboard/summary?from=&to=` (doanh thu theo ngày / tháng, đơn PAID, khách mới, gói đang dùng, top 10 LUT, tỉ lệ Premium trong lượt tải)
- [ ] Frontend: `/admin` thành bảng số liệu (biểu đồ, thẻ số)
- [ ] E2E + review + tài liệu

## Giai đoạn 5. Plugin (tuỳ chọn)

- [ ] Chốt vấn đề mở #4: làm thật hay chỉ trình bày thiết kế (chương 10). Chọn "chỉ thiết kế" thì giai đoạn này đóng luôn.
- [ ] **5.1 `kho-plugin`**: bảng `plugin`, `plugin_host`, `plugin_tag`, `plugin_category_map`; API công khai; trang `/plugins`; quản trị plugin; tải có kiểm tương thích
- [ ] **5.2 `goi-y-plugin`**: mở rộng chỉ mục và hồ sơ sang plugin (`item_similarity`), bộ lọc phần mềm, gợi ý chéo LUT và plugin

## Giai đoạn 6. Báo cáo và bảo vệ

- [ ] Cập nhật `docs/tai-lieu-thiet-ke.md` theo những gì đã cài thật (số migration, các lát đã tách, khác biệt so với thiết kế)
- [ ] Gom `docs/chuc-nang/*.md` thành chương cài đặt; ảnh chụp đủ cho mọi màn hình
- [ ] Chương thực nghiệm từ kết quả 3.1 (và 3.2 nếu có)
- [ ] Kịch bản demo: dữ liệu mẫu, tài khoản, luồng mua gói, luồng gợi ý cold-start → cá nhân hoá
- [ ] Slide bảo vệ

---

## Ghi chú lệch giữa tài liệu và thực tế

- **Số migration**: tài liệu thiết kế §4.8 dự kiến V4 cho `quan-ly-lut`, nhưng V4 đã dùng cho phân quyền (`V4__phan_quyen.sql`). Các lát sau đánh số tiếp từ V5 theo thứ tự làm thật.
- **Email nhắc gia hạn**: `plan/thiet-ke-tong-quat.md` §9 lát 4 còn ghi "email nhắc gia hạn", nhưng mail đã gỡ; theo tài liệu thiết kế §6.5 chỉ nhắc trên giao diện.
- **Lát gợi ý**: lát `goi-y-lut` của `thiet-ke-tong-quat.md` §9 và tài liệu thiết kế §12.1 được chia thành `dac-trung-mau` (1.2), `chi-muc-tuong-dong`, `ho-so-nguoi-dung`, `xep-hang-goi-y`, `quan-tri-goi-y` (2.1 đến 2.4). Khi lập plan các lát này, coi mục tương ứng ở đây là phạm vi.
