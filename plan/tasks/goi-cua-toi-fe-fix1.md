# Fix 1: goi-cua-toi — frontend

Vòng trước: dispatch `ctx_876cbf1f5c93`. Chỉ sửa đúng lỗi dưới đây, không làm thêm việc khác.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `frontend/src/components/shop/account/shop-session-sync.tsx:19-44` | plan §6.1 (huỷ thành công → `invalidateQueries(["account-me"])`) + §6.2 (menu đổi "Hết hạn {ngày}" thành "Dùng đến {ngày}" + "Đã huỷ gia hạn"). Header đọc `user` từ store `useShopSession`, nhưng query `account-me` chỉ bật khi `!user` (`enabled: Boolean(accessToken && !user)`), và effect `return` sớm khi đã có `user`. Vì vậy sau khi huỷ, `invalidatesQuery: [["account-me"]]` không làm store đổi | E2E TC-30 (`pnpm test:e2e tests/e2e/goi-cua-toi.spec.ts -g "TC-30"`): sau khi bấm "Huỷ gói" và thấy toast, mở menu tài khoản thì `Expected substring: "Dùng đến 14/11/2027"`, `Received: "…Gói ProHết hạn 14/11/2027 Gói của tôi Nâng cấp lên Studio…"` | Khi `["account-me"]` bị invalidate (huỷ gói ở `/goi-cua-toi`, trang kết quả thanh toán thấy `PAID`), store `useShopSession.user` được cập nhật theo dữ liệu mới **mà không cần F5**, và menu hiện "Dùng đến {ngày}" + "Đã huỷ gia hạn". Gợi ý: cho query `account-me` chạy khi có `accessToken` (không phụ thuộc `!user`), mỗi khi `data` mới về thì `setUser(data)`; giữ hành vi cũ khi đăng xuất / lỗi (user = null) và không bật `loading` khi đã có `user` (tránh header nháy skeleton lúc refetch nền). Không gọi `toast`/`refetch` trong component |

## Ràng buộc

- Không sửa `frontend/tests/e2e/**` (spec là hợp đồng nghiệm thu).
- Không đổi hợp đồng API, không đụng `backend/**`.
- Đăng nhập / đăng ký / đăng xuất vẫn chạy như cũ (`login-form.tsx`, `register-form.tsx` gọi `setUser` trực tiếp, giữ nguyên).

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt)

1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. Backend đang chạy ở :9500. Chạy `pnpm test:e2e tests/e2e/goi-cua-toi.spec.ts -g "TC-30|TC-24|TC-25|TC-32" --workers=1 --reporter=line` → dán dòng `N passed`. Dùng `--workers=1`: payOS sandbox trả 429 khi tạo đơn song song.
3. Chạy thêm `pnpm test:e2e tests/e2e/goi-thanh-toan.spec.ts --workers=1 --reporter=line` để chắc không vỡ luồng thanh toán / header cũ, rồi dán dòng `N passed / M failed`.
