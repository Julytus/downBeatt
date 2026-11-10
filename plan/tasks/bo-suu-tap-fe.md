# Task: bo-suu-tap — frontend (agy)

Plan: plan/bo-suu-tap.md (đã duyệt 10/11/2026). Đọc §1, §2, §3, §5, §6, §8.

## Target
Khu cửa hàng: hộp thoại "Lưu vào bộ sưu tập" (loại `collection` trong `ShopDialogs`), nút lưu ở thẻ LUT và trang chi tiết, trang mới `/bo-suu-tap` và `/bo-suu-tap/$id`, mục menu. API khách, không resource code.

## Việc cần làm (theo plan §8)
1. `lib/types/collection.ts`: `CollectionApiDTO` (bảng đối tượng §5, `luts?: LutApiDTO[]`), `CollectionDTO` (`luts?: LutDTO[]`, đổi qua `toLutDTO`), `SaveCollectionRequest { id?: number; name: string; lutId?: number }`, `CollectionItemRequest { collectionId: number; lutId: number }`; hằng `FREE_COLLECTION_LIMIT = 3`.
2. `lib/axios/collection.ts`: `getMyCollections(lutId?)` (`GET /collection/my-list`), `getCollection(id)` (`GET /collection/get?id=`), `saveCollection(req)` (`POST /collection/update`), `deleteCollection(id)` (`POST /collection/delete/{id}`), `addCollectionItem(req)` / `removeCollectionItem(req)` (`POST /collection/item/add|remove`).
3. `lib/tanstack/options/collection.ts`: `myCollectionsQueryOptions(lutId?)` (`["collections", "my", lutId ?? null]`), `collectionQueryOptions(id)` (`["collections", "detail", id]`, không retry khi 404); mutation options cho 4 thao tác ghi, `meta.invalidatesQuery: ["collections"]`. Toast thành công theo §6 (chuỗi có tên bộ: dùng `successMessage` dạng hàm nếu `MutationCache` hỗ trợ, không thì gọi `toast` trong hook — ghi rõ chỗ nào trong báo cáo).
4. `lib/stores/shop-dialog.ts`: thêm `| { type: "collection"; lut: LutDTO }`; `login` / `register` thêm `then?: "download" | "collection"`.
5. `hooks/use-save-to-collection.ts`: §6.1 (`open(lut)`: chưa đăng nhập → `{ type: "register", lut, then: "collection" }`; đã đăng nhập → `{ type: "collection", lut }`).
6. `components/shop/account/shop-dialogs.tsx`: `headingOf` cho `collection` và cho login / register có `then: "collection"` (§6.2, §6.3); `afterAuth` rẽ theo `then` (collection → mở hộp thoại lưu, **không** tải; không có `then` / `download` → giữ hành vi tải hiện tại); nút chuyển login ↔ register giữ `then`; render `SaveToCollectionPanel`.
7. `components/shop/collection/save-to-collection-panel.tsx` (mới): nội dung §6.3 (danh sách, đang tải, lỗi, khối tạo mới / hết lượt, chân, validate, toast, invalidate).
8. `components/shop/collection/collection-card.tsx`, `collection-name-dialog.tsx`, `delete-collection-dialog.tsx`, `collections-page.tsx`, `collection-detail-page.tsx`, `collection-login-prompt.tsx` (mới): §6.4 → §6.7.
9. `routes/_shop/bo-suu-tap/index.tsx`, `routes/_shop/bo-suu-tap/$id.tsx` (mới): query `enabled` khi đã có `user` (không `ensureQueryData` trong loader vì phiên nạp sau); 404 / id không phải số → `ShopNotFound` §6.7; `document.title` theo §6.4, §6.7.
10. `components/shop/luts/lut-card.tsx`: prop `onRemove?: (lut) => void` (§6.7, chỉ hiện nút khi có prop). `lut-grid.tsx`, `lut-detail.tsx`: dùng `useSaveToCollection`, **xoá hẳn** toast "Bộ sưu tập sẽ có ở bản sau"; trang chi tiết đọc `myCollectionsQueryOptions(lut.id)` khi có `user` để hiện "Đã lưu".
11. `components/shop/layout/sidebar/nav-config.ts`: `{ id: "collections", label: "Bộ sưu tập", icon: FolderHeart, to: "/bo-suu-tap" }` vào nhóm thứ hai, **trước** "Bảng giá". `components/shop/layout/header/header-actions.tsx`: mục "Bộ sưu tập của tôi" (icon `FolderHeart`) ngay trên "Đăng xuất".
12. Khi backend đã lên (`curl http://localhost:9500/api/v3/api-docs` có `/collection/`): `pnpm api:types` để `api.gen.ts` có `/collection/*`, so lại type tay.

