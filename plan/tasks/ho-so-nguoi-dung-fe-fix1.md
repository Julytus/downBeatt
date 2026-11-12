# Fix 1: ho-so-nguoi-dung — frontend

Vòng trước: dispatch ctx_280bcec517f2. Sửa đúng lỗi dưới, không làm thêm việc khác. E2E hiện 28/28 xanh; đây là lệch plan mà test chưa bắt.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `frontend/src/components/shop/account/shop-dialogs.tsx` hàm `continueAfterPreference`, nhánh `saved && mode === "onboarding" && !next` | plan §6.2 "không có việc dở → đóng hộp thoại, chuyển tới `/luts` (**đang ở `/luts` thì ở yên**)" | Code gọi `navigate({ to: "/luts" })` vô điều kiện. Đang ở `/luts?style=lanh&q=noir` mà đăng ký từ header → lưu sở thích → `navigate` không truyền `search` nên bộ lọc / từ khoá trên URL bị xoá | Đang ở đường dẫn `/luts` (pathname đúng bằng `/luts`, lấy qua `useLocation` / `useRouterState`) → chỉ `close()`, giữ nguyên URL kể cả query. Ở trang khác → như cũ (`close()` + `navigate({ to: "/luts" })`) |

## Phạm vi được sửa
Chỉ `frontend/src/components/shop/account/shop-dialogs.tsx` (hoặc hook nhỏ cạnh nó nếu cần). Không sửa `frontend/tests/e2e/**`. Không restart backend.

## Nghiệm thu
1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. `pnpm test:e2e tests/e2e/ho-so-nguoi-dung.spec.ts -g "TC-35|TC-36" --reporter=line` pass (backend :9500 đang chạy).
3. worker_done dán dòng tóm tắt build / lint / test và đoạn code đã đổi (≤ 15 dòng).
