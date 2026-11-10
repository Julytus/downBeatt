# quan-ly-lut — frontend fix 1

Plan: `plan/quan-ly-lut.md` (§6.2, §8). Review của Claude sau `worker_done` lần 1. Build / lint đã sạch, chuỗi giao diện khớp §6. Còn 3 lỗi dưới đây.

## Lỗi 1 — Form "Thông tin" mất thay đổi chưa lưu khi tải file lên (chặn)

- `src/components/admin/lut/lut-info-form.tsx:76-85`: `useEffect(..., [detail])` ghi đè toàn bộ state form mỗi khi object `detail` đổi.
- `detail` đổi sau **mỗi** lần upload / xuất bản / ẩn (`setQueryData`) và sau mỗi lần refetch do `invalidatesQuery`.
- Tái hiện: mở `/admin/luts/<id>`, sửa "Tiêu đề", thêm 1 thẻ, rồi tải "Ảnh bìa" → tiêu đề và thẻ quay về giá trị cũ. Trái §6.2 "Chọn file là tải lên ngay, không cần bấm Lưu thay đổi" (người dùng phải upload được giữa lúc đang sửa form).
- Đồng thời §6.2 / §8 mục 7 ghi rõ form dùng **`useAppForm` + zod** (mẫu `components/form/block/login-form.tsx`, xem `frontend/AGENTS.md` dòng 311); bản hiện tại dùng `useState` từng ô.
- Mong đợi: chuyển form sang `useAppForm` + zod; giá trị mặc định lấy từ `detail`; chỉ nạp lại từ `detail` khi **`detail.id` đổi** hoặc ngay sau khi "Lưu thay đổi" thành công. Upload / xuất bản / ẩn / refetch không được xoá thay đổi đang gõ. Giữ nguyên mọi label, message validate, `aria-label`, chuỗi nút §6.2.

## Lỗi 2 — "Ẩn" ở trang chi tiết bỏ mất `setQueryData`

- `src/routes/admin/luts/$id.tsx:98-101`: `{ ...createHideLutMutationOptions(queryClient), onSuccess: () => setHideDialogOpen(false) }` ghi đè `onSuccess` của options nên không còn `setQueryData` chi tiết (§8 mục 3 "xuất bản / ẩn còn `setQueryData` chi tiết từ `result`").
- Mong đợi: gọi cả hai (setQueryData rồi đóng dialog), ví dụ truyền `onSuccess` vào `hideMutation.mutate(id, { onSuccess: () => setHideDialogOpen(false) })`.

## Lỗi 3 — Toast upload lấy loại file từ closure state

- `src/routes/admin/luts/$id.tsx:103-118`: `successMessage` đọc `uploadingKind` (state) thay vì biến của lần gọi; `createUploadLutFileMutationOptions` trong `lib/tanstack/options/lut-admin.ts` viết xong nhưng không ai dùng (trùng lặp).
- Mong đợi: toast lấy đúng theo `kind` của lần upload (§6.2: "Đã tải lên file .cube" / "Đã tải lên Ảnh bìa" / "Đã tải lên Ảnh trước" / "Đã tải lên Ảnh sau" / "Đã tải lên Video xem trước"). Cách gợi ý: mỗi `FileSlot` (hoặc mỗi kind) dùng `useMutation(createUploadLutFileMutationOptions(queryClient, kind))`, bỏ mutation trùng ở trang; hai ô upload khác nhau chạy song song không làm sai nhãn "Đang tải lên…" của ô kia.

## Ràng buộc

- Chỉ sửa `frontend/src/**`. Không sửa `frontend/tests/e2e/**`. Không `git stash/reset/checkout/clean`.
- Không đổi chuỗi giao diện §6, không đổi hợp đồng §5.

## Nghiệm thu

```bash
cd frontend && pnpm build && pnpm lint      # 0 error
```
Báo `worker_done` kèm: file đã sửa, cách đã kiểm lỗi 1 (thao tác tay hoặc mô tả), dòng "Skill: …".
