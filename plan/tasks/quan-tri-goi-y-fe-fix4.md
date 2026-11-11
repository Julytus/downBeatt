# Fix 4: quan-tri-goi-y — frontend

Vòng trước: dispatch ctx_af1ecdd9caa3 (fe-fix3, đã nghiệm thu). Sửa đúng lỗi dưới, không làm thêm việc khác. Spec `frontend/tests/e2e/quan-tri-goi-y.spec.ts` TC-24 đã thêm kiểm tra — đọc, KHÔNG sửa.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | Thẻ "Thử hồ sơ": `frontend/src/components/admin/recommend/try-items-table.tsx` / `try-profile-tab.tsx` (và vỏ chứa nó trong `routes/admin/goi-y.tsx` nếu cần) | §6.6: "Bảng nằm trong khung cuộn ngang (`overflow-x-auto`), trang không tràn ngang". Ở **desktop 1280×720** bảng "Gợi ý thử" 10 cột đẩy cả vùng nội dung giãn ra | TC-24 đỏ: `findHorizontalOverflow` → `"vùng cuộn rộng 1409px > 1280px"`. Ảnh `docs/chuc-nang/img/quan-tri-goi-y/06-thu-ho-so.png`: nút "Tính lại chỉ mục" ở đầu trang và badge "Theo hành vi" bị cắt mép phải | Ở 1280 px: vùng `#root > main` không rộng hơn viewport, đầu trang (nút "Tính lại chỉ mục") và card "Hồ sơ" nằm gọn trong màn; chỉ bảng "Gợi ý thử" cuộn ngang trong khung riêng của nó (ví dụ thêm `min-w-0` cho các tổ tiên flex/grid của card, card/khung bảng `w-full min-w-0 overflow-x-auto`). Điện thoại (TC-28) vẫn xanh. Không đổi `admin-layout.tsx` trừ khi chứng minh được là cần (nó đã sửa ở fe-fix2, dùng chung mọi trang /admin) |

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend.

## Nghiệm thu (dán dòng tóm tắt)
1. `cd frontend && pnpm build` xanh; `pnpm lint` 0 error.
2. `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "TC-24|TC-28" --workers=1 --reporter=line` → 2 passed.
3. `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts --workers=1 --reporter=line` → 19 passed.
