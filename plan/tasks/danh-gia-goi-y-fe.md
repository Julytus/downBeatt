# Task: danh-gia-goi-y — frontend (agy)

Plan: plan/danh-gia-goi-y.md (đã duyệt 2026-11-12). Đọc §1, §2, §3 (luồng chính 2, 3, A1, A2, A4, E2, E4, E5), §5.1 → §5.3, §6, §8.

## Target
Thẻ **"Đánh giá"** (`tab=danh-gia`) của trang `/admin/goi-y` có sẵn (lát `quan-tri-goi-y`). Domain `recommend-admin`, resource code `RECOMMEND` (VIEW). Không đổi 3 thẻ còn lại.

## Việc cần làm
Làm đúng 8 mục ở plan §8:
1. `lib/types/recommend.ts`: `EvalMetricSetDTO`, `RecEvalRunDTO`, `EvalListParams`.
2. `lib/axios/recommend-admin.ts`: `listEvalRuns(params)`, `getEvalRun(id)`.
3. `lib/tanstack/options/recommend-admin.ts`: `createEvalRunsQueryOptions(params)` (`keepPreviousData`), `createEvalRunQueryOptions(id)` (không thử lại khi 404). Không toast.
4. `components/admin/recommend/labels.ts`: `EVAL_ALGORITHM_LABELS`, `EVAL_METRICS` (thứ tự, tiêu đề cột theo K, số chữ số, tooltip §6.3), hàm định dạng `vi-VN` + chênh lệch có dấu.
5. `components/admin/recommend/eval-runs-table.tsx`: thanh công cụ §6.2 + bảng §6.3 + phân trang.
6. `components/admin/recommend/eval-compare-card.tsx`: §6.4.
7. `components/admin/recommend/eval-tab.tsx`: viết lại, ghép 5 + 6; rỗng / lỗi §6.3 (lỗi dùng `TabLoadError` có sẵn).
8. `routes/admin/goi-y.tsx`: search schema thêm `algo`, `k`, `page`, `a`, `b` (§6.1, Zod `.catch`), đổi bằng `navigate({ replace: true })`.
9. Khi backend đã có `/recommend/eval/list` trong `http://localhost:9500/api/v3/api-docs`: `pnpm api:types`, đối chiếu type tay.

