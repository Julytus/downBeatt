# Task: xep-hang-goi-y — frontend (agy)

Plan: plan/xep-hang-goi-y.md (đã duyệt 2026-11-11). Đọc §1, §2, §3 (luồng A1 → A3, A6, A7, A9, E1, E4, E5), §5 (§5.1 → §5.3), §6, §8.

## Target
Cửa hàng, trang `/luts` (`routes/_shop/luts/index.tsx`): khối gợi ý "Dành cho bạn" / "Phổ biến tuần này", nút "Không quan tâm" + "Hoàn tác", `impressionId` vào VIEW, `anonId` khi gọi `related`, mô tả mới của hộp thoại "Xoá lịch sử gợi ý". Domain `recommend` + `luts`. Không có trang quản trị.

## Việc cần làm
Làm đúng 11 mục ở plan §8:
1. Type: `lib/types/recommend.ts` (`RecommendStrategy`, `ForYouLutDTO`, `ForYouDTO`), `lib/types/lut.ts` (`LutApiDTO` thêm `reason?`, `score?`, `similarity?`).
2. Axios: `lib/axios/recommend.ts` (`getForYou(limit = 12)` gửi `{ anonId: getAnonId(), limit }`, `dismissLut(lutId, impressionId?)`); `lib/axios/luts.ts` `getRelatedLuts` thêm `anonId: getAnonId()`.
3. `hooks/use-viewer-key.ts` (mới): `"u:" + user.id` / `"anon"`, kèm `ready = !loading`.
4. `lib/recommend/track.ts`: `rememberImpression(lutId, impressionId)` / `takeImpression(lutId)` (một mục, hết hạn 60 giây, lấy xong xoá); `lut-detail.tsx` gửi VIEW kèm `impressionId: takeImpression(lut.id)`.
5. Query / mutation options: `createForYouQueryOptions(viewerKey)` (`["recommend","for-you",viewerKey]`, `staleTime: 0`, `refetchOnWindowFocus: false`, `retry: 1`), `dismissLutMutationOptions` (`meta.errorMessage` "Không ẩn được LUT, vui lòng thử lại"), `clearHistoryMutationOptions` + `savePreferenceMutationOptions` thêm `["recommend","for-you"]` vào `invalidatesQuery`; khoá related thêm `viewerKey` (sửa `lut-detail.tsx`, `download-done-panel.tsx`).
6. `lib/stores/for-you-dismiss.ts` (mới, zustand): `hidden`, `removed`, `hide(lutId, impressionId)` với hẹn giờ 5 giây trong `Map` của module (không gắn component, rời trang vẫn gửi), `undo(lutId)`. Lỗi → bỏ khỏi `hidden` + toast message server qua `meta` / `MutationCache` theo `frontend/AGENTS.md`.
7. `lut-card.tsx`: prop `onDismiss?` (nút §6.2) và `onOpen?` (gọi ở `onClick` của link "Xem LUT {LUT}").
8. `components/shop/luts/for-you/for-you-section.tsx` + `for-you-item.tsx` (mới): đúng §6.1 / §6.2 / §6.5.
9. `routes/_shop/luts/index.tsx`: `<ForYouSection />` giữa `<hr>` dưới hero và `LutBrowser`, chỉ khi `!hasActiveFilters(search)`.
10. `clear-history-dialog.tsx`: mô tả §6.4.
11. `pnpm api:types` khi backend đã lên; đối chiếu type tay.

## Ràng buộc
- Type / axios theo §5 (backend làm song song, không chờ `api:types` mới code).
- Mọi chuỗi giao diện nguyên văn §6.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/xep-hang-goi-y.spec.ts`. Đọc để biết selector, KHÔNG sửa. Những điểm spec dựa vào:
  - `section` có `aria-labelledby` trỏ tới `h2` → `getByRole("region", { name: "Dành cho bạn" | "Phổ biến tuần này" })`. Dòng phụ là text nguyên văn §6.1.
  - Hàng thẻ `ul[aria-label="Gợi ý LUT"]` (helper `FOR_YOU_LIST`, `forYouItems` ở `tests/e2e/support/shop.ts`); mỗi `li` có **con trực tiếp** đúng thứ tự: `div` (LutCard + lớp phủ), `p` tiêu đề, `p` câu giải thích (POPULAR không có `p` thứ hai). Spec đếm `li > p` bằng `xpath=./p`.
  - Đang tải: phần tử có `aria-label="Đang tải gợi ý"` + `aria-busy="true"`; lỗi / rỗng: không render gì, không toast.
  - Nút: "Sửa sở thích màu" (role button, chỉ khi đăng nhập), "LUT trước" / "LUT tiếp theo" (`disabled` ở đầu / cuối; ẩn dưới `sm`), "Không quan tâm {LUT}", "Hoàn tác"; chữ "Đã ẩn khỏi gợi ý". Trên `(hover: none)` nút "Không quan tâm" phải hiện thật (opacity hiệu dụng > 0.5, không chỉ hiện khi hover).
  - TC-29: request `dismiss` gửi sau ≥ 4,9 giây kể từ lúc bấm, body đúng `{ lutId, impressionId }`; sau thành công hàng còn 11 thẻ.
  - TC-30: VIEW sau khi bấm link "Xem LUT {LUT}" trong khối mang `impressionId`; VIEW từ lưới "Danh sách LUT" không có.
- Khối mới nằm trên lưới nên vài spec cũ (link "Xem LUT …", nút "Tải …" chọn không khoanh vùng) có thể trùng phần tử ở chế độ strict. Đó là việc của Claude (sửa spec), worker **không** sửa `tests/e2e/**`; chỉ ghi lại tên test lỗi vì lý do này trong báo cáo.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn, không cần `shadcn add`: `skeleton`, `tooltip`, `button`, `sonner`; của cửa hàng: `ShopButton`, `LutCard`. Cuộn ngang dùng `ul` + CSS scroll-snap (không dùng `scroll-area`), ẩn thanh cuộn, trang không tràn ngang ở 390 px. Icon lucide: `ChevronLeft`, `ChevronRight`, `EyeOff`.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` đã có `/recommend/public/for-you`: `pnpm test:e2e tests/e2e/xep-hang-goi-y.spec.ts --reporter=line` và dán kết quả; chạy thêm `ho-so-nguoi-dung.spec.ts`, `kho-lut.spec.ts` (hồi quy).
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
