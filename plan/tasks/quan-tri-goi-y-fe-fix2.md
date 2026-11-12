# Fix 2: quan-tri-goi-y — frontend

E2E có giao diện: 17 / 19 xanh. TC-24 đỏ do spec (Claude đã sửa spec). TC-28 đỏ do layout quản trị, giao cho bạn.

## Lỗi — nội dung trang quản trị giãn theo bảng rộng nhất trên điện thoại (TC-28, §6.6)

- Chỗ: `src/components/admin/admin-layout.tsx:58` (`<ScrollArea className="h-full w-full">`).
- Plan §6.6: bảng "Gợi ý thử" nằm trong khung cuộn ngang riêng (`overflow-x-auto`), trang không tràn ngang trên điện thoại.
- Bằng chứng (viewport 390 px, `/admin/goi-y?tab=thu-ho-so` sau khi chọn khách, đo từ bảng đi lên):
  ```
  TABLE                  cw=955  sw=955
  DIV.table-container    ox=auto cw=955  sw=955   ← khung cuộn của bảng không cuộn
  DIV (overflow-x-auto)  ox=auto cw=955  sw=955
  DIV.card-content       cw=1005
  ...
  DIV                    cw=1103 disp=table minw=100%   ← con của viewport Radix
  DIV.scroll-area-viewport ox=hidden cw=356 sw=1103
  ```
  Radix `ScrollArea` bọc nội dung trong một `div` `display: table; min-width: 100%`, nên mọi trang quản trị giãn theo bề rộng tự nhiên của nội dung (1103 px) rồi bị cắt trong viewport 356 px. Khung `overflow-x-auto` bên trong không bao giờ phải cuộn.
- Mong đợi: phần tử con trực tiếp của viewport hiển thị `display: block` (ví dụ thêm vào `ScrollArea` trong `admin-layout.tsx` class `[&_[data-slot=scroll-area-viewport]>div]:!block`, hoặc tương đương). Không sửa `components/ui/scroll-area.tsx`. Sau khi sửa, ở 390 px: `scroll-area-viewport` có `scrollWidth == clientWidth`, khung bảng "Gợi ý thử" có `scrollWidth > clientWidth`.

## Phạm vi được sửa
Chỉ `src/components/admin/admin-layout.tsx`. Không sửa `frontend/tests/e2e/**`. Cấm `git stash/reset/checkout/clean`. Không restart backend (:9500 đang chạy).

## Nghiệm thu
1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "TC-28" --workers=1 --reporter=line 2>&1 | tail -5` xanh.
3. Hồi quy layout: `pnpm test:e2e tests/e2e/dac-trung-mau.spec.ts tests/e2e/phan-quyen.spec.ts --workers=1 --reporter=line 2>&1 | tail -5`. Dán các dòng `N passed`.
