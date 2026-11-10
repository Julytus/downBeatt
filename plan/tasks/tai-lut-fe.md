# Task: tai-lut — frontend (agy)

Plan: plan/tai-lut.md (đã duyệt 10/11/2026). Đọc §1, §3, §5, §6, §8.

## Target
Khu cửa hàng: nút tải ở trang chi tiết `/luts/{slug}` và thẻ ở lưới `/luts`; hộp thoại mới loại `downloaded` trong `ShopDialogs`. API khách, không resource code.

## Việc cần làm (theo plan §8)
1. `lib/types/account.ts`: giữ `LutDownloadDTO { fileName: string; url: string }`, thêm `LutDownloadRequest { lutId: number }`.
2. `lib/axios/luts.ts` (hoặc `lib/axios/account.ts`, chọn một): `requestLutDownload(lutId)` → `POST /lut/download` body `{ lutId }`, trả `LutDownloadDTO`.
3. `lib/tanstack/options/account.ts`: `lutDownloadMutationOptions` gọi API thật; **bỏ** `successMessage` và `errorMessage` cố định (lỗi xử lý ở hook theo §6.1). Xoá `requestLutDownload`, `buildCube` khỏi `lib/mock/account.ts`; xoá hẳn file nếu không còn gì dùng. Gom hàm đọc `errorCode` đang nằm trong `register-form.tsx` thành `lib/axios/error.ts` → `apiErrorOf(err): { status?, errorCode?, message? }`, dùng chung (thay `ApiError` của mock).
4. `hooks/use-lut-download.ts` theo §6.1: giữ thứ tự (chưa đăng nhập → hộp thoại đăng ký kèm thẻ LUT; LUT ★ + phiên ghi gói Miễn phí → hộp thoại nâng cấp, **không** gọi API; còn lại → API). Giữ `pendingId` (spinner + `disabled` đúng nút). Thành công: tải bằng thẻ `<a href={url}>` tạm (không mở tab mới, không rời trang), **không** toast thành công, mở `{ type: "downloaded", lut, fileName }`, invalidate `["luts", "detail", slug]` và `["luts", "list"]`. Lỗi: `PLAN_REQUIRED` → hộp thoại "Nâng cấp để tải LUT Premium" (không toast); HTTP 401 → `{ type: "login", lut }` (không toast); còn lại → toast lỗi bằng message server, không có thì "Không tải được LUT, vui lòng thử lại".
5. `lib/stores/shop-dialog.ts`: thêm `| { type: "downloaded"; lut: LutDTO; fileName: string }`.
6. `components/shop/account/download-done-panel.tsx` (mới): nội dung §6.2 — "Cách dùng" + danh sách đánh số 2 dòng nguyên văn; dòng "Không thấy file?" + nút chữ "Tải lại" (gọi lại tải như §6.1, spinner khi đang gọi, hộp thoại giữ nguyên); khối "LUT tương tự": `GET /lut/public/related?slug={slug}&page=1&limit=4`, `ul` có `aria-label="LUT tương tự"`, lưới 2 cột (cả trên điện thoại), mỗi ô ảnh bìa 16:9 + tiêu đề + tác giả + sao ★ nếu Premium, cả ô là link `/luts/{slug}`, bấm thì đóng hộp thoại; đang tải 4 ô `Skeleton`; lỗi hoặc rỗng → ẩn cả khối. Chân: nút phụ "Xem thêm LUT" (→ `/luts`, đóng hộp thoại) · nút chính "Đóng". Dùng `createInfiniteRelatedLutsQueryOptions` có sẵn hoặc thêm `createRelatedLutsQueryOptions(slug, 4)` (`queryKey: ["luts", "related", slug, 4]`).
7. `components/shop/account/shop-dialogs.tsx`: `headingOf` thêm `downloaded` — tiêu đề (`DialogTitle`) "Đã tải xong", mô tả (`DialogDescription`) "{fileName} đã được lưu vào thư mục Tải xuống." (tên file in đậm); `LutMiniCard` ở đầu; render `DownloadDonePanel`.

## Ràng buộc
- Type / axios theo §5 (backend đang làm song song — không chờ `api:types`). Response chỉ có `fileName`, `url`.
- Mọi chuỗi giao diện nguyên văn §6. §6.3: hộp thoại đăng ký / đăng nhập / nâng cấp giữ nguyên chữ và luồng; mục "Định dạng" ở trang chi tiết giữ ".cube (3D LUT, 33×33×33)".
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/tai-lut.spec.ts` (+ `shop-flows.spec.ts`, `tai-khoan-khach.spec.ts` đã sửa theo §9.2) — đọc để biết selector, KHÔNG sửa. Chú ý: hộp thoại tìm bằng `getByRole("dialog", { name: "Đã tải xong" })`; nút chân "Đóng" lấy bằng `getByRole("button", { name: "Đóng", exact: true }).last()`; toast tìm bằng `[data-sonner-toast]`; "Xem thêm LUT" tìm bằng text.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn trong `components/ui/`: `dialog`, `skeleton`, `button`, `sonner`; dùng `ShopButton`, `LutMiniCard` của cửa hàng. Không cần `shadcn add`. Không đổi theme / màu / font toàn app.
- Cấm `git stash/reset/checkout/clean` (worktree dùng chung).

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. `grep -rn "requestLutDownload\|buildCube" src/lib/mock` rỗng.
4. Nếu `curl http://localhost:9500/api/v3/api-docs` đã có `/lut/download`: `pnpm test:e2e tests/e2e/tai-lut.spec.ts --reporter=line --workers=1` và dán kết quả; chưa có thì ghi rõ "backend chưa xong, chưa chạy E2E".
5. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
