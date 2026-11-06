# Task: kho-lut — frontend (agy)

Plan: plan/kho-lut.md (đã duyệt 2026-11-05). Đọc §1, §3, §5, §6, §8.

## Target
Khu cửa hàng: `/`, `/luts`, `/luts/<slug>`, `/luts/danh-muc/<slug>`, ô tìm kiếm header. Domain `lut`. Đổi nguồn dữ liệu từ `lib/mock/luts.ts` sang backend thật (6 endpoint công khai, không cần token). Không có trang quản trị, không có resource code.

## Việc cần làm
Làm đúng 9 bước ở plan §8, theo thứ tự. Tóm tắt:

1. `src/lib/types/lut.ts`: thêm `LutApiDTO`, `LutCategoryApiDTO` (đúng JSON §5); `LutDTO` giữ tên trường cũ, `id: number`, thêm `beforeUrl?`, `afterUrl?`, `lutSize?`; **bỏ** `previewFilter`, `coverText`, `coverTextStyle`, `LutCoverTextStyle`.
2. `src/lib/axios/luts.ts`: `getLuts`, `getLut`, `getRelatedLuts`, `getLutSuggestions`, `getLutCategories`, `getLutCategory` cùng chữ ký với bản mock; `paramsSerializer: { indexes: null }`; bỏ tham số rỗng; `paging` → `page` / `limit`; `toLutDTO`, `toLutCategoryDTO`; `isNotFoundError`.
3. `src/lib/tanstack/options/luts.ts`: đổi import sang `@/lib/axios/luts`.
4. `routes/_shop/luts/$slug.tsx`, `routes/_shop/luts/danh-muc/$category.tsx`: `isNotFoundError`; thêm `errorComponent` §6 ("Không tải được LUT" / "Không tải được danh mục", "Kiểm tra kết nối rồi thử lại.", nút "Thử lại" gọi `router.invalidate()`), cùng khung với `ShopNotFound`.
5. `before-after.tsx`: props `beforeSrc`, `afterSrc`; lớp trên giữ `data-graded`; ẩn vạch chia khi vị trí ≥ 100.
6. `lut-card.tsx`: bỏ lớp chữ CSS (`COVER_TEXT_CLASS*`, `LutCoverText`); `LutCover({ coverUrl, title, size, className })` chỉ còn ảnh; `LutCard`: `BEFORE_AFTER` lớp dưới `beforeUrl`, lớp `data-graded` `coverUrl`, `useSplitPosition(100)` (lúc nghỉ phủ hết thẻ); `VIDEO` như cũ.
7. `lut-compare.tsx` (lớp dưới `beforeUrl`, `data-graded` = `afterUrl`, ban đầu 55%), `lut-video-preview.tsx` (`poster` = `coverUrl`), `lut-detail.tsx` ("Định dạng" = `.cube (3D LUT, 33×33×33)` theo `lutSize`, ký tự `×`; "Ngày đăng" từ `publishedTime`), `account/lut-mini-card.tsx`, `layout/header/header-search.tsx`, `home/collage-section.tsx`: `<img src={coverUrl}>`, không còn `picsum.photos/seed/` hay CSS `filter`.
8. Dọn dữ liệu giả kho LUT: xoá `src/lib/mock/luts.ts`, `src/lib/mock/data/luts.ts`; `delay` → `src/lib/mock/account.ts`; `picsum` → `src/lib/mock/data/images.ts` (cho `luts-hero.tsx`); sửa lỗi kiểu do `id` thành `number`.
9. `pnpm build`, `pnpm lint`; backend đã chạy thì `pnpm api:types` đối chiếu `LutApiDTO`, `LutCategoryApiDTO`.

## Ràng buộc
- Type / axios theo §5 (backend đang làm song song — không chờ `api:types`). Endpoint là **GET + query param**, mảng lặp lại tên (`keywords=a&keywords=b`).
- Bố cục, nhãn, nút giữ nguyên; chỉ đổi đúng các điểm ở §6, chuỗi nguyên văn.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/kho-lut.spec.ts` (nhóm "giao diện", TC-26 → TC-39) — đọc để biết selector (ví dụ `img[data-graded]`, `dt`/`dd` "Định dạng", region "Gợi ý tìm kiếm"), **KHÔNG sửa** thư mục `tests/e2e/**`.
- Sau task: `grep -r "lib/mock/luts\|mock/data/luts\|previewFilter\|coverText" frontend/src` không còn kết quả.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Không thêm component shadcn mới; dùng lại `ShopButton`, `ShopNotFound`, `EmptyState` (lut-grid.tsx), `Tooltip` có sẵn. Không cần `shadcn add`.
- **File người dùng đang sửa dở (chưa commit):** `components/shop/home/features-carousel.tsx`, `hero-section.tsx`, `home-data.ts`, `components/shop/shop-theme.css`, `public/home.mp4`. Chỉ đụng tới khi thật sự cần cho task, và giữ nguyên thay đổi của người dùng.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. `grep` ở mục Ràng buộc rỗng.
4. Nếu `curl -s http://localhost:9200/api/v3/api-docs | grep -c "lut/public"` > 0 (backend đã xong): `pnpm test:e2e tests/e2e/kho-lut.spec.ts -g "giao diện" --reporter=line` và dán `N passed / M failed`. Chưa có thì ghi rõ "backend chưa sẵn sàng, chưa chạy E2E".
5. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
