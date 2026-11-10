# Task: goi-thanh-toan — frontend (agy)

Plan: plan/goi-thanh-toan.md (đã duyệt 10/11/2026). Đọc kỹ §1, §3, §5 (hợp đồng API), §6 (toàn bộ chuỗi giao diện), §8.

## Target
Khu cửa hàng: `/pricing` (sửa), hộp thoại "Mua gói" / "Nâng cấp để tải LUT Premium" (sửa), trang mới `/thanh-toan/ket-qua/$code` (layout `_plain`), menu tài khoản ở header (sửa), mục gói ở trang chủ (đổi sang API). Domain `billing`. Không có trang quản trị, không có resource code.

## Việc cần làm (đúng §8)
1. `lib/types/account.ts`: `PlanDTO` khớp §5.1 (`code`, `name`, `audience`, `monthlyPrice`, `yearlyMonthlyPrice`, `canDownloadPremium: 0 | 1`, `maxMembers`, `isHighlight: 0 | 1`, `license: string[]`, `features: string[]`; sửa mọi chỗ đang đọc `highlight`). `BillingCycle` giữ `"month" | "year"` ở giao diện, đổi sang `"MONTH" | "YEAR"` khi gọi API. Thêm `OrderDTO` (§5.3), `OrderStatus` (`PENDING | PAID | CANCELLED | EXPIRED`), `CreateOrderRequest { planCode, cycle, sourceLutId? }`, `CreateOrderResult { code, amount, checkoutUrl }`. `planExpiresAt?: string` trên user (§5.8).
2. `lib/axios/billing.ts` (mới): `getPlans` (`GET plan/public/list`), `createOrder` (`POST order/create`), `getOrder(code)` (`GET order/get?code=`), `cancelOrder(code)` (`POST order/cancel/{code}`).
3. `lib/tanstack/options/billing.ts` (mới): `plansQueryOptions` (chuyển từ `options/account.ts`, `staleTime` 5 phút), `orderQueryOptions(code)` (`refetchInterval` 2000 khi `PENDING` và chưa quá 60 s kể từ lúc bắt đầu hỏi), `createOrderMutationOptions` (tắt toast thành công; lỗi toast message backend nguyên văn), `cancelOrderMutationOptions`. Xoá `checkoutMutationOptions`, `checkout`, `getPlans` khỏi `lib/mock/account.ts` (giữ `requestLutDownload` cho lát `tai-lut`; bản tải giả đọc `user.plan` thật).
4. `lib/utils/plan.ts` (mới): `daysLeft(planExpiresAt, today)`, `formatPlanDate(iso)` (dd/MM/yyyy **có đệm số 0**, tách chuỗi `"2027-11-10"`, không `new Date("2027-11-10")`, không `toLocaleDateString("vi-VN")` vì không đệm số 0 — xem §6 đầu mục), `planAction(user, plan)` trả nhãn + trạng thái nút theo bảng §6.1 (dùng chung cho `/pricing`, hộp thoại, menu).
5. `lib/stores/shop-dialog.ts`: `checkout` thêm `sourceLutId?: number`.
6. `components/shop/pricing/pricing-page.tsx`, `plan-card.tsx`, `use-plan-select.ts`: §6.1 (đọc API; Skeleton khi tải; lỗi "Không tải được bảng giá" + "Thử lại"; nhãn nút theo bảng; badge "Gói hiện tại"; khung nhắc `role="status"` khi còn ≤ 3 ngày; sửa câu FAQ "Có được đổi gói giữa chừng không?").
7. `components/shop/account/checkout-panel.tsx`: §6.2 (nút chu kỳ trong hộp thoại `role="group"` `aria-label="Chu kỳ thanh toán"`; "Thanh toán 948.000đ" → "Đang tạo đơn…" → `window.location.assign(checkoutUrl)`; lỗi toast + giữ hộp thoại; bỏ dòng "Bản demo…"; dòng gia hạn / đổi gói). `upgrade-panel.tsx`: §6.3 (nút chính "Mua gói Pro" mở hộp thoại mua theo năm mang `sourceLutId = lut.id`, link "Xem bảng giá", giữ "Để sau"). `shop-dialogs.tsx`: tên gói từ API.
8. `components/shop/layout/header/header-actions.tsx`: §6.5 ("Gói **Pro**", "Hết hạn dd/MM/yyyy", "Còn {n} ngày" / "Hết hạn hôm nay", mục "Gia hạn gói", "Nâng cấp lên Studio", giữ "Nâng cấp lên Pro" cho gói Miễn phí).
9. `routes/_plain/thanh-toan/ket-qua.$code.tsx` + `components/shop/payment/payment-result-page.tsx` (mới): §6.4 đủ mọi trạng thái trong bảng, `document.title` = "Kết quả thanh toán | DownBeat". Chỉ tin `GET order/get`; ngoại lệ duy nhất: `cancel=true` trên URL và lần đọc đầu thấy PENDING → gọi `order/cancel` một lần (lỗi `ORDER_INVALID_STATUS` bỏ qua, đọc lại). "Huỷ đơn" mở `AlertDialog` "Huỷ đơn {code}?". Lần đầu thấy PAID: `invalidateQueries(["account-me"])` (kiểm lại query key thật của `account/me`). Chưa đăng nhập: nút "Đăng nhập" mở hộp thoại đăng nhập có sẵn, đăng nhập xong ở lại trang.
10. `lib/mock/data/plans.ts`: chỉ giữ `PLAN_COMPARISON`; xoá `MOCK_PLANS` khi hết chỗ dùng (`components/shop/home/plans-section.tsx` cũng đổi sang API).

