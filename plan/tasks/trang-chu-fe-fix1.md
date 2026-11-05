# Fix 1: trang-chu — frontend

Vòng trước: dispatch `ctx_27458a7cd08a`. Sửa đúng các mục dưới, không làm thêm việc khác. Plan §6 **đã được sửa** ở khối 1, khối 5, khối 10 (các đoạn ghi *"sửa 2026-11-05 theo ảnh người dùng so với video"*): đọc lại 3 đoạn đó trước khi làm. Người dùng đã so ảnh chụp trang mình với video tham khảo và thấy 3 khối này còn kém xa.

## A. Giao diện theo plan §6 đã sửa (người dùng yêu cầu)

| # | Vị trí | Vấn đề hiện tại | Mong đợi |
|---|---|---|---|
| 1 | `home/collage-section.tsx`, `home/home-data.ts` `COLLAGE_POSITIONS` | Cụm nằm trong khung `bg-(--sh-surface)/30` bo góc; 12 ảnh xếp thành lưới 3 hàng × 4 cột, chồng sát nhau; ảnh cột phải bị cắt ở mép ("KODAK 400", "SỬ THI", "ỪNG NỔ" mất chữ); rộng tính bằng `px` trong khi `left` tính bằng `%` nên vỡ trên mobile; chữ `coverText` 34px tràn khỏi ảnh nhỏ | Đúng §6 khối 5 (bản sửa): không khung, bố cục tự do thưa (không ra hàng lối), 3 cỡ ảnh theo % bề rộng cụm, cụm có tỉ lệ cố định, không ảnh nào bị cắt, không xoay, vẫn trôi; `LutCover` có prop `size="sm"` để co chữ. `LutCard` (`/luts`) không đổi giao diện |
| 2 | `home/story-cta.tsx` | Khối là thẻ `--sh-surface` bo góc 16px, tiêu đề nhỏ, sóng đáy chỉ là một dải mỏng `--sh-pink/15` gần như không thấy | Đúng §6 khối 10 (bản sửa): tràn hết bề ngang, nền `--sh-bg`, `h2` cỡ `md:text-5xl lg:text-6xl`, ảnh lớn hơn, **dải sóng lớn** hồng → hồng cam, mép mờ hạt, ảnh 3 chồng lên sóng. Bỏ `dark:border-zinc-800` (viền dùng `--sh-bg`) |
| 3 | `home/hero-section.tsx` (2 div `blur-3xl` dòng 13–20) | Hai đốm mờ tròn `size-80` độ đục 20% gần như không thấy, không phải "dải uốn lượn" | Đúng §6 khối 1 (bản sửa): dải lụa dọc hình sóng hồng → xanh dương thấy rõ ở bên trái (SVG path + gradient + blur mép), dải phải nhỏ / mờ hơn; không cuộn ngang, không che chữ |

## B. Lỗi tìm được khi review

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 4 | `home/features-carousel.tsx` | TC-15 không ổn định: nút "Sau" có lúc **không bao giờ** `disabled` khi đã cuộn hết | `pnpm test:e2e tests/e2e/trang-chu.spec.ts tests/e2e/shop-flows.spec.ts` (chạy song song) → `TC-15 băng tính năng: Timeout 20000ms exceeded while waiting on the predicate` (đợi `next` disabled); chạy riêng thì xanh | Tìm nguyên nhân thật (gợi ý: `snap-mandatory` + `snap-start` có thể không cho cuộn tới đúng mép cuối nên còn lệch > 15px; `setTimeout` 350ms đoán mò). Ví dụ: thẻ cuối `snap-end`, hoặc `snap-proximity`, tính cuối bằng `scrollLeft + clientWidth >= scrollWidth - 2`, cập nhật qua `onScroll` (bỏ `setTimeout`). Phải xanh khi chạy `--repeat-each=10 --workers=4` |
| 5 | `home/features-carousel.tsx` | §6 khối 7: "2 nút tròn **chồng lên mép trái / phải**" của băng | Nút đang nằm ở góc phải cạnh tiêu đề | Nút "Trước" chồng mép trái, "Sau" chồng mép phải của băng thẻ (căn giữa theo chiều dọc), vẫn `disabled` thật |
| 6 | `home/prompt-search-section.tsx:84,96` | §6 khối 6: "thẻ trắng **(cả hai giao diện)**"; frontend/AGENTS.md: màu theo `--sh-*`, không đổi theo `dark:` riêng | `dark:bg-zinc-900`, `dark:bg-zinc-800` làm thẻ thành đen ở giao diện tối | Thẻ và ô nhập luôn trắng; chữ, chip, viền trong thẻ dùng màu cố định tối (`#151a20`, viền xám) để đọc được ở cả hai giao diện. Không còn `dark:` |
| 7 | `shop/shop-theme.css` khối `@media (prefers-reduced-motion)` | Hồi quy: xoá mất `width: 100%; opacity: 0.6;` của `.shop-progress` | `git diff` file này | Giữ nguyên 2 thuộc tính cũ cho `.shop-progress` (chỉ thêm `.shop-marquee`, `.shop-float` vào danh sách tắt animation) |
| 8 | `luts/lut-card.tsx` | §8 mục 4: "`LutCard` dùng `LutCover`" | `LutCard` vẫn tự render chữ bìa riêng, `LutCover` chỉ trang chủ dùng → lặp code | Nếu `BeforeAfter` cho phép, `LutCard` dùng chung phần chữ bìa (vd tách `LutCoverText`); giao diện `/luts` không đổi. Không làm được gọn thì giải thích trong báo cáo |
| 9 | `home/creators-section.tsx` | Lặp nguyên khối JSX cho bản sao `aria-hidden` | 2 khối map giống hệt | Tách component thẻ nhà sáng tạo, render 2 lần |

## Phạm vi được sửa
`frontend/src/**`. **Không** sửa `frontend/tests/e2e/**`, `plan-card.tsx`.

## Nghiệm thu (tự chạy trước khi worker_done, dán output vào báo cáo)
```bash
cd frontend && pnpm build 2>&1 | tail -3 && pnpm lint 2>&1 | tail -3
pnpm test:e2e tests/e2e/trang-chu.spec.ts tests/e2e/shop-flows.spec.ts --reporter=line 2>&1 | tail -5
pnpm test:e2e tests/e2e/trang-chu.spec.ts -g "TC-15" --repeat-each=10 --workers=4 --reporter=line 2>&1 | tail -3
```
Tự mở `/` ở 1440px và 400px, sáng và tối: chụp khối 1, 5, 10 so với video, xác nhận không cuộn ngang và không ảnh nào bị cắt ở khối 5. Báo cáo ghi dòng "Skill: …".
