# Task: goi-thanh-toan — backend (agy)

Plan: plan/goi-thanh-toan.md (đã duyệt 10/11/2026). Đọc kỹ §2, §3, §4, §5 (toàn bộ), §7, §9 (TC loại `unit` + 2 vector chữ ký).

## Target
Module mới `vn.aeoc.business.billing` (package `controller`, `service`, `repository`, `payos`, `constant`), cộng sửa nhỏ ở `base` (ErrorCode), `entity` (POJO), `authenticate` (whitelist webhook), `business.account` (`account/me`). Migration `V7__goi_thanh_toan.sql` (V6 là mới nhất).

## Việc cần làm (đúng §7)
1. `backend/app/src/main/resources/db/migration/V7__goi_thanh_toan.sql`: bảng `plan`, `payment_order`, `subscription` đúng §4 (UNIQUE `plan.code`, `payment_order.code`, `payment_order.payos_order_code`; cột sinh `subscription.active_user_id` + UNIQUE; FK `source_lut_id` → `lut` ON DELETE SET NULL; index `(user_id, created_time)`, `(status, created_time)`). INSERT 3 gói, `license` / `features` là JSON chép **nguyên văn** §5.1. Chạy jOOQ codegen để có `Plan`, `PaymentOrder`, `Subscription`.
2. `base/.../ErrorCode.java`: thêm `PLAN_ACTIVE(400, "Bạn đang dùng gói này")`, `ORDER_INVALID_STATUS(400, "Đơn hàng đã được xử lý")`, `PAYMENT_GATEWAY_ERROR(502, "Không kết nối được cổng thanh toán, vui lòng thử lại")`, `INVALID_SIGNATURE(400, "Chữ ký không hợp lệ")`. Không dùng lại `INVALID_ORDER_STATUS` cũ. Message "Bạn đang dùng gói Studio, cao hơn gói Pro" truyền qua `AppException(ErrorCode.PLAN_ACTIVE, message)`. Kiểm handler trả đúng HTTP 502 cho `PAYMENT_GATEWAY_ERROR`.
3. `entity`: POJO sinh ra + field ngoài bảng cho response (`planCode`, `planName`, `sourceLutSlug`, `sourceLutTitle`, `planExpiresAt` trên `PaymentOrder`). `license` / `features` của `Plan` ra JSON **mảng chuỗi**, không phải chuỗi JSON. `plan/public/list` không trả `id`, `active`, `sortOrder`, thời gian. `order/get` không bao giờ trả `id`, `userId`, `payosOrderCode`, `payosReference`, `webhookPayload` (cũng không trả `planId`, `updatedTime`).
4. `billing/payos/PayosProperties` (`@ConfigurationProperties("payos")`), `PayosSignature` (`signCreate(amount, cancelUrl, description, orderCode, returnUrl)`, `signData(JsonNode|Map)`, `verify(data, signature)` dùng `MessageDigest.isEqual`), `PayosClient` (`createLink`, `getStatus`, `cancelLink` bằng `RestClient`, timeout kết nối 5 s / đọc 10 s, header `x-client-id`, `x-api-key`). Thiếu `client-id` / `api-key` / `checksum-key` → `PAYMENT_GATEWAY_ERROR` khi gọi, app vẫn khởi động. Không thêm SDK payOS. Không log khoá.
5. `billing/repository`: `PlanRepository`, `PaymentOrderRepository` (sinh mã theo ngày §5.2 mục 5, `markPaid` `WHERE id=? AND status='PENDING'` trả số dòng, `markCancelled` tương tự, `expirePending`), `SubscriptionRepository` (`findActiveForUpdate` = `SELECT ... FOR UPDATE`, `expireOverdue`).
6. `billing/service`: `PlanService` (cache Caffeine 5 phút), `OrderService` (`create` / `get` + đối soát A5 / `cancel` / `mockPay`), `PaymentActivationService.activate(order, reference, payload)` (§5.5 bước 5, dùng chung cho webhook, mock-pay, đối soát), `PlanCredit.creditDays(...)` (hàm thuần), `PayosWebhookService`, `BillingMaintenanceService.expireOverdue(LocalDateTime now)` + `@Scheduled(cron = "0 10 0 * * *", zone = "Asia/Ho_Chi_Minh")`. Hàm có "hôm nay" nhận `LocalDate` / `Clock` để test.
7. `billing/controller`: `PlanPublicController` (`GET /plan/public/list`), `OrderController` (`POST /order/create`, `GET /order/get?code=`, `POST /order/cancel/{code}`), `OrderMockPayController` `@Profile("local")` (`POST /order/mock-pay/{code}`), `PayosWebhookController` (`POST /payment/payos/webhook`, nhận `JsonNode`). Lấy user bằng `SecurityUtils.userId(principal)`. `order/*` không token → 401 như các API cần đăng nhập khác.
8. `authenticate/.../JwtAuthenticationFilter.java`: thêm `"/payment/payos/webhook"` vào `WHITE_LIST_POST_API` (kiểm `plan/public/list` cũng công khai — theo quy ước `/public/` đang có).
9. `business/account/service/AccountService.me`: đọc subscription (§5.8), bỏ `setPlan("free")` cứng. Gói Miễn phí: không có khoá `planExpiresAt`.
10. `application.yml` + `backend/.env.example`: khối `payos` và `system.frontend-url` đúng §5.7; `.env.example` thêm `PAYOS_BASE_URL`, `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY` (để trống) + `FRONTEND_URL`, có chú thích. **Không** sửa `backend/.env` (đã có khoá thật của người dùng).

