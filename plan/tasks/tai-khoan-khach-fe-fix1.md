# Fix 1: tai-khoan-khach — frontend

Vòng trước: dispatch `ctx_419d61947e54`. Sửa đúng lỗi dưới, không làm thêm việc khác. Chỉ `frontend/**` trừ `frontend/tests/e2e/**`.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `frontend/src/components/shop/account/shop-session-sync.tsx:24-39` (+ `components/shop/layout/header/header-actions.tsx:40`) | plan §6 "Header — đã đăng nhập" / §8 mục 8: sau khi đăng ký / đăng nhập thành công, header phải hiện nút "Tài khoản {tên}" | E2E TC-25, TC-29 đỏ: sau "Tạo tài khoản", header kẹt ở `status "Đang tải tài khoản"`, không có `button "Tài khoản Khách Tải Noir"`. Nguyên nhân: `registerMutationOptions` / `loginMutationOptions` set token trước → `ShopSessionSync` thấy `accessToken && !user` → query `account-me` chạy → `setLoading(true)`. Mutation `setUser(user)` ngay sau đó → `useQuery` bị disable và nhánh `if (!user)` trong effect không chạy nữa → `loading` mãi `true`. `HeaderActions` kiểm `loading` trước `user` nên chỉ hiện khung chờ. | Khi đã có `user` thì `loading = false` (vd. trong effect: có `user` → `setLoading(false)`; hoặc `setUser` trong store đặt luôn `loading: false`). Khung chờ chỉ hiện khi có token mà **chưa** có `user` (TC-21 vẫn phải xanh: tải lại trang có token → thấy `status "Đang tải tài khoản"` trước, rồi tới nút tài khoản). |

## Nghiệm thu

1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. `cd frontend && pnpm test:e2e tests/e2e/tai-khoan-khach.spec.ts -g "TC-2" --reporter=line` → dán dòng tổng kết (TC-20 → TC-29 xanh). Không sửa file spec.
3. `worker_done` theo AGENTS.md mục 4, kèm dòng "Skill: …".
