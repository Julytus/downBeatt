# Task: bo-suu-tap — frontend fix 1 (agy)

Review của Claude sau `worker_done` lần 1. `pnpm build` + `pnpm lint` đã xanh; các lỗi dưới đây là vi phạm quy ước `frontend/AGENTS.md` và plan §6 / §8. Giữ nguyên mọi chuỗi giao diện đang đúng.

## Lỗi cần sửa

### 1. Toast / invalidate gọi tay trong component (vi phạm `frontend/AGENTS.md` dòng 74 + checklist dòng 428)

`lib/tanstack/options/collection.ts` đã có `createSaveCollectionMutationOptions`, `createDeleteCollectionMutationOptions`, `addCollectionItemMutationOptions`, `removeCollectionItemMutationOptions` với `meta` (`invalidatesQuery`, `successMessage` dạng hàm — `MutationCache` ở `lib/tanstack/query-client/index.ts` đã hỗ trợ), nhưng **không component nào dùng**. Thay vào đó:

- `components/shop/collection/save-to-collection-panel.tsx:54-71` gọi thẳng `addCollectionItem` / `removeCollectionItem` trong `try/catch`, `toast.success` / `toast.error`, `invalidateQueries` tay.
- `save-to-collection-panel.tsx:75-98` `useMutation` riêng, `toast` trong `onSuccess` / `onError`, `invalidateQueries` tay.
- `collection-name-dialog.tsx:60-88` `toast.success` / `toast.error` trong `onSuccess` / `onError`.
- `delete-collection-dialog.tsx:34-45` như trên.

Sửa: các component dùng `useMutation(<options trong collection.ts>)`. Toast thành công và toast lỗi chung (message server, không có thì `meta.errorMessage` = "Không lưu được, vui lòng thử lại") do `MutationCache` hiện. Component chỉ đổi state UI trong `onSuccess` / `onError` (xoá ô, đóng dialog, đặt lỗi dưới ô).
- `COLLECTION_NAME_EXISTS` phải hiện dưới ô, **không** toast (§6.3, §6.5): dùng `silentError` cho mutation tạo / đổi tên rồi tự xử lý lỗi trong component. Lỗi khác của mutation đó vẫn cần toast → cách gọn: thêm vào options một `errorMessage`/`silentError` dạng hàm nếu `MutationCache` cho phép, hoặc mở rộng `MutationCache` để `silentError` nhận `(error) => boolean` (bỏ qua toast khi trả `true`). Chọn một, ghi rõ trong báo cáo.
- `COLLECTION_LIMIT` ở hộp thoại tên (§6.5) vẫn là toast "Gói Miễn phí lưu được tối đa 3 bộ sưu tập" (chính là message server → để `MutationCache` hiện), rồi đóng hộp thoại + trang nạp lại (invalidate đã có trong meta). Ở panel 6.3: toast message server + chuyển sang khung "Hết lượt tạo".
- Dialog tên bộ: theo `frontend/AGENTS.md` dòng 256 trang cha giữ mutation, dialog nhận `isLoading` / `onSubmit`. Nếu giữ mutation trong dialog thì vẫn phải dùng options có `meta`; ghi lý do trong báo cáo.

**Ngoại lệ được phép (plan §8.3 "ghi rõ chỗ nào")**: toast "Đã bỏ “{LUT}” khỏi bộ sưu tập" có nút "Hoàn tác" ở `collection-detail-page.tsx` cần `action` nên được gọi `toast(...)` trong component. Nhưng:
- `item/remove` và `item/add` (hoàn tác) phải đi qua `useMutation` với options có `meta.invalidatesQuery` (không có `successMessage` cho trường hợp này — tạo options riêng hoặc tham số tắt `successMessage`), không gọi axios trần + `.then(invalidate)`.
- Hiện tại `collection-detail-page.tsx:136-157` không xử lý lỗi: `item/remove` lỗi thì thẻ đã biến mất mà dữ liệu vẫn còn, promise bị bỏ rơi. Lỗi → `MutationCache` toast, thẻ quay lại lưới.
- Thêm comment 1 dòng tại chỗ gọi `toast` giải thích ngoại lệ.

### 2. Ô nhập tự viết `<input>` thay vì `ShopField` (vi phạm `frontend/AGENTS.md` dòng 54)

- `save-to-collection-panel.tsx:200-232` (label "Tên bộ sưu tập mới") và `collection-name-dialog.tsx:~120-140` (label "Tên bộ sưu tập") tự viết `<label>` + `<input>` + class copy từ `ShopField`. Dùng `ShopField` (`label`, `error`, `placeholder`, `ref`/`autoFocus` cho chọn sẵn toàn bộ chữ khi đổi tên). Nút "Tạo và lưu" đặt cạnh ô như hiện tại vẫn được (bọc flex quanh `ShopField` + nút, căn đáy).

### 3. Mô tả hộp thoại 6.3 không nằm trong `DialogDescription`

`shop-dialogs.tsx` render `<DialogDescription className="sr-only">Lưu vào bộ sưu tập</DialogDescription>` (trùng tiêu đề) còn mô tả thật "Chọn một hoặc nhiều bộ. Bấm lần nữa để bỏ lưu." / "Đặt tên cho bộ sưu tập đầu tiên của bạn." là `<p>` trong panel. Trình đọc màn hình đọc sai mô tả. Sửa: mô tả thật phải là `DialogDescription` (ví dụ panel tự render `DialogDescription` với class như loại khác, `headingOf` trả `description: null` và `shop-dialogs` không render sr-only nữa).

## Ràng buộc

- Chỉ `frontend/**`, **không** sửa `frontend/tests/e2e/**`. Không `git stash/reset/checkout/clean`.
- Mọi chuỗi giao diện giữ đúng plan §6 từng chữ.
- Backend đang được worker khác làm song song trong cùng worktree.

## Nghiệm thu

1. `cd frontend && pnpm build && pnpm lint` xanh (0 error).
2. `grep -rn "toast" frontend/src/components/shop/collection` chỉ còn đúng chỗ ngoại lệ "Hoàn tác".
3. Báo cáo `worker_done` liệt kê từng lỗi 1–3 đã sửa ở file nào, cách xử lý `COLLECTION_NAME_EXISTS` đã chọn, và dòng "Skill: …".
