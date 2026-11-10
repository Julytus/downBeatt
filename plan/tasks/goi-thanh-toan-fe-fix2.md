# Fix 2: goi-thanh-toan — frontend

Vòng trước: dispatch `ctx_ed8acf170664` (fix1). Sửa đúng lỗi dưới, không làm thêm việc khác. Không sửa `frontend/tests/e2e/**`.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `src/lib/tanstack/options/billing.ts` (`orderQueryOptions`) | plan §6.4 dòng "404 → Không tìm thấy đơn hàng" | E2E TC-44 đỏ: khách B mở đơn của khách A, `GET /order/get` trả 404 nhưng sau 5 s trang vẫn chỉ có `Skeleton` (snapshot `main` rỗng). Nguyên nhân: query không đặt `retry`, `QueryClient` không có `defaultOptions`, nên TanStack thử lại 3 lần với backoff 1 s + 2 s + 4 s rồi mới vào `isError` | `retry` không thử lại với lỗi có HTTP 4xx (404, 401, 403); lỗi mạng / 5xx thử lại tối đa 1 lần. 404 hiện "Không tìm thấy đơn hàng" ngay sau response đầu tiên |

## Nghiệm thu
1. `cd frontend && pnpm build` xanh, `pnpm lint` 0 error.
2. `pnpm test:e2e tests/e2e/goi-thanh-toan.spec.ts -g "TC-44" --workers=1 --reporter=line` xanh (backend :9500 đang chạy, không restart).
3. worker_done: một câu "đã sửa thế nào" + dòng cuối build / lint / E2E.
