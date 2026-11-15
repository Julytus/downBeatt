# Task: dashboard-admin — backend (agy)

Plan: plan/dashboard-admin.md (đã duyệt 12/11/2026). Đọc §2, §4, §5, §7, §9 (TC-01 → TC-06 loại unit, bộ dữ liệu §9.1).

## Target
Package mới `vn.aeoc.business.dashboard` (`controller/`, `service/`, `repository/`, `calc/`) trong module `business`. Entity không thuộc bảng ở `entity/.../data/mysql/dashboard/`. Migration `V17__dashboard_admin.sql` (mới nhất hiện có là V16). Không có bảng mới, không cần sinh lại jOOQ.

## Việc cần làm (chi tiết ở plan §7, làm đúng thứ tự)
1. Migration `backend/app/src/main/resources/db/migration/V17__dashboard_admin.sql` đúng nguyên văn SQL ở §4 (module `SALES`, resource `DASHBOARD` uri `/dashboard/` actions `["VIEW"]`, index `idx_payment_order_status_paid`). Không cấp permission. → `sh scripts/ai/backend-restart.sh`.
2. Entity (POJO `@JsonInclude(NON_NULL)`): `DashboardSummary`, `DashboardTotals`, `DashboardPoint`, `PlanRevenue`, `ActivePlans`, `PlanCustomers`, `DashboardTopLut` — field đúng tên và kiểu §5.1 / §7.2 (`Long` cho số đếm / tiền, `Integer isPremium`, `Double premiumRatio`). `DashboardTotals.from/to` chỉ gán cho `previous` (của `summary` để null → không xuất hiện trong JSON).
3. `calc/` thuần static: record `RevenueDay`, `CountDay`, `DownloadDay`, `DateRange`; `DashboardCalculator.resolveGroupBy`, `previousRange`, `series`, `totals` (§7.3).
4. `DashboardRepository` (§7.4): 7 truy vấn jOOQ gom, điều kiện khách hàng viết một lần.
5. `DashboardService` (§7.5): hai constructor (Clock mặc định Asia/Ho_Chi_Minh + bản nhận Clock), parse STRICT `uuuu-MM-dd`, thứ tự kiểm `to` → `from` → `from ≤ to` → `n ≤ 366`; hằng `MAX_DAYS = 366`, `AUTO_DAY_MAX_DAYS = 92`, `TOP_LIMIT = 10`. Chép cách parse / message của `RecommendStatsService`. Không `@Transactional`.
6. `DashboardController` (`URI = "/dashboard/"`): `GET /dashboard/summary` với `@RequestParam(required = false) String from, to, groupBy`; `checkPermission(principal, URI, "VIEW")` là **dòng đầu tiên** (403 thắng 400).
7. JUnit TC-01 → TC-06 (JUnit 5 + AssertJ + Mockito, không dựng Spring), dữ liệu đúng §9.1 / §9.2.

## Ràng buộc
- Hợp đồng §5 cố định: path, tên field, kiểu, `groupBy` trả giá trị đã dùng, `series` lấp đủ kỳ trống bằng 0, `revenueByPlan` mọi gói active khác `free` (kể cả 0), `activePlans.items` gồm cả `free` (= total − tổng trả phí, không âm), `topLuts` tối đa 10 sắp `downloads DESC, id ASC` gồm cả LUT ẩn.
- Lỗi §5.2: chỉ dùng `ErrorCode` có sẵn; message nguyên văn "Ngày không hợp lệ", "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc", "Khoảng thời gian tối đa 366 ngày"; 403 "Bạn không có quyền thực hiện thao tác này! Path: /dashboard/, Action: VIEW".
- Khách hàng = `user_app.role_id` thuộc role `is_default = 1 AND is_operator = 0`.
- Khoảng thời gian: `>= from 00:00` và `< to + 1 ngày 00:00`.
- Hướng phụ thuộc: `dashboard` chỉ đọc bảng của module khác; không module nào import `dashboard`.
- Không sửa migration cũ. Không cache, không `@Idempotent`.
- Các quyết định đã chốt ở cuối §7: không tự đổi.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Cấm `git stash/reset/checkout/clean`. Có sẵn file bẩn từ trước (`backend/.env.example`, `backend/CLAUDE.md`, `application.yml`, `RestService.java`, `OrderService.java`) — không đụng tới.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có test TC-01 → TC-06.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V17.
3. Spec nghiệm thu đã có (KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/dashboard-admin.spec.ts -g "API" --workers=1 --reporter=line` → dán dòng `N passed / M failed`.
4. Theo §7 "Nghiệm thu riêng": (a) response `GET /api/dashboard/summary` không tham số (token admin@downbeat.local / Admin@123 từ `POST /api/user/authenticate`, rút gọn `series` còn 2 phần tử); (b) `?from=<hôm nay − 364>&to=<hôm nay>` → `groupBy` "MONTH", số phần tử `series` = 13; (c) status + body 403 bằng token `noaccess@downbeat.local`; (d) xác nhận tổng cột `revenue` / `downloads` của `series` ở (a) bằng `summary`.
