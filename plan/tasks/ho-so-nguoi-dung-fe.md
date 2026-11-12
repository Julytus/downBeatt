# Task: ho-so-nguoi-dung — frontend (agy)

Plan: plan/ho-so-nguoi-dung.md (đã duyệt 2026-11-10). Đọc §1, §3 (luồng A1 → A6, E5, E6), §5, §6, §8.

## Target
Cửa hàng (không có trang quản trị): ghi 4 loại sự kiện, `anonId`, `merge-anon` sau đăng nhập / đăng ký, hộp thoại `preference` (bước 2 sau đăng ký + "Sở thích màu"), AlertDialog "Xoá lịch sử gợi ý". Domain `recommend` + `account`.

## Việc cần làm
Làm đúng 11 mục ở plan §8:
1. `lib/types/recommend.ts` (type + hằng `PREFERENCE_MAX_STYLES`, `PREFERENCE_SHOOT_OPTIONS`, `PREFERENCE_SOFTWARE_OPTIONS`).
2. `lib/recommend/anon-id.ts`: `getAnonId()` theo §6.1 (localStorage `downbeat.anonId`, UUID, mọi đọc / ghi bọc try/catch, lỗi → mã tạm trong bộ nhớ).
3. `lib/axios/recommend.ts` (`sendRecommendEvent`, `mergeAnon`, `clearRecommendHistory`); `lib/axios/account.ts` (`getPreference`, `savePreference`).
4. `lib/recommend/track.ts`: `trackEvent(...)`, chỗ duy nhất nuốt lỗi (comment lý do).
5. `lib/tanstack/options/account.ts` (`preferenceQueryOptions` `retry: false`, `savePreferenceMutationOptions` toast "Đã lưu sở thích màu"; gọi `mergeAnon` không chờ trong `loginMutationOptions` / `registerMutationOptions`), `lib/tanstack/options/recommend.ts` (`clearHistoryMutationOptions`).
6. `lib/stores/shop-dialog.ts`: thêm loại `preference` (`mode`, `next`).
7. `components/shop/account/shop-dialogs.tsx`: `headingOf`, `afterAuth` (đăng ký không có `plan` → mở `preference` onboarding kèm `next`; đăng nhập và đăng ký mua gói giữ nguyên), `continueAfterPreference`, `sm:max-w-[600px]`.
8. `components/shop/account/preference-panel.tsx` (mới): §6.2 / §6.3, `StyleTile`, `usePreferenceStyleImages()`.
9. `components/shop/account/clear-history-dialog.tsx` (mới): §6.4; hai mục menu ở `header-actions.tsx`.
10. Ghi sự kiện ở `lut-detail.tsx` (VIEW), `lut-compare.tsx` (PREVIEW), `lut-video-preview.tsx` (PREVIEW khi `currentTime >= 3`), `lut-browser.tsx` (SEARCH debounce 1 giây khi `total > 0`, FILTER_STYLE khi bật). Dùng `useRef` để StrictMode không gửi lặp.
11. `pnpm api:types` khi backend đã có endpoint mới; đối chiếu type tay.

## Ràng buộc
- Type / axios theo §5 (backend làm song song, không chờ `api:types` mới code).
- Mọi chuỗi giao diện nguyên văn §6 (ngoặc kép cong “ ” U+201C / U+201D trong dòng nhắc).
- **Ảnh mẫu phong cách**: §6.2 ghi `POST /lut/public/list` là nhầm; API có sẵn là **GET** `/lut/public/list`. Dùng hàm `getLuts` có sẵn trong `lib/axios/luts.ts` với `{ styles: [slug], sort: "popular", page: 1, limit: 1 }`.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/ho-so-nguoi-dung.spec.ts`. Đọc để biết selector, KHÔNG sửa. Những điểm spec dựa vào:
  - Hộp thoại có tên đọc = tiêu đề: "Bạn thích phong cách màu nào?" (onboarding), "Sở thích màu" (edit); AlertDialog "Xoá lịch sử gợi ý?".
  - Ba `fieldset` có `legend` (role `group`): "Phong cách màu" (legend `sr-only`), "Bạn hay quay gì?", "Bạn dựng phim bằng phần mềm nào?". Mỗi ô / chip là checkbox có tên đọc đúng tên hiển thị; bấm vào chữ tên ô thì tích / bỏ tích (label bọc checkbox). Trong nhóm "Phong cách màu" chỉ có đúng 8 `img` (ảnh mẫu).
  - Nút: "Bỏ qua", "Xem gợi ý cho tôi", "Lưu và tải LUT", "Lưu và tiếp tục", "Huỷ", "Lưu sở thích", "Thử lại", "Xoá lịch sử". Mục menu tài khoản: "Sở thích màu", "Xoá lịch sử gợi ý".
  - TC-34 chặn `Storage.prototype.getItem` / `setItem` (ném lỗi): cửa hàng vẫn phải hiện trang `/luts/noir` và gửi VIEW có `anonId` UUID. Nếu store có sẵn (theme, auth, persist zustand…) làm sập trang khi storage ném lỗi thì sửa cho chịu lỗi.
  - TC-31: SEARCH gửi sau ≥ 1 giây kể từ khi trang đầu có kết quả; gõ nhanh hai từ khoá chỉ gửi một SEARCH "đêm lạnh".
- Các spec cũ đăng ký qua giao diện đã được Claude thêm bước "Bỏ qua" (`skipPreferenceStep` ở `tests/e2e/support/shop.ts`).
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn, không cần `shadcn add`: `dialog`, `alert-dialog`, `checkbox`, `dropdown-menu`, `skeleton`, `button`, `sonner`, `label`; của cửa hàng: `ShopButton`, `ShopCheckbox`. Điện thoại (§6.5): không tràn ngang, lưới 2 cột, chân hộp thoại dính đáy.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` đã có `/recommend/public/event`: `pnpm test:e2e tests/e2e/ho-so-nguoi-dung.spec.ts --reporter=line` và dán kết quả; chạy thêm `bo-suu-tap.spec.ts`, `tai-khoan-khach.spec.ts`, `tai-lut.spec.ts`, `shop-flows.spec.ts` (hồi quy bước 2).
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
