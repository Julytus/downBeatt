# Fix 1: xep-hang-goi-y — frontend

Vòng trước: dispatch ctx_8c2ef33d2fbd. Sửa đúng các lỗi dưới, không làm thêm việc khác.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `frontend/src/components/shop/luts/for-you/for-you-item.tsx` (div bọc `LutCard`, nhánh `isHidden && "opacity-40 pointer-events-none"`) | plan §6.2: thẻ đã ẩn thì "mọi nút / link trong thẻ không bấm được (`inert`)". `pointer-events-none` chỉ chặn chuột; bàn phím vẫn Tab vào link "Xem LUT {LUT}", nút "Tải {LUT}", "Thêm {LUT} vào bộ sưu tập", "Không quan tâm {LUT}" của thẻ đã ẩn. | Code hiện tại: `isHidden && "opacity-40 pointer-events-none"`, không có thuộc tính `inert`. | Div bọc `LutCard` có thuộc tính `inert` khi `isHidden` (React 19: `inert={isHidden}`), giữ `opacity-40`. Link tiêu đề (`p` thứ 2) của thẻ đã ẩn cũng không bấm / Tab được (`inert` trên `p` đó hoặc `tabIndex={-1}` + `pointer-events-none`), nhưng **giữ nguyên** cấu trúc `li` > `div`, `p`, `p` (spec đếm `./p`). Lớp phủ "Đã ẩn khỏi gợi ý" + nút "Hoàn tác" vẫn bấm và Tab được. |
| 2 | Báo cáo `worker_done` vòng trước | `frontend/AGENTS.md` mục "Skill UI/UX": báo cáo phải có dòng "Skill: …" | Báo cáo vòng trước không có dòng này. | Báo cáo vòng này có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp cho khối gợi ý). |

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu
1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. `pnpm test:e2e tests/e2e/xep-hang-goi-y.spec.ts -g "TC-29|TC-35" --workers=1 --reporter=line` → 2 passed (dán dòng tổng).
3. Dán đoạn JSX đã sửa (div bọc `LutCard` và `p` tiêu đề).
