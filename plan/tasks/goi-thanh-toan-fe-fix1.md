# Fix 1: goi-thanh-toan — frontend

Vòng trước: dispatch `ctx_43ea835ed05f`. Sửa đúng các lỗi dưới, không làm thêm việc khác. Không sửa `frontend/tests/e2e/**`.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `src/lib/tanstack/options/billing.ts` (`orderQueryOptions`) + `src/components/shop/payment/payment-result-page.tsx` | plan §6.4 "Đăng nhập (… đăng nhập xong ở lại trang)" | `enabled: Boolean(code)` nên khi chưa có token query vẫn gọi `GET /order/get` → 401 → query ở trạng thái lỗi. Đăng nhập xong `queryKey` không đổi nên không gọi lại, trang rơi vào "Không tải được đơn hàng" thay vì hiện đơn | Không gọi `order/get` khi chưa có token (`enabled` phụ thuộc token, hoặc thêm token / user id vào `queryKey`). Đăng nhập trong hộp thoại xong, trang tự tải đơn và hiện đúng trạng thái §6.4 |
| 2 | `src/components/shop/account/checkout-panel.tsx` (`fallback` 99.000 / 79.000 / 249.000 / 199.000) và `src/components/shop/account/upgrade-panel.tsx` (`fallbackPro`) | plan §6.2 "giá lấy từ API gói", §6.3 "đọc giá từ API", §6.1 "bỏ `MOCK_PLANS` ở mọi nơi dùng cho giá" | Giá và quyền lợi được viết cứng trong component làm dự phòng; bảng `plan` đổi giá (lát quản trị) thì hộp thoại hiện giá sai | Bỏ giá / features viết cứng. Khi `plansQueryOptions` đang tải: `Skeleton` cho bảng giá và nút "Thanh toán …" bị khoá; lỗi tải gói: hiện "Không tải được bảng giá" + nút "Thử lại" (chuỗi §6.1). Tên gói dự phòng trong tiêu đề (`shop-dialogs.tsx`) giữ được |
| 3 | `src/components/shop/home/home-data.ts` | Ngoài phạm vi plan §8 (task chỉ cho đổi `plans-section.tsx` ở trang chủ) | `git diff` cho thấy bỏ comment 3 danh mục "Phim nhựa", "Cổ điển", "Du lịch" trong `HERO_CATEGORIES` | Trả file về đúng như trước (3 dòng đó vẫn là comment). Sửa bằng tay, **không** dùng `git checkout` / `git restore` (hai worker chung worktree) |
| 4 | `src/components/shop/payment/payment-result-page.tsx` (tự huỷ khi `cancel=true`) | plan §6.4 "lỗi `ORDER_INVALID_STATUS` thì bỏ qua, đọc lại đơn" | Lời gọi tự huỷ dùng chung `cancelOrderMutationOptions` nên `MutationCache` vẫn bật toast "Đơn hàng đã được xử lý" khi webhook đã tới trước | Lời gọi tự huỷ dùng mutation có `meta.silentError: true` (khoá đã có trong `lib/tanstack/query-client/index.ts`); nút "Huỷ đơn" trong `AlertDialog` vẫn toast lỗi như cũ |

## Nghiệm thu
1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. `git diff -- frontend/src/components/shop/home/home-data.ts` rỗng.
3. `grep -n "99_000\|79_000\|249_000\|199_000" -r frontend/src` rỗng.
4. Báo cáo worker_done: mỗi dòng bảng trên một câu "đã sửa thế nào" + dòng cuối build / số error lint.
