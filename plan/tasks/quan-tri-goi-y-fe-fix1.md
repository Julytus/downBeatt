# Fix 1: quan-tri-goi-y — frontend

Coordinator đã review diff, `pnpm build` OK, `pnpm lint` 0 lỗi. Còn 4 điểm lệch plan §6 dưới đây. Chỉ sửa các điểm này, không đổi chuỗi giao diện khác.

## 1. Ngày mặc định phải theo giờ trình duyệt (§6.5)

- Chỗ: `src/components/admin/recommend/online-tab.tsx:27-35` (`getTodayVN` dùng `timeZone: "Asia/Ho_Chi_Minh"`, `addDaysVN` cộng ngày theo UTC).
- Plan §6.5: "Mặc định "30 ngày" (`from = hôm nay − 29`, `to = hôm nay`, theo giờ trình duyệt)".
- Mong đợi: lấy "hôm nay" theo giờ địa phương của trình duyệt (`new Date()` + `getFullYear/getMonth/getDate`, định dạng `yyyy-MM-dd`), cộng / trừ ngày bằng `setDate` trên `Date` địa phương. Đổi tên hàm cho đúng nghĩa (bỏ hậu tố `VN`).

## 2. Lỗi ngày hiện dưới ô tương ứng (§6.5)

- Chỗ: `online-tab.tsx`, khối `{validationError && <p …>}` nằm dưới cả thanh lọc.
- Plan §6.5: "thiếu một ô → không gọi, dưới ô hiện "Chọn ngày"".
- Mong đợi: "Chọn ngày" hiện ngay dưới ô bị trống ("Từ ngày" hoặc "Đến ngày", cả hai nếu cả hai trống); ô lỗi có `aria-invalid` và `aria-describedby` trỏ tới dòng lỗi. Hai lỗi khoảng ngày ("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", "Khoảng thời gian tối đa 366 ngày") hiện dưới ô "Đến ngày". Chữ lỗi giữ nguyên văn. Vẫn không gọi API khi có lỗi.

## 3. Thẻ "Thử hồ sơ": lỗi 4xx ở chế độ "Tài khoản" không hiện, kết quả cũ còn giữ

- Chỗ: `src/components/admin/recommend/try-profile-tab.tsx:37-45` (4xx gán `anonError`, nhưng `anonError` chỉ render trong nhánh "Mã ẩn danh"); `setResult` không xoá khi lỗi.
- Plan §6.6: lỗi 400 / 404 từ server → chữ đỏ dưới ô (nguyên văn message), không toast.
- Mong đợi: đổi tên state thành `inputError`, render chữ đỏ dưới combobox "Khách hàng" khi đang ở "Tài khoản" và dưới ô anonId khi ở "Mã ẩn danh". Khi request mới lỗi (4xx hoặc 5xx) thì xoá `result` cũ để không hiện hồ sơ của khách trước. Đổi loại khách thì xoá cả `inputError` và `result`.

## 4. Card hồ sơ thiếu tiêu đề "Hồ sơ" (§6.6)

- Chỗ: `src/components/admin/recommend/profile-card.tsx:36-40`.
- Plan §6.6: "Kết quả gồm hai `Card`: 1. **"Hồ sơ"** (`section aria-label="Hồ sơ"`) …".
- Mong đợi: dòng tiêu đề "Hồ sơ" ở đầu card, cùng kiểu với tiêu đề card "{n} gợi ý" (dùng `Card` / `CardHeader` / `CardTitle` của shadcn cho section này, giữ `aria-label="Hồ sơ"` trên phần tử `section`). Dùng `IS_MONO_LABEL` từ `lib/lut-feature/feature-rows.ts` thay cho chuỗi "Đen trắng" viết lại trong `profile-card.tsx`.

## Phạm vi được sửa
Chỉ `frontend/src/components/admin/recommend/**` và `frontend/src/lib/lut-feature/feature-rows.ts` nếu cần. Không sửa `frontend/tests/e2e/**`. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu
1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. Backend :9500 đang chạy: `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts --workers=1 --reporter=line 2>&1 | tail -15`. Dán dòng `N passed / M failed`; test nào đỏ thì dán tên test + 3 dòng lỗi, không tự sửa spec.
