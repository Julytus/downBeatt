# Task: quan-ly-lut — frontend (agy)

Plan: plan/quan-ly-lut.md (đã duyệt 10/11/2026). Đọc §2, §3, §5 (toàn bộ), §6 (toàn bộ), §8.

## Target
Route `/admin/luts` (danh sách) và `/admin/luts/$id` (chi tiết), domain `lut-admin`, resource code `LUT`. Sidebar nhóm "Chức năng chính": mục "LUT" (icon `Film`) đứng **trước** "Đặc trưng màu".

## Việc cần làm (đúng §8, đường dẫn tính từ `frontend/src/`)
1. `lib/types/lut-admin.ts`: `LutAdminItemDTO`, `LutAdminDetailDTO` (`colorFeature?: LutColorFeatureDTO` từ `lib/types/lut-feature.ts`), `LutAdminListApiRequest`, `LutUpsertApiRequest`, `LutUploadKind`, `CreatorOptionDTO`, `LUT_UPLOAD_RULES` (đuôi, cỡ tối đa, `accept`, tên ô, message §6 theo kind).
2. `lib/axios/lut-admin.ts`: `getLutAdminList`, `getLutAdmin(id)`, `upsertLut`, `deleteLut(id)`, `uploadLutFile(id, kind, file)` (`FormData`, không tự đặt `Content-Type`), `publishLut(id)`, `hideLut(id)`, `getLutCreators()`. Danh mục dùng hàm có sẵn đọc `/lut-category/public/list`.
3. `lib/tanstack/options/lut-admin.ts`: `LUT_ADMIN_QUERY_KEY = ["lut-admin"]`; list (`keepPreviousData`), detail (`[...KEY, "detail", id]`), creators (`staleTime: 60_000`); mutation tạo / sửa / xoá / upload / xuất bản / ẩn có `meta` đủ 3 khoá, toast §6; `invalidatesQuery: [LUT_ADMIN_QUERY_KEY, LUT_FEATURES_QUERY_KEY]`. Upload, xuất bản, ẩn thêm `setQueryData` chi tiết từ `result`. Không gọi `toast` trong `onSuccess`.
4. `lib/lut-admin/publish-checklist.ts`: hàm thuần `publishChecklist(detail, categories)` → 5 mục §6.2 `{ label, ok }` (nhóm `phan-mem` không tính).
5. `lib/lut-admin/tag-utils.ts`: `normalizeTag` như §5.3 mục 5 (trim, gộp khoảng trắng, `toLowerCase`, giữ dấu).
6. `components/admin/lut/columns.tsx`, `components/admin/lut/lut-create-dialog.tsx` (§6.1), `components/admin/lut/lut-hide-dialog.tsx`.
7. `components/admin/lut/lut-info-form.tsx` (`useAppForm` + zod §6.2), `tag-input.tsx`, `category-checkboxes.tsx`, `file-slot.tsx` (một ô upload cho cả 5 kind), `publish-checklist-card.tsx`.
8. `routes/admin/luts/index.tsx` (danh sách, chép khung `routes/admin/chuc-vu.tsx`) và `routes/admin/luts/$id.tsx` (chi tiết; `id` không phải số dương → coi như 404). Cả hai bọc `AdminPermissionGuard code="LUT"`. Nếu route lồng `luts/` xung đột với cách đặt route phẳng hiện có thì dùng `routes/admin/luts.index.tsx` + `routes/admin/luts.$id.tsx`; URL phải đúng `/admin/luts` và `/admin/luts/<id>`.
9. `components/admin/sidebar/admin-sidebar.tsx`: thêm `{ code: "LUT", title: "LUT", url: "/admin/luts", icon: Film }` trước "Đặc trưng màu".

