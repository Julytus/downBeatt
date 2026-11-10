# Task: dac-trung-mau — frontend (agy)

Plan: plan/dac-trung-mau.md (đã duyệt 10/11/2026). Đọc §2, §3, §5, §6, §8.

Một worker agy khác làm backend **song song trong cùng worktree**: cấm `git stash/reset/checkout/clean`, không đụng `backend/**`.

## Target
Route `/admin/dac-trung-mau`, domain `lut-feature`, resource code `LUT`. Sidebar nhóm "Chức năng chính", mục "Đặc trưng màu" (icon `Palette`).

## Việc cần làm (đúng §8, đường dẫn tính từ `frontend/src/`)
Trang không phải CRUD: chép khung `routes/admin/chuc-vu.tsx` (bảng + lọc + guard), bỏ thêm / sửa / xoá / cột chọn, thêm `Sheet` chi tiết.
1. `lib/types/lut-feature.ts`: `LutColorFeatureDTO`, `LutFeatureItemDTO`, `LutFeatureListApiRequest` (`hasFeature?: 0 | 1`), `LutFeatureListResponseDTO = PagedResult<LutFeatureItemDTO>`, `LUT_STATUS_LABEL` ("Nháp", "Đã xuất bản", "Đã ẩn"). Dùng `LutStyle`, `LUT_STYLE_LABEL` có sẵn ở `lib/types/lut.ts`.
2. `lib/axios/lut-feature.ts`: `getLutFeatureList(req)` → `GET /lut/feature/list` (chỉ gửi tham số có giá trị); `recomputeLutFeatures(ids: number[])` → `POST /lut/feature/recompute`, body là **mảng** (`[]` = tất cả).
3. `lib/tanstack/options/lut-feature.ts`: `LUT_FEATURES_QUERY_KEY = ["lut-features"]`; `createLutFeatureListQueryOptions(req)` (`keepPreviousData`); `recomputeLutFeaturesMutationOptions` với `meta.successMessage` là hàm theo §6 ("Đã tính lại đặc trưng màu cho {số không lỗi} LUT" + ", {số} LUT lỗi" khi có lỗi), `errorMessage` "Không tính lại được đặc trưng màu", `invalidatesQuery: [LUT_FEATURES_QUERY_KEY]`. Không gọi `toast` trong `onSuccess`.
4. `lib/lut-feature/feature-rows.ts`: cấu hình 9 hàng bảng §6 (`key`, `label`, `left`, `right`, `neutral`, `span`, `digits`, `signed`) + `formatFeatureValue(value, row)` (Intl `vi-VN`, làm tròn trước rồi xét dấu; ra 0 thì không dấu: `0,00`, `0,0`) + `featureRatio(value, row)` ∈ [−1, 1]. Hàm thuần.
5. `components/admin/lut/feature-bar.tsx`: thanh hai phía (tâm giữa, tô lệch trái / phải theo `featureRatio`, màu `primary`; bản `compact` cho ô bảng), mỗi thanh `role="meter"`, `aria-label` = tên hàng, `aria-valuetext` = số hiện, `aria-valuemin` / `aria-valuemax` = tâm ∓ mức đầy (ví dụ Tương phản 0.5 / 1.5), `aria-valuenow` = giá trị gốc. Bản compact: không tên, không cực, ô có `title` "{Cực trái} ← → {Cực phải}".
6. `components/admin/lut/lut-color-feature-card.tsx`: `Card` tiêu đề "Đặc trưng màu", mô tả "Đo từ file .cube, so với ảnh gốc", 9 hàng (tên, hai cực, số). `isMono = 1`: badge "Đen trắng", chỉ 3 hàng "Độ sáng", "Tương phản", "Bão hoà", dòng cuối "LUT đen trắng: các thanh dịch màu không có ý nghĩa nên được ẩn." Props `{ feature: LutColorFeatureDTO }`.
7. `components/admin/lut-feature/columns.tsx`: `createLutFeatureColumns({ canUpdate, onView, onRecompute })` theo bảng cột §6 (header đúng chuỗi: "LUT", "Phong cách", "Trạng thái", "Nhiệt độ", "Bão hoà", "Tương phản", "Đen trắng", "Tính lúc"); nút ⋮ `aria-label="Thao tác {title}"` với "Xem đặc trưng" + "Tính lại" (chỉ khi `canUpdate`).
8. `components/admin/lut-feature/lut-feature-sheet.tsx`: ngăn chi tiết §6 (`Sheet` phải, `sm:max-w-md`; tiêu đề = title LUT; mô tả "{Nhãn phong cách} · LUT {lutSize}³"; ảnh bìa 16:9 `alt` = title; thẻ đặc trưng hoặc khung trống "Chưa có đặc trưng màu"; dòng "Tính lúc dd/MM/yyyy HH:mm"; nút "Tính lại" / "Đang tính…"). Sau khi tính lại, ngăn hiện số mới ngay.
9. `routes/admin/dac-trung-mau.tsx`: `RESOURCE_CODE = "LUT"`, `AdminPermissionGuard`, bộ lọc §6 (label "Tìm kiếm" / "Phong cách" / "Trạng thái" / "Đặc trưng"; `hasFeature` "1" / "0" đổi sang số khi gọi API), bấm hàng mở ngăn, `toolbarActions` "Tính lại tất cả" (quyền UPDATE) + `AlertDialog` §6, khung `Alert` destructive "Một số LUT chưa tính được" (mỗi dòng "{title}: {featureError}", nút "Đóng"), lỗi tải dùng `AdminListError` có sẵn.
10. `components/admin/sidebar/admin-sidebar.tsx`: `FEATURE_ITEMS` thêm `{ code: "LUT", title: "Đặc trưng màu", url: "/admin/dac-trung-mau", icon: Palette }`.

## Ràng buộc
- Type/axios theo §5 (backend đang làm song song — không chờ `api:types`).
- Mọi chuỗi giao diện nguyên văn §6 (kể cả "Hủy", "Xóa lọc" có sẵn của bảng). Số định dạng `vi-VN`.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/dac-trung-mau.spec.ts` — đọc để biết selector (meter theo `aria-label` exact, toast `getByText` exact, ô bảng theo thứ tự header), **KHÔNG sửa**.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn trong `components/ui/`: `sheet`, `card`, `badge`, `alert`, `alert-dialog`, `dropdown-menu`, `skeleton`, `tooltip`, `table`, `select`. Không cần `shadcn add`. `Badge` cho trạng thái ("Nháp" `outline`, "Đã xuất bản" `default`, "Đã ẩn" `secondary`), `Skeleton` khi tải.
- Không sửa khu cửa hàng, không đổi theme / màu / font toàn app.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl -s http://localhost:9500/api/v3/api-docs | grep -c lut/feature` > 0 (backend đã xong): `pnpm test:e2e tests/e2e/dac-trung-mau.spec.ts --reporter=line --workers=1` và dán kết quả. Chưa có thì ghi "backend chưa xong, chưa chạy E2E".
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
