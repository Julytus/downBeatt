# Task: goi-cua-toi — backend (agy)

Plan: plan/goi-cua-toi.md (đã duyệt 2026-11-14). Đọc §2, §3, §4, §5, §7, §9 (TC loại `unit`: TC-18 → TC-23).

## Target
Module `business` (package có sẵn `vn.aeoc.business.billing`, `vn.aeoc.business.account`) + `base` (ErrorCode) + `entity` (POJO). **Không có migration, không chạy jOOQ codegen** (bảng không đổi; `subscription.auto_renew` đã có từ V7).

## Việc cần làm (plan §7)
1. `base/.../ErrorCode.java`: thêm `NO_ACTIVE_PLAN(400, "Bạn chưa có gói trả phí nào để huỷ")`.
2. `entity/.../billing/Subscription.java`: thêm field response `planCode`, `planName` (không thuộc bảng); `@JsonProperty(access = WRITE_ONLY)` cho `id`, `userId`, `planId`, `orderId`, `status`, `activeUserId`, `createdTime`, `updatedTime` → JSON đúng §5.2. Kiểm không chỗ nào khác đang trả `Subscription` ra JSON.
3. `entity/.../auth/User.java`: thêm `Integer planAutoRenew` (NON_NULL như `planExpiresAt`).
4. `billing/repository/PaymentOrderRepository`: `myList(userId, offset, limit)` (join `plan` lấy `planCode`/`planName`, left join `lut` lấy `sourceLutSlug`/`sourceLutTitle`; dùng lại `fields()` / `joined()` của `getOrderByCode`), sắp `created_time DESC, id DESC`; + `countByUser(userId)`.
5. `billing/repository/SubscriptionRepository`: `disableAutoRenew(id)` = `UPDATE subscription SET auto_renew = 0 WHERE id = ? AND status = 'ACTIVE'`.
6. `billing/service/OrderService.myList(userId, page, limit)`: `page` null/< 1 → 1; `limit` null/< 1 → 10, > 50 → 50; xoá `checkoutUrl` ở đơn không `PENDING`; trả `Page<PaymentOrder>` (`new Page<>(total, page, items)`). **Không** gọi payOS.
7. `billing/service/SubscriptionService`: `my(userId)` và `cancel(userId)` theo §5.2, §5.3. "Gói còn hạn" = `findActiveByUserId(userId, hôm nay)`. Dùng `Clock` Asia/Ho_Chi_Minh như `OrderService` (constructor thứ hai nhận `Clock` để test). `my` khi không có gói → `{ planCode: "free", planName: <tên dòng free trong bảng plan> }`. `cancel` là `@Transactional`; không có gói → `AppException(NO_ACTIVE_PLAN)`; đã là 0 → vẫn trả 200 như lần đầu.
8. `billing/service/PaymentActivationService`: nhánh gia hạn cùng gói đặt `auto_renew = 1` và thêm `SUBSCRIPTION.AUTO_RENEW` vào danh sách cột `updateByCondition` (§5.5). Hai nhánh tạo dòng mới giữ nguyên.
9. `billing/controller/OrderController`: `@GetMapping("/order/my-list")` với `@RequestParam(required = false) Integer page, limit`.
10. `billing/controller/SubscriptionController` (mới, `extends BaseController`): `GET /subscription/my`, `POST /subscription/cancel` (không cần body; `{}` hay rỗng đều được). Lấy user bằng `SecurityUtils.userId(principal)`. Chỉ cần token, không kiểm resource (giống `order/get`).
11. `business/account/service/AccountService.me`: có gói còn hạn thì set thêm `planAutoRenew = activeSub.getAutoRenew()`; gói Miễn phí không có khoá này.

## Ràng buộc
- Hợp đồng §5 cố định: path, field, kiểu, mã lỗi, message nguyên văn. Response mẫu trong plan là nguồn sự thật (ví dụ `subscription/my` gói Miễn phí trả **đúng** 2 khoá `planCode`, `planName`).
- Không có tham số `userId` ở API: luôn lấy từ token.
- Huỷ gói **không** đổi `status` / `start_date` / `end_date` / `cycle`, không đụng `payment_order`, không gọi payOS, không ghi sự kiện gợi ý.
- `my-list` trả mọi trạng thái đơn của người gọi; đơn không có khoá `id`, `userId`, `planId`, `payosOrderCode`, `payosPaymentLinkId`, `payosReference`, `webhookPayload`, `updatedTime`, `planExpiresAt`.
- Không thêm endpoint ngoài §5. Không `@Idempotent`, không Kafka.
- File `backend/business/.../billing/service/OrderService.java` đang có thay đổi chưa commit từ trước (của người dùng): giữ nguyên các thay đổi đó, chỉ thêm `myList`.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có các test TC-18 → TC-23 (tên test chứa ID TC).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng".
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/goi-cua-toi.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed` (spec do Claude viết, **không sửa**; đỏ thì sửa backend).