## Ràng buộc
- Type / axios theo §5 (backend đang làm song song — không chờ `api:types`). `containsLut` chỉ có khi gọi `my-list?lutId=` / sau `item/add|remove` / tạo kèm LUT.
- Mọi chuỗi giao diện nguyên văn §6, ngoặc kép cong `“ ”` (U+201C / U+201D).
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/bo-suu-tap.spec.ts` — đọc để biết selector, KHÔNG sửa. Chú ý selector:
  - Hộp thoại lưu: `getByRole("dialog", { name: "Lưu vào bộ sưu tập" })`; danh sách `ul[aria-label="Bộ sưu tập của bạn"] li`; mỗi dòng có checkbox mà **accessible name đúng bằng tên bộ** (`getByRole("checkbox", { name, exact: true })`) — chữ "{n} LUT" / "Trống" nằm cùng `li` nhưng **không** nằm trong tên của checkbox; ô `getByLabel("Tên bộ sưu tập mới")`; nút "Tạo và lưu", "Xong"; link "Nâng cấp Pro"; lỗi tìm bằng text chính xác; ô lỗi có `aria-invalid="true"`.
  - Trang danh sách: `ul[aria-label="Bộ sưu tập của tôi"] > li`, mỗi `li` có `heading` tên bộ (exact) và các `img` của ảnh ghép (bộ 2 LUT → đúng 2 `img`); link `aria-label="Mở bộ sưu tập {tên}"`; nút "Tuỳ chọn cho {tên}" → `menuitem` "Đổi tên" / "Xoá"; xoá là `alertdialog` tên "Xoá bộ sưu tập “{tên}”?".
  - Nội dung trang nằm trong `#shop-main` (khối mời đăng nhập có nút "Đăng nhập" exact và "Tạo tài khoản" trong `#shop-main`).
  - Menu trái: `getByRole("complementary", { name: "Menu chính" }).getByRole("link", { name: "Bộ sưu tập", exact: true })`; menu tài khoản: `menuitem` "Bộ sưu tập của tôi".
  - Trang một bộ: `h1` tên bộ; nút "Đổi tên", "Xoá" (exact) trong `#shop-main`; link "Thêm LUT từ kho"; `nav aria-label="Đường dẫn"`; thẻ LUT là `li` có heading tiêu đề LUT; nút "Bỏ {LUT} khỏi bộ sưu tập"; toast `[data-sonner-toast]` có nút "Hoàn tác", tự tắt sau 5 giây.
  - Trang chi tiết LUT: nút exact "Lưu vào bộ sưu tập" / "Đã lưu".
- Hồi quy: `tai-lut.spec.ts`, `shop-flows.spec.ts`, `tai-khoan-khach.spec.ts` phải vẫn pass (đụng `shop-dialogs.tsx`, `lut-card.tsx`) — đặc biệt luồng "Tải miễn phí" → đăng ký → tự tải.
- Điện thoại (§6.8): không tràn ngang; nút "⋯" và "Bỏ khỏi bộ sưu tập" luôn hiện ở < 640 px; hộp thoại lưu cuộn trong khung.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn trong `components/ui/`: `dialog`, `alert-dialog`, `checkbox`, `dropdown-menu`, `input`, `label`, `field`, `skeleton`, `tooltip`, `sonner`, `button`; của cửa hàng: `ShopButton`, `ShopField`, `LutMiniCard`, `LutCard`, `ShopNotFound`, `ShopError`. Không cần `shadcn add`. Không đổi theme / màu / font toàn app.
- Cấm `git stash/reset/checkout/clean` (worktree dùng chung).

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. `grep -rn "Bộ sưu tập sẽ có ở bản sau" src` rỗng.
4. Nếu `curl http://localhost:9500/api/v3/api-docs` đã có `/collection/`: `pnpm test:e2e tests/e2e/bo-suu-tap.spec.ts --reporter=line --workers=1` và dán kết quả; chưa có thì ghi "chờ backend".
5. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