## Ràng buộc (spec E2E chọn phần tử đúng như dưới, đọc `frontend/tests/e2e/quan-ly-lut.spec.ts`, KHÔNG sửa)
- Type/axios theo §5 (backend đang làm song song — không chờ `api:types`).
- Mọi chuỗi giao diện nguyên văn §6. Lượt tải `vi-VN` ("15.120"), thời gian `dd/MM/yyyy HH:mm`.
- Danh sách: heading "LUT"; bộ lọc label "Tìm kiếm" / "Trạng thái" / "Phong cách" (combobox, option "Tất cả"…); nút ⋮ `aria-label="Thao tác {title}"`, mục menu đúng tên §6.1, chỉ hiện mục hợp trạng thái (mục không hợp thì **không render**, không chỉ disable). "Xóa" dùng `DeleteConfirmDialog` có sẵn (itemType "LUT"). "Xem ở cửa hàng" mở `/luts/{slug}` ở tab mới.
- Dialog "Thêm LUT": ô "Tiêu đề" tự focus; "Tác giả", "Phong cách" là `Select` có label (combobox). Tạo xong chuyển tới `/admin/luts/{id}`.
- Chi tiết: heading (`h1`) = tiêu đề LUT; badge trạng thái chữ "Nháp" / "Đã xuất bản" / "Đã ẩn"; dòng `/luts/{slug}`; nút "Xuất bản" (disabled khi checklist còn mục chưa đạt), "Ẩn" mở `AlertDialog` "Ẩn LUT {title}?"; "Xem ở cửa hàng" là link `target="_blank"`. 404: chữ "Không tìm thấy LUT" + link "Về danh sách LUT".
- Mỗi khối là `Card` shadcn (`data-slot="card"`) có `CardTitle` đúng chữ: "Thông tin", "File LUT (.cube)", "Ảnh và video xem trước", "Điều kiện xuất bản". Thẻ "Đặc trưng màu" dùng lại `LutColorFeatureCard`.
- Form: "Mô tả" (textarea có label, đếm "{n}/1000"), "LUT Premium" là `Switch` có label, "Thẻ" là `Input` có label "Thẻ" (role textbox, placeholder "Gõ thẻ rồi nhấn Enter"), chip có nút `aria-label="Xoá thẻ {thẻ}"`; Enter hoặc dấu phẩy thêm chip. Danh mục là `Checkbox` có `aria-label` = tên danh mục, chia 4 nhóm có tiêu đề "Phong cách", "Tông màu", "Dịp", "Phần mềm". "Kiểu xem trước" là `RadioGroup` với nhãn "Ảnh trước / sau" và "Video".
- Upload: mỗi ô có `<input type="file">` ẩn với `aria-label` "Chọn file .cube", "Chọn file Ảnh bìa", "Chọn file Ảnh trước", "Chọn file Ảnh sau", "Chọn file Video xem trước", `accept` theo §5.5. Kiểm đuôi / cỡ ở client trước, sai thì hiện dòng lỗi và **không gọi API**. Ảnh hiện `<img alt="{tên ô}">`. Ô ảnh trước / sau hoặc video **không render** theo giá trị đang chọn ở radio (chưa lưu cũng đổi ngay).
- "Điều kiện xuất bản": 5 dòng là `<ul>` / `<li>`, mỗi `li` có biểu tượng + chữ + nhãn ẩn (`sr-only`) "Đạt" / "Chưa đạt"; tính theo dữ liệu **đã lưu** (không theo form chưa lưu).
- Toast dùng `meta` mutation; lỗi API hiện nguyên message backend.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn trong `components/ui/`: `card`, `badge`, `button`, `input`, `textarea`, `select`, `switch`, `checkbox`, `radio-group`, `label`, `field`, `alert`, `alert-dialog`, `form-dialog`, `dropdown-menu`, `skeleton`, `separator`, `tooltip`. Không cần `shadcn add`. `Skeleton` khi tải.
- Không sửa khu cửa hàng, không đổi theme / màu / font toàn app, không sửa `routeTree.gen.ts` bằng tay.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl -s http://localhost:9500/api/v3/api-docs | grep -c '/lut/upload'` > 0 (backend đã xong): `pnpm test:e2e tests/e2e/quan-ly-lut.spec.ts -g "Giao diện" --reporter=line --workers=1` và dán kết quả. Chưa có thì ghi "backend chưa xong, chưa chạy E2E".
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
