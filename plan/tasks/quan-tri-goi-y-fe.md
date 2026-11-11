# Task: quan-tri-goi-y — frontend (agy)

Plan: plan/quan-tri-goi-y.md (đã duyệt 2026-11-11). Đọc §1, §2, §3 (luồng chính 1 → 4, A1 → A6, E1 → E5), §5 (§5.1 → §5.6), §6, §8.

## Target
Trang quản trị `/admin/goi-y` (`routes/admin/goi-y.tsx`), 4 thẻ "Cấu hình", "Đánh giá", "Trực tuyến", "Thử hồ sơ" + nút "Tính lại chỉ mục". Domain `recommend-admin`, resource code `RECOMMEND` (VIEW để xem, UPDATE để thấy nút "Tính lại chỉ mục").

## Việc cần làm
Làm đúng 8 mục ở plan §8:
1. Type `lib/types/recommend.ts`: `RecommendConfigDTO`, `IndexStatusDTO`, `RebuildResultDTO`, `RecommendStatsDTO` (`StatsRowDTO`, `PositionStatDTO`), `CustomerOptionDTO`, `TryProfileResultDTO`, `BlockKey`.
2. Axios `lib/axios/recommend-admin.ts` (mới): 5 hàm §8 mục 2.
3. Options `lib/tanstack/options/recommend-admin.ts` (mới): 3 query + 2 mutation đúng §8 mục 3 (khoá query, `staleTime`, `meta`, `invalidatesQuery`).
4. Route `routes/admin/goi-y.tsx`: `validateSearch` cho `tab` (giá trị lạ → `cau-hinh`, đổi thẻ dùng `replace`), `AdminPermissionGuard code="RECOMMEND"`, đầu trang §6.1, nút "Tính lại chỉ mục" chỉ khi `can("RECOMMEND", "UPDATE")`.
5. `components/admin/recommend/` (mới): `rebuild-index-dialog.tsx`, `config-tab.tsx`, `eval-tab.tsx`, `online-tab.tsx` (+ `stat-tile.tsx`, `position-bars.tsx`), `try-profile-tab.tsx` (+ `customer-combobox.tsx`, `profile-card.tsx`, `try-items-table.tsx`), `labels.ts` (nhãn + helper định dạng `vi-VN`).
6. `components/admin/sidebar/admin-sidebar.tsx`: mục `{ code: "RECOMMEND", title: "Gợi ý", url: "/admin/goi-y", icon: Sparkles }` ngay sau "Đặc trưng màu".
7. `lib/lut-feature/feature-rows.ts`: dùng lại nhãn; thêm export nhãn "Đen trắng" cho `isMono` nếu cần, không đổi nhãn cũ. Dùng lại `components/admin/lut/feature-bar.tsx` cho "Màu nổi bật".
8. `pnpm api:types` khi backend đã lên (`/recommend/config` có trong `http://localhost:9500/api/v3/api-docs`); đối chiếu type tay.

