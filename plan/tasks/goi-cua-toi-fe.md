# Task: goi-cua-toi — frontend (agy)

Plan: plan/goi-cua-toi.md (đã duyệt 2026-11-14). Đọc §2, §3, §5, §6, §8.

## Target
Route mới `/goi-cua-toi` (layout `_shop`), domain `billing` / `account`. Không có resource quản trị (chỉ khách đã đăng nhập).

## Việc cần làm (plan §8)
1. `lib/types/account.ts`: `ShopUserDTO` và `AccountMeApiDTO` thêm `planAutoRenew?: 0 | 1`; thêm `SubscriptionDTO { planCode: PlanCode; planName: string; cycle?: ApiBillingCycle; startDate?: string; endDate?: string; autoRenew?: 0 | 1 }`; `OrderListItemDTO = Omit<OrderDTO, "planExpiresAt">`; dùng `Page<T>` chung nếu đã có trong `lib/types/common.ts` (không có thì thêm `{ total; page; items }`).
2. Chỗ map `account/me` → `ShopUserDTO` (store `shop-session` / `lib/axios/account.ts`): chép thêm `planAutoRenew`.
3. `lib/axios/billing.ts`: `getMyOrders(page, limit)` (`GET /order/my-list`), `getMySubscription()` (`GET /subscription/my`), `cancelSubscription()` (`POST /subscription/cancel`).
4. `lib/tanstack/options/billing.ts`: `myOrdersQueryOptions(page)` (key `["order-my-list", page]`), `mySubscriptionQueryOptions` (key `["subscription-my"]`), `cancelSubscriptionMutationOptions` (toast thành công cần ngày hết hạn từ kết quả → xem §6.1; invalidate `["subscription-my"]` và `["account-me"]`; lỗi hiện message backend nguyên văn). Khi `orderQueryOptions` thấy `PAID` lần đầu (trang kết quả) thì invalidate thêm `["subscription-my"]` và `["order-my-list"]`.
5. `lib/utils/plan.ts`: `formatOrderDateTime(iso)` → "10/11/2026 10:14" (tách chuỗi, không qua `new Date`); `orderStatusLabel(status)`; `cycleLabel(cycle)` → "Theo năm" / "Theo tháng".
6. `routes/_shop/goi-cua-toi.tsx` (mới, `validateSearch` zod cho `trang?: number`, `.catch(undefined)`; `document.title` "Gói của tôi | DownBeat") + `components/shop/subscription/my-plan-page.tsx`, `current-plan-card.tsx`, `cancel-plan-dialog.tsx`, `order-history-table.tsx`, `my-plan-login-prompt.tsx` (chép `collection-login-prompt.tsx`): §6.1.
7. `components/shop/layout/header/header-actions.tsx`: §6.2 (mục "Gói của tôi", trạng thái đã huỷ gia hạn).
8. `components/shop/pricing/pricing-page.tsx`: §6.3 (khung nhắc chỉ khi `planAutoRenew !== 0`).

## Ràng buộc
- Type/axios theo §5 (backend đang làm song song — không chờ `api:types`).
- Mọi chuỗi giao diện nguyên văn §6 (kể cả "Huỷ" có dấu theo kiểu "uỷ", dấu "·", "—", "…").
- Khối "Gói hiện tại" và "Lịch sử đơn hàng" là `<section aria-labelledby>` trỏ tới `h2` tương ứng (test tìm bằng role `region`). Hộp thoại huỷ dùng `AlertDialog` (role `alertdialog`, tên = tiêu đề "Huỷ gói Pro?").
- Mỗi khối tự xử lý tải / lỗi riêng (§6.1, E3): lỗi một khối không ẩn khối kia; query không toast.
- Chưa đăng nhập: không gọi `order/my-list` / `subscription/my`.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/goi-cua-toi.spec.ts` — đọc để biết selector, **KHÔNG sửa**.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"), giao diện khu cửa hàng (biến `--sh-*`, `ShopButton`, portal có class `shop`). Component shadcn có sẵn trong `components/ui/`: `alert-dialog`, `badge`, `table`, `skeleton`, `button`, `dropdown-menu`, `sonner`, `empty` — không cần `shadcn add`. Bảng cuộn ngang trong khung ở màn hẹp, trang không cuộn ngang.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`. Các file frontend đang có thay đổi chưa commit từ trước (`hero-section.tsx`, `home-data.ts`, `vite.config.ts`, `playwright.config.ts`, `.env.example`): không đụng.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` có `/subscription/my`: `pnpm test:e2e tests/e2e/goi-cua-toi.spec.ts --reporter=line` và dán kết quả (đỏ do backend chưa xong thì ghi rõ).
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng/thêm, quy tắc UX đã áp).
