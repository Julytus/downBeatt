# Task: trang-chu — frontend (agy)

Plan: plan/trang-chu.md (đã duyệt 2026-11-05). Đọc §1, §2, §3, §5, §6 (toàn bộ, đây là đặc tả giao diện), §8.

## Target
Route `/` (trang chủ landing page cửa hàng), thư mục mới `src/components/shop/home/`. Lát **chỉ frontend**, dữ liệu giả `lib/mock/**`, không có backend, không resource code.

## Việc cần làm (trích §8 — làm theo thứ tự)
1. `src/components/shop/shop-theme.css`: thêm `--sh-band-pink: #f6b8d1`, `--sh-band-green: #22382a` (cùng giá trị sáng / tối), keyframe `shop-marquee`, `shop-float`, và khối `@media (prefers-reduced-motion: reduce)` tắt hết.
2. `src/lib/tanstack/options/luts.ts`: thêm `homeFeaturedLutsQueryOptions` (queryKey `["luts", "home-featured"]`, gọi `getLuts` với `{ sort: "popular", paging: { page: 1, limit: 12 } }`).
3. `src/components/shop/pricing/use-plan-select.ts`: tách `select(plan)` + `ctaLabel(plan)` khỏi `pricing-page.tsx` thành hook `usePlanSelect(cycle)`; `pricing-page.tsx` dùng hook này, hành vi `/pricing` giữ nguyên. **Không đụng `plan-card.tsx` ngoài mức tối thiểu** (người dùng có thể đang sửa dở).
4. `src/components/shop/luts/lut-card.tsx`: nếu cần thì tách phần bìa thành `LutCover` (export); `/luts` không đổi giao diện.
5. `src/components/shop/home/home-data.ts`: `picsumId(id, w, h)` → `https://picsum.photos/id/<id>/<w>/<h>` + toàn bộ nội dung tĩnh §6 với **đúng id ảnh đã ghi** (không tự đổi ảnh, không dùng `picsum(seed)`).
6. Mỗi khối một file: `hero-section.tsx`, `creators-section.tsx`, `values-band.tsx`, `authors-section.tsx`, `collage-section.tsx`, `prompt-search-section.tsx`, `features-carousel.tsx`, `license-band.tsx`, `plans-section.tsx`, `story-cta.tsx`, `home-faq.tsx`.
7. `home-header.tsx` (menu từ `SHOP_NAV_GROUPS[0]`, ẩn/hiện bằng `IntersectionObserver` quan sát nút "Khám phá kho LUT" của hero, `ThemeToggleButton`, `HeaderActions`, `MobileNav` < lg) và `home-page.tsx` (header + 11 khối + `ShopFooter` trong `ShopShell`).
8. `src/routes/index.tsx`: bỏ `redirect`, render `HomePage`, `document.title` = "DownBeat | Kho LUT chỉnh màu cho nhà sáng tạo".
9. `src/components/shop/layout/shop-logo.tsx`: `to="/"`.

## Ràng buộc (test nghiệm thu dựa vào các điểm này)
- Mọi chuỗi giao diện **nguyên văn §6**.
- Test đã có sẵn: `frontend/tests/e2e/trang-chu.spec.ts` — đọc để biết selector, **KHÔNG sửa**. Các điểm dễ sai:
  - Mỗi khối là `<section aria-labelledby="<id h2>">` (role `region`, tên = chữ tiêu đề). Hero cũng là section trỏ tới `h1`. Đúng **một** `h1`. Tiêu đề 2 dòng: 2 `<span className="block">` trong cùng một `h2`.
  - Header là `<header>` (role `banner`) chứa cả `ThemeToggleButton`, `HeaderActions`, `MobileNav`. Nav: `<nav aria-label="Danh mục chính">`, ẩn bằng `invisible` (không chỉ `opacity-0`) khi nút hero còn trong khung nhìn; < lg thì `hidden`.
  - Mục menu chưa có: `<a href="#" aria-disabled="true">` + `preventDefault`, bọc `Tooltip` "Sắp ra mắt" (giống `sidebar-nav.tsx`).
  - Khối 2: bản lặp của băng ảnh nằm trong một phần tử `aria-hidden="true"`; tên nhà sáng tạo là phần tử chữ riêng (không gộp chung chữ khác). Băng phải có `animation` (`shop-marquee`) khi không giảm chuyển động.
  - Khối 3 và 8: màu nền `--sh-band-pink` / `--sh-band-green` đặt **trên chính thẻ `<section>`**. 3 cụm tô ở khối 3 là phần tử riêng (`<mark>`/`<span>`) chứa đúng chữ "bàn tay con người", "colorist thật", "mức giá công bằng".
  - Khối 4: 7 thẻ là `Link` `/luts?q=<tên>`; tên đọc của link bắt đầu bằng tên colorist.
  - Khối 5: mỗi ảnh là link có `aria-label` = tiêu đề LUT (vd "Xanh Điện Ảnh"), để `coverText` in hoa không lọt vào tên đọc. Khi giảm chuyển động, không phần tử nào trong section có `animation`.
  - Khối 6: `<form role="search" aria-label="Tìm màu bằng lời">`; input `aria-label="Mô tả video của bạn"`; hiệu ứng gõ chữ đổi **thuộc tính `placeholder`** của input; chip gợi ý là `<button type="button">`; nút gửi `aria-label="Tìm LUT"`, `disabled` khi trim rỗng. Submit → `navigate({ to: "/luts", search: { q } })`.
  - Khối 7: nút `aria-label="Trước"` / `"Sau"` dùng `disabled` thật; trạng thái cập nhật theo `scroll` của băng. 8 `h3`, hai phần nối bằng dấu cách.
  - Khối 9: `PlanCard` (role `article`, tên = tên gói), cố định chu kỳ tháng, không render nút "Theo năm"/"Theo tháng". Link "So sánh chi tiết các gói" → `/pricing`.
  - Khối 10: khách = `<button>` "Bắt đầu miễn phí" mở `useShopDialog().open({ type: "register" })`; đã đăng nhập = `Link` "Khám phá kho LUT".
  - Khối 11: `Collapsible`, trigger là `button` có `aria-expanded`, mở độc lập nhau.
  - Không cuộn ngang ở 360–400px (dải trang trí nằm trong vùng `overflow-hidden`).
- Màu dùng biến `--sh-*`; không đổi theme/màu/font toàn app; không thêm thư viện carousel / animation.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn trong `components/ui/`: `collapsible`, `skeleton`, `tooltip`, `sheet`; nút dùng `ShopButton`. Không cần `shadcn add`.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không cần backend.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. `pnpm test:e2e tests/e2e/trang-chu.spec.ts --reporter=line` (không cần backend) và `pnpm test:e2e tests/e2e/shop-flows.spec.ts --reporter=line`: dán `N passed / M failed`; test nào đỏ thì ghi tên + lý do.
4. Tự mở `/` ở 1440px và 400px, sáng và tối, so với bố cục §6.
5. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
