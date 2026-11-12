# Fix 3: quan-tri-goi-y — frontend

Vòng trước: dispatch ctx_7e97fb260b85 (fe-fix2). Sửa đúng 2 lỗi dưới, không làm thêm việc khác. Plan §5.5, §6.3, §6.6 đã sửa ngày 11/11/2026 (người dùng duyệt); spec `frontend/tests/e2e/quan-tri-goi-y.spec.ts` đã thêm kiểm tra (TC-15, TC-19, TC-24) — đọc để biết selector, KHÔNG sửa.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `frontend/src/lib/types/recommend.ts:147` (`TopTermDTO`) + `frontend/src/components/admin/recommend/profile-card.tsx:105,121,137` | §5.5 (đã sửa): `topStyles` / `topCategories` / `topTags` là `ProfileTerm { key, weight }` — hợp đồng có sẵn của lát 2.2 `recommend/public/profile`, backend **không** đổi. Plan bản cũ ghi nhầm `value`. §6.6 chip "{tên} {weight}" | Response thật: `"topStyles":[{"key":"am-ap","weight":1.0}]`; giao diện hiện "Ấm áp NaN", "lá vàng NaN" (`formatVnDecimal(undefined, 2)`). TC-24 đỏ: `Expected pattern: /Phong cách nổi bật\s*Ấm áp \d,\d{2}/ … Received: "…Phong cách nổi bậtẤm áp NaNDanh mục nổi bậtẤm áp NaNThẻ nổi bậtlá vàng NaN…"` | `TopTermDTO { key: string; weight: number }` (tên type tuỳ, nhưng **không** đụng `ColorTerm`/`color` — trường này vẫn là `{ key, value }`); chip hiện "Ấm áp 1,00". Đối chiếu `api.gen.ts` (`components["schemas"]["ProfileTerm"]`) |
| 2 | `frontend/src/components/admin/recommend/config-tab.tsx` (lưới card dòng 54, card "Tham số" dòng ~210) | §6.3 (bổ sung): card "Tham số" chiếm cả hai cột từ `lg` (`lg:col-span-2`) để ở màn 1280 px bảng hiện đủ 3 cột "Tham số", "Khoá", "Giá trị", không cuộn ngang | Ảnh `docs/chuc-nang/img/quan-tri-goi-y/01-cau-hinh.png`: cột "Khoá" bị xén, không thấy cột "Giá trị". TC-19 đỏ: `Error: bảng Tham số tràn ngang (px) Expected: <= 1 Received: 263` | Ở viewport 1280×720 bảng "Tham số" không tràn ngang; dưới `lg` vẫn 1 cột, trên điện thoại cuộn trong khung như cũ (TC-28 phải xanh). Không đổi thứ tự 4 card |

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend (đang chạy :9500).

## Nghiệm thu (dán dòng tóm tắt, không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh; `pnpm lint` 0 error.
2. `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "TC-19|TC-24|TC-28" --workers=1 --reporter=line` → 3 passed.
3. `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts --workers=1 --reporter=line` → 19 passed.
4. `grep -rn "\.value" frontend/src/components/admin/recommend/profile-card.tsx` chỉ còn chỗ dùng cho `color` / `signals`.
