# Task: dashboard-admin — frontend (agy)

Plan: plan/dashboard-admin.md (đã duyệt 12/11/2026). Đọc §2, §5, §6, §8.

## Target
Route `/admin` (`routes/admin/index.tsx`), domain `dashboard`, resource code `DASHBOARD`. Endpoint duy nhất `GET /dashboard/summary?from=&to=&groupBy=` (§5.1).

## Việc cần làm (chi tiết ở plan §8)
1. `lib/types/dashboard.ts`: các type đúng §5.1 (`DashboardGroupBy`, `DashboardTotalsDTO`, `DashboardPointDTO`, `PlanRevenueDTO`, `PlanCustomersDTO`, `ActivePlansDTO`, `DashboardTopLutDTO`, `DashboardSummaryDTO`, `DashboardSummaryParams`).
2. `lib/axios/dashboard.ts`: `getDashboardSummary(params)` → `res.data.result`.
3. `lib/tanstack/options/dashboard.ts`: `dashboardSummaryQueryOptions(params)`, key `["dashboard", "summary", from, to, groupBy]`, `staleTime` 30 giây, `placeholderData: keepPreviousData`, không toast.
4. `pnpm dlx shadcn@latest add chart` (kéo `recharts`). Kiểm `--chart-1` có ở cả sáng / tối trong `index.css`. Recharts lỗi với React 19 → gửi `worker_question`, không tự đổi thư viện.
5. `components/admin/dashboard/`: `dashboard-view.tsx`, `date-range-filter.tsx` (bản riêng, KHÔNG sửa `components/admin/recommend/online-tab.tsx`), `kpi-tiles.tsx`, `trend-card.tsx`, `active-plans-card.tsx`, `plan-revenue-card.tsx`, `premium-ratio-card.tsx`, `top-luts-card.tsx`, `format.ts`.
6. `routes/admin/index.tsx`: `useCanView()` đang chờ → `AdminLoading`; không có VIEW `DASHBOARD` → giữ **nguyên văn** trang chào hiện tại (h1 "Xin chào, {name}", "Chọn chức năng ở thanh bên để bắt đầu.", card "Tài khoản") và **không** gọi `dashboard/summary`; có VIEW → h1 "Xin chào, {name}" + dòng phụ §6.1 + bảng số liệu. Không bọc `AdminPermissionGuard`.
7. Không đổi thanh bên.
8. Backend lên (`curl http://localhost:9500/api/v3/api-docs` có `/dashboard/summary`) thì `pnpm api:types`, đối chiếu type tay.

## Ràng buộc
- Type / axios theo §5 (backend đang làm song song, không chờ api:types).
- Mọi chuỗi giao diện nguyên văn §6; định dạng số / tiền / phần trăm / ngày đúng đầu §6 (`formatVnd` có sẵn ở `lib/utils/money.ts`).
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/dashboard-admin.spec.ts` — đọc để biết selector, KHÔNG sửa. Các selector spec dùng:
  - 4 ô số: `Card` (data-slot="card") có `aria-label` = "Doanh thu" / "Đơn đã thanh toán" / "Khách mới" / "Lượt tải", chứa giá trị và dòng so sánh §6.3.
  - Mỗi card lớn bọc trong `<section aria-label="…">` đúng tiêu đề: "Diễn biến", "Gói đang dùng", "Doanh thu theo gói", "Lượt tải Premium", "Top 10 LUT tải nhiều".
  - Nút nhanh "7 ngày" / "30 ngày" / "90 ngày" / "12 tháng" có `aria-pressed="true"` khi đang chọn, `"false"` khi không (§6.2).
  - Ô ngày `getByLabel("Từ ngày")`, `getByLabel("Đến ngày")` (`input type="date"` có `Label htmlFor`).
  - "Diễn biến": `tablist` tên "Chỉ số" và "Gom theo" (Radix Tabs với `aria-label`); khung biểu đồ `role="img"` + `aria-label` "Biểu đồ {chỉ số} theo {ngày|tháng}"; nút "Xem bảng số liệu" / "Ẩn bảng số liệu"; bảng `aria-label="Bảng số liệu theo kỳ"` với các dòng kỳ + dòng "Tổng" cuối (ô đầu mỗi dòng là "Kỳ").
  - `ul[aria-label="Gói đang dùng"] > li` (3 mục), `ul[aria-label="Doanh thu theo gói"] > li` (2 mục).
  - Bảng `aria-label="Top LUT tải nhiều"`, `tbody tr` mỗi LUT, 5 cột `td` theo thứ tự "#", "LUT", "Tác giả", "Loại", "Lượt tải"; ô "Loại" Premium là `Badge` "Premium", LUT thường là chữ "Thường" (không thêm chữ khác vào ô); ô "#" và "Lượt tải" chỉ chứa số.
  - Lỗi tải: `AdminListError title="Không tải được số liệu"`, bộ lọc ngày vẫn hiện.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component shadcn: có sẵn `card`, `tabs`, `table`, `badge`, `button`, `input`, `label`, `collapsible`, `skeleton`, `tooltip`; của quản trị `AdminLoading`, `AdminListError`, `useCanView`. Cần `shadcn add chart`.
- Điện thoại 360 px trở lên không tràn ngang (§6.9): 4 ô số 2 cột, Tabs xuống dòng được, bảng cuộn ngang trong khung.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`. Có sẵn file bẩn từ trước (`frontend/.env.example`, `AGENTS.md`, `playwright.config.ts`, `vite.config.ts`, `components/shop/home/*`) — không đụng tới.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` có `/dashboard/summary`: `pnpm test:e2e tests/e2e/dashboard-admin.spec.ts --workers=1 --reporter=line` và dán kết quả; chạy thêm hồi quy `pnpm test:e2e tests/e2e/auth.spec.ts tests/e2e/tai-khoan-khach.spec.ts --reporter=line`.
4. Báo cáo có dòng "Skill: …" (component shadcn đã thêm, quy tắc UX đã áp).