## Ràng buộc
- Type / axios theo §5 (backend làm song song, không chờ `api:types` mới code).
- Mọi chuỗi giao diện nguyên văn §6; số / phần trăm / thời điểm định dạng `vi-VN` đúng §6 (đầu §6). Mỗi thẻ chỉ gọi API của nó khi được mở lần đầu.
- **Điểm chỉnh so với plan §6.1 / §6.5 / §6.6**: `AdminLoadError` có sẵn là màn hình lỗi toàn trang (chữ "Không kết nối được máy chủ"), không dùng được trong một thẻ. Tạo component lỗi gọn trong thẻ (ví dụ `components/admin/recommend/tab-load-error.tsx`, dùng `Empty` hoặc `Alert`) với chữ nguyên văn **"Không tải được dữ liệu"** và nút **"Thử lại"** (gọi `refetch`). Không sửa `admin-load-error.tsx`.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/quan-tri-goi-y.spec.ts`. Đọc để biết selector, KHÔNG sửa. Những điểm spec dựa vào:
  - `h1` "Gợi ý"; `Tabs` shadcn (role `tab`, `aria-selected`); thẻ đang chọn phản ánh trên URL `?tab=`.
  - 4 card ở thẻ "Cấu hình" và card "Theo biến thể" là `Card` shadcn (`data-slot="card"`), tiêu đề card là text nguyên văn. Mọi bảng dùng `Table` shadcn; trong `tbody` **mọi ô là `TableCell` (`td`)**, không dùng `th` cho cột đầu, vì spec đọc `td` theo chỉ số (cột nhãn = `td` đầu, giá trị = `td` cuối). Dòng đầu bảng (`thead`) có đúng tên cột §6.
  - Thẻ "Chỉ mục": nhãn và giá trị liền nhau (`dl`/`dt`/`dd` hoặc tương tự), spec khớp `Số LUT trong chỉ mục\s*36`, `Lý do\s*quản trị`, `Thời gian dựng\s*412 ms`. "Dựng lúc" dạng `dd/MM/yyyy HH:mm:ss`.
  - Hộp thoại xác nhận là `AlertDialog` (role `alertdialog`, tên = tiêu đề §6.2), nút "Tính lại" / "Huỷ". Toast thành công đúng mẫu `Đã tính lại chỉ mục ({lutCount} LUT, {elapsedMs} ms)` (toast trong `onSuccess` của component vì chuỗi có biến; không `toast` lỗi tay, lỗi đi qua `meta.errorMessage`). Sau thành công phải làm mới query `config` (spec đếm thêm request `GET /recommend/config`). `featureFailed` khác rỗng → `Alert` (role `alert`) có tiêu đề + từng dòng `{title}: {error}` + nút "Đóng".
  - Thẻ "Trực tuyến": 4 ô số là phần tử có `aria-label` đúng "Lượt hiển thị", "CTR", "Tỉ lệ tải", "Tỉ lệ bỏ qua" (chứa cả số lớn và dòng phụ); `ul[aria-label="CTR theo vị trí"]` mỗi `li` chứa "Vị trí {k}" và "{ctr%} ({clicks}/{impressions})"; nút "7 ngày" / "30 ngày" / "90 ngày"; ô ngày `input type="date"` có label "Từ ngày" / "Đến ngày"; ngày sai thì hiện lỗi và **không** gọi API. Mặc định request `stats?from=<hôm nay − 29>&to=<hôm nay>` (ngày theo giờ trình duyệt). Dưới `lg` 4 ô xếp 2 cột (2 hàng × 2).
  - Thẻ "Thử hồ sơ": `RadioGroup` có tên "Loại khách" (role `radiogroup`, radio "Tài khoản" / "Mã ẩn danh"). Combobox: nút kích hoạt `Button role="combobox"` có `id` gắn với `<Label htmlFor>` "Khách hàng" (tên truy cập = "Khách hàng"), ô tìm placeholder "Tìm theo email hoặc tên…", mỗi lựa chọn là `CommandItem` (role `option`) tên "{name} · {email}". Chọn → gửi `try-profile` body đúng `{ userId }` (không kèm khoá khác), đúng 1 request.
  - Card hồ sơ là `section aria-label="Hồ sơ"`; nhãn và giá trị liền nhau (spec khớp `Giới hạn LUT Premium\s*Tối đa 4 LUT`, `Phong cách nổi bật\s*Ấm áp`); nút `Collapsible` "Tín hiệu ({n})", bảng tín hiệu nằm trong section này.
  - Bảng gợi ý `aria-label="Gợi ý thử"`, đúng 10 cột theo thứ tự §6.6 ("#" là `td` đầu, "Điểm" là `td` thứ 3, "Thẻ" thứ 4, "Câu giải thích" là `td` cuối); số dạng `0,7172`; POPULAR hiện "—". Tiêu đề LUT là link `/luts/{slug}` (`target="_blank"`). Bảng nằm trong khung `overflow-x-auto` riêng; ở 390 px trang không tràn ngang.
  - "Mã ẩn danh": lỗi 400 / 404 hiện chữ đỏ dưới ô (message server nguyên văn), **không toast** (mutation `tryProfile` không có `meta.errorMessage`, hoặc tắt toast theo quy ước `frontend/AGENTS.md`).
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Có sẵn trong `components/ui/`: `tabs`, `card`, `table`, `badge`, `button`, `input`, `label`, `radio-group`, `popover`, `command`, `alert`, `alert-dialog`, `collapsible`, `skeleton`, `sonner`. **Cần `shadcn add empty`** (chưa có `components/ui/empty.tsx`). Icon lucide: `Sparkles`, `RefreshCw`, `FlaskConical`, `Loader2`. Thanh ngang (trọng số, CTR theo vị trí) là `div` tự vẽ, không dùng thư viện biểu đồ, `aria-hidden`.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend. Cấm `git stash/reset/checkout/clean`. Worktree có sẵn thay đổi chưa commit của người dùng (`frontend/.env.example`, `frontend/AGENTS.md`, `frontend/playwright.config.ts`, `frontend/vite.config.ts`, `frontend/src/components/shop/home/*`): giữ nguyên.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` đã có `/recommend/config`: `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts --workers=1 --reporter=line` và dán kết quả; chạy thêm `dac-trung-mau.spec.ts`, `phan-quyen.spec.ts` (hồi quy thanh bên). Backend chưa xong thì ghi rõ "chưa chạy E2E vì backend chưa có endpoint".
4. Báo cáo có dòng "Skill: …" (component shadcn đã thêm, quy tắc UX đã áp).
