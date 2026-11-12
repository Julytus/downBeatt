# Task: kiem-dinh-goi-y — frontend (agy)

Plan: plan/kiem-dinh-goi-y.md (đã duyệt 2026-11-12). Đọc §2, §3 (luồng chính 2, 3, luồng thay thế, ngoại lệ), §5.1 → §5.4, §6, §8.

## Target
Route `/admin/goi-y` — thêm thẻ thứ năm **"Tổng hợp"** (`tab=tong-hop`) ngay sau "Đánh giá". Domain `recommend`, resource `RECOMMEND` (VIEW). Bốn thẻ cũ không đổi.

## Việc cần làm (trích §8 — đọc nguyên văn §6 và §8 trong plan)
1. `src/lib/types/recommend.ts`: `EvalBatchDTO`, `EvalBatchListParams`, `EvalMetricStatDTO { mean: number; std?: number }`, `EvalAlgorithmSummaryDTO`, `EvalScenarioSummaryDTO`, `EvalTestDTO` (`relChange?: number`), `EvalSummaryDTO` (`newLutDays?: number`), `EvalReportDTO` — đúng §5.1 → §5.3.
2. `src/lib/axios/recommend-admin.ts`: `listEvalBatches(params)`, `getEvalSummary(batch)`, `getEvalReport(batch)`.
3. `src/lib/tanstack/options/recommend-admin.ts`: `createEvalBatchesQueryOptions(params)` (key `[…, "eval", "batches", page, limit]`), `createEvalSummaryQueryOptions(batch)` (key `[…, "eval", "summary", batch]`, `enabled: !!batch`, không retry khi 404), `createEvalReportQueryOptions(batch)` (dùng với `queryClient.fetchQuery` khi bấm nút).
4. `src/components/admin/recommend/labels.ts`: `EVAL_BASELINE_ALGORITHMS`, `EVAL_ABLATION_ALGORITHMS`, `EVAL_COLD_ALGORITHMS`, `EVAL_CONCLUSION_LABELS`, `formatPValue`, `formatMeanStd`, `formatSignedPercent`.
5. `src/components/admin/recommend/summary-tab.tsx`: thanh công cụ §6.2, chọn lô mặc định (lô đầu tiên có `hasTests`, không có thì lô đầu tiên; **không** tự thêm `batch` vào URL), sao chép / tải Markdown (Blob `text/markdown;charset=utf-8`, tên file lấy từ `fileName`, nội dung đúng nguyên `markdown`), các trạng thái §6.4.
6. `src/components/admin/recommend/summary-cards.tsx`: 5 card §6.3 (tách mỗi card một component cũng được).
7. `src/routes/admin/goi-y.tsx`: thêm `tong-hop` vào enum `tab`, thêm `batch: z.string().optional().catch(undefined)`, `TabsTrigger` "Tổng hợp" sau "Đánh giá", `TabsContent` truyền `batch`, `k`, `onBatchChange`, `onKChange` (`navigate({ replace: true })`, giữ các tham số khác).
8. `src/lib/api.gen.ts`: chạy `pnpm api:types` khi `curl http://localhost:9500/api/v3/api-docs` đã có `/recommend/eval/batches`; chưa có thì ghi rõ trong worker_done.

## Ràng buộc
- Type/axios theo §5 (backend đang làm song song — không chờ `api:types`).
- **Mọi chuỗi giao diện nguyên văn §6** (tiêu đề card, mô tả, tiêu đề cột, tooltip, nhãn Select, toast, trạng thái rỗng / lỗi). Định dạng số đúng §6.3: `formatMetricValue` (vi-VN) cho số đo; "0,0640 ± 0,0031"; `formatSignedDiff`; p "< 0,001" hoặc 3 chữ số; `pairCount`, `holmFamilySize`, `bootstrap` in số nguyên thô (không dấu phân cách hàng nghìn).
- Select dùng `aria-label` "Lô đánh giá" và "Số gợi ý" (role `combobox`); mục Select của lô: `{batchCode} · {seeds.length} hạt giống` + ` · có kiểm định` khi `hasTests`. Mục K: "K = 5", "K = 10", "K = 20".
- Đổi K chỉ đổi cách hiển thị, **không gọi lại** `eval/summary`. Card "Kiểm định thống kê" luôn NDCG@10.
- 5 card là các `Card` shadcn **ngang hàng** (không lồng trong một `Card` bao ngoài, thanh công cụ không phải `Card` có `CardTitle`); tiêu đề dùng `CardTitle`, mô tả dùng `CardDescription` (mỗi mô tả là một phần tử text liền). Mỗi bảng nằm trong khung cuộn ngang riêng. Badge kết luận là `Badge` shadcn.
- Lỗi mạng / 5xx dùng `TabLoadError` có sẵn. 404 của `summary` hiện `Empty` "Không tìm thấy lô đánh giá" + nút "Xem lô mới nhất" (bỏ `batch` khỏi URL), thanh công cụ vẫn hiện.
- Ở 390 px: Select và nút xuống dòng, `w-full`; trang không tràn ngang.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/kiem-dinh-goi-y.spec.ts` — đọc để biết selector và chuỗi mong đợi, **KHÔNG sửa** (cả các spec khác trong `tests/e2e/**`).
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component có sẵn: `select`, `card`, `table`, `badge`, `button`, `tooltip`, `skeleton`, `empty`, `sonner` — không cần `shadcn add`. Icon `Copy`, `Download` (lucide).
- Cấm `git stash/reset/checkout/clean` (worktree dùng chung với worker backend).

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend, không chạy lệnh eval.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl http://localhost:9500/api/v3/api-docs` có `/recommend/eval/batches` **và** `eval/batches` đã có lô 5 hạt giống (backend chạy xong lô O): `pnpm test:e2e tests/e2e/kiem-dinh-goi-y.spec.ts --reporter=line` và dán kết quả. Chưa có thì ghi rõ "chưa chạy E2E vì backend chưa xong".
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