## Ràng buộc
- Type / axios theo §5 (backend làm song song, không chờ `api:types` mới code).
- Mọi chuỗi giao diện nguyên văn §6. Số `vi-VN`: precision/recall/ndcg/hitRate/ild/coverage 4 chữ số (`0,1520`), styles/novelty 2 chữ số (`5,98`); thời điểm `dd/MM/yyyy HH:mm`.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/danh-gia-goi-y.spec.ts`. Đọc để biết selector, KHÔNG sửa. Những điểm spec dựa vào:
  - Card "Các lần chạy" và "So sánh hai lần chạy" là `Card` shadcn (`data-slot="card"`), tiêu đề là text nguyên văn. Mọi bảng dùng `Table` shadcn; trong `tbody` **mọi ô là `TableCell` (`td`)**, kể cả ô checkbox và cột đầu; `thead` dùng `TableHead` (role `columnheader`). Spec lấy ô theo **chỉ số cột** = vị trí `columnheader` trong `thead`, nên số `td` mỗi hàng phải đúng bằng số `th` (cột checkbox là cột đầu, sau đó đúng thứ tự §6.3).
  - Tiêu đề cột chỉ số đúng nguyên văn `P@10`, `R@10`, `NDCG@10`, `HitRate@10`, `ILD@10`, `Phong cách / 10`, `Coverage@10`, `Novelty@10` (đổi theo K). Tooltip: `TooltipTrigger` bọc **chính chữ tiêu đề cột** (spec rê chuột lên chữ `NDCG@10` trong `columnheader`), nội dung tooltip nguyên văn §6.3 (role `tooltip`). Text của `columnheader` chỉ là tiêu đề, không chèn thêm chữ khác (icon `aria-hidden` thì được).
  - `Select` có `aria-label` "Thuật toán" / "Số gợi ý" (role `combobox`, text hiện tại "Tất cả thuật toán" / "K = 10"); lựa chọn là `SelectItem` (role `option`) đúng nhãn §6.2.
  - Checkbox shadcn mỗi dòng `aria-label="Chọn lần chạy #{id}"`; đã tích 2 thì các checkbox khác `disabled`. Chữ "Đã chọn {n}/2" là một phần tử text riêng. Nút "So sánh" (tên truy cập đúng "So sánh") disabled khi n ≠ 2; bấm → URL `a=<id tích trước>&b=<id tích sau>`. Mở link có `a`, `b` → hai dòng đó được tích sẵn.
  - Đổi K **không** gọi lại `eval/list` (tách K ra khỏi query key). Lọc thuật toán gửi `algorithm=<mã>&page=1&limit=20`; lần mở thẻ đầu gửi đúng **1** request `page=1&limit=20` (không gửi `algorithm` khi rỗng).
  - "Trang {page}/{số trang}" là một text riêng (ví dụ `Trang 1/3`).
  - Thẻ so sánh: hai nhãn là text riêng nguyên văn `A: #{id} {nhãn} · lô {batchCode} · hạt giống {seed}`. Bảng "Chỉ số" có `thead` đúng 5 cột "Chỉ số", "A", "B", "Chênh lệch (B − A)" (dấu trừ U+2212 như plan), "Thay đổi"; `tbody` đúng 9 hàng, `td` đầu là tên dòng §6.4. Ô chênh lệch: dương có class `text-emerald-600`, âm `text-destructive` (trên chính `td` hoặc phần tử con). Bảng "Tham số" có `thead` "Tham số", "A", "B"; `td` đầu là tên khoá phẳng (`weights.tag`) bọc trong một phần tử riêng (`<span>`), Badge "khác" đặt **trong `td` đầu** (sau tên khoá, phần tử riêng) hoặc cột riêng cuối, **không** đặt trong ô A / B. Không có dòng `elapsedMs`.
  - 404 của một id → text riêng `Không tìm thấy lần chạy đánh giá #{id}` trong card so sánh, không render bảng.
  - Rỗng: `Empty` với tiêu đề "Chưa có lần chạy đánh giá nào" + mô tả mới §6.3 (thay mô tả cũ); có lọc: "Không có lần chạy nào khớp bộ lọc."; lỗi: `TabLoadError` ("Không tải được dữ liệu" + nút "Thử lại").
  - Bảng nằm trong khung `overflow-x-auto` riêng; ở 390 px trang không tràn ngang.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Có sẵn trong `components/ui/`: `table`, `checkbox`, `select`, `tooltip`, `card`, `badge`, `button`, `skeleton`, `empty` — không cần `shadcn add`. Icon lucide: `GitCompare`, `X`, `FlaskConical`. Đang tải: `Skeleton` 5 dòng (bảng), `Skeleton` cho thẻ so sánh.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend, không chạy lệnh đánh giá. Cấm `git stash/reset/checkout/clean`. Worktree có sẵn thay đổi chưa commit của người dùng (`frontend/.env.example`, `frontend/AGENTS.md`, `frontend/playwright.config.ts`, `frontend/vite.config.ts`, `frontend/src/components/shop/home/*`): giữ nguyên.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `GET /api/recommend/eval/list` (token admin) đã trả `total` ≥ 10 (backend đã chạy lệnh đánh giá hai lần): `pnpm test:e2e tests/e2e/danh-gia-goi-y.spec.ts --workers=1 --reporter=line` và `pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts --workers=1 --reporter=line` (hồi quy), dán kết quả. Chưa có thì ghi rõ "chưa chạy E2E vì backend chưa có dữ liệu đánh giá".
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