## Ràng buộc
- Hợp đồng §5 cố định: path, field, kiểu, mã lỗi, **message nguyên văn** §5.10, thứ tự kiểm ở §5.2.
- Webhook: xác thực chữ ký trên **`data` thô** (`JsonNode`/`Map`, không qua POJO) **trước** mọi thao tác DB; sắp xếp khoá A→Z, `null`/`"null"`/`"undefined"` → rỗng, mảng / object → JSON (khoá con sắp xếp, mảng giữ thứ tự). Mọi trường hợp trừ sai chữ ký → 200 `{ code: 200, message: "OK", result: null }`.
- Số tiền chỉ lấy từ bảng `plan` (bỏ qua `amount`/`status` trong request). Webhook lệch tiền → 200, đơn giữ PENDING, log WARN.
- Chống trùng chỉ bằng `UPDATE ... WHERE status='PENDING'` + UNIQUE `active_user_id`. Không `@Idempotent`, không Kafka.
- `order/create`: INSERT commit trước, rồi mới gọi payOS (không một transaction dài). payOS lỗi → đơn `CANCELLED`, 502.
- `description` gửi payOS cố định `"DownBeat"`; `returnUrl` = `cancelUrl` = `{system.frontend-url}/thanh-toan/ket-qua/{code}`; `expiredAt` = giây Unix của `created_time + 24h`; `items[0].name` = "Gói Pro - 12 tháng" / "Gói Studio - 1 tháng"…
- Gia hạn cùng gói cộng từ `end_date` cũ; đổi gói: dòng cũ `CANCELLED`, dòng mới `start = hôm nay`, `end = hôm nay + kỳ + ngày quy đổi` (§5.5). Hạ gói chỉ bị chặn khi gói cao hơn còn **> 3** ngày (§5.2 mục 2).
- Đối soát A5 trong `order/get`: chỉ khi đơn PENDING có `payos_payment_link_id`, tối đa 1 lần / 5 s / đơn; lỗi payOS → bỏ qua, trả trạng thái đang có.
- Đơn của người khác → 404 "Không tìm thấy đơn hàng" (không lộ là có tồn tại).
- Không sửa migration cũ. Không resource / phân quyền mới. Không đổi branch, không `git stash/reset/checkout/clean`.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Spec E2E `frontend/tests/e2e/goi-thanh-toan.spec.ts` đã có sẵn (đọc để biết Claude kiểm gì: nó tự ký webhook bằng Node với `PAYOS_CHECKSUM_KEY` trong `backend/.env`), **không sửa**.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, `N passed / M failed` — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có các test unit TC-01 → TC-15 (§9): `PayosSignatureTest` (TC-01 → TC-04, đối chiếu đúng 2 vector §9 với khoá `downbeat-test-checksum`), `PlanCreditTest`, `OrderServiceTest` (mock `PayosClient`), `PaymentActivationServiceTest`, `BillingMaintenanceServiceTest`… Ghi tên test ↔ TC trong báo cáo.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V7.
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/goi-thanh-toan.spec.ts -g "API" --reporter=line --workers=1` → dán dòng `N passed / M failed` (mong đợi 17 passed; TC-18 gọi payOS thật bằng khoá trong `backend/.env`). Test đỏ thì sửa code, không sửa spec; nếu thấy spec mâu thuẫn plan thì hỏi (question).
4. Chạy lại `E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/tai-khoan-khach.spec.ts -g "API" --reporter=line --workers=1` để chắc `account/me` không phá lát trước.
5. `git grep -n "PAYOS_" -- backend ':!backend/.env.example' ':!*.yml'` không ra khoá thật nào.