## Ràng buộc
- Type / axios theo §5 (backend đang làm song song — không chờ `api:types`).
- Mọi chuỗi giao diện **nguyên văn** §6 (heading, mô tả, nhãn nút, toast). Tiền dùng `formatVnd` có sẵn.
- Không đọc / không nhúng bất kỳ khoá payOS nào ở frontend (`grep -r PAYOS_ frontend/src` phải rỗng). Frontend không gửi `amount`.
- Giữ nguyên các mốc test cũ đang dùng: thẻ gói là `article` có accessible name = tên gói ("Pro"…) và `id="plan-pro"` / `plan-studio`; nút "Theo tháng" / "Theo năm −20%" có `aria-pressed`; nút "Tải LUT Premium" ở `/luts/kodak-400`; hộp thoại "Tạo tài khoản để mua gói Pro" → sau đăng ký mở "Mua gói Pro".
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/goi-thanh-toan.spec.ts` (TC-35 → TC-44 là giao diện) — đọc để biết selector, **KHÔNG sửa**. Spec cũ `shop-flows.spec.ts`, `tai-khoan-khach.spec.ts` (TC-29), `trang-chu.spec.ts`, `shop-ui.spec.ts` cũng không sửa và phải vẫn xanh.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn trong `components/ui/`, không cần `shadcn add`: `Dialog`, `AlertDialog` (huỷ đơn), `Skeleton` (đang tải bảng giá / đơn), `Button`, `Badge` ("Gói hiện tại"), `DropdownMenu` (menu tài khoản), `sonner` (toast lỗi). Vòng quay chờ: dùng icon `lucide-react` `Loader2` có `animate-spin`, tôn trọng `prefers-reduced-motion`.
- Không đổi theme / màu / font toàn app. Không sửa `routeTree.gen.ts` bằng tay (để Vite plugin sinh).
- Không đổi branch, không `git stash/reset/checkout/clean`.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend, không sửa `backend/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` đã có `/order/create` (backend xong): `pnpm test:e2e tests/e2e/goi-thanh-toan.spec.ts --reporter=line --workers=1` và dán kết quả; rồi `pnpm test:e2e tests/e2e/shop-flows.spec.ts tests/e2e/trang-chu.spec.ts tests/e2e/tai-khoan-khach.spec.ts --reporter=line --workers=1`. Backend chưa xong thì ghi rõ "chưa chạy E2E vì backend chưa có endpoint".
4. `grep -rn PAYOS_ src` rỗng.
5. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
