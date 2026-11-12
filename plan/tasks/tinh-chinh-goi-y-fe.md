# Task: tinh-chinh-goi-y — frontend (agy)

Plan: plan/tinh-chinh-goi-y.md (đã duyệt 2026-11-12). Đọc §1, §3 (luồng chính 2, 3, A4, A5, E4), §5.1 → §5.3 (phần dữ liệu trả về), §6, §8.

## Target
Chỉ thẻ **"Đánh giá"** (`tab=danh-gia`) của `/admin/goi-y` (đã có từ lát `danh-gia-goi-y`). Domain `recommend-admin`, resource code `RECOMMEND` (VIEW). Không đổi 3 thẻ còn lại. Mọi chuỗi / hành vi của phần 1 không nhắc ở §6 thì giữ nguyên.

## Việc cần làm
Làm đúng 9 mục ở plan §8:
1. `lib/types/recommend.ts`: `EvalMetricSetDTO.newLutHit?`, `newLutRecall?`; `RecEvalRunDTO.scenario`; `EvalListParams.scenario?`.
2. `lib/axios/recommend-admin.ts`: `listEvalRuns` gửi `scenario` khi có.
3. `lib/tanstack/options/recommend-admin.ts`: query key thêm `scenario` (sau `algorithm`).
4. `components/admin/recommend/labels.ts`: 12 mã + 7 nhãn mới §6.2; `EVAL_SCENARIO_OPTIONS` (6 mục §6.2), `evalScenarioLabel(code)` (§6.3); `EVAL_METRICS` thêm 2 mục `optional: true` (§6.3).
5. `eval-runs-table.tsx`: `Select` "Kịch bản" (trước "Thuật toán", `w-[220px]`), "Thuật toán" `w-[260px]`, `w-full` ở màn hẹp; dòng chữ phụ khi `cold-user-{n}`; cột "Kịch bản" sau "Thuật toán"; `Badge` secondary "tinh chỉnh" khi `params.tuned === true`; 2 cột cuối "LUT mới@{K}", "R LUT mới@{K}" (+ tooltip); thiếu trường → "—"; trạng thái rỗng §6.3.
6. `eval-compare-card.tsx`: nhãn A / B §6.4 (chỉ chèn nhãn kịch bản khi khác `standard`), 2 dòng chỉ số mới, thiếu trường → "—" ở ô, "Chênh lệch", "Thay đổi"; bảng "Tham số" làm phẳng cả `tuning.*`, bỏ `elapsedMs` ở mọi cấp, boolean hiện "true" / "false".
7. `eval-tab.tsx`: nhận `scen`, gửi `scenario` (trừ `all`), `onScenarioChange`.
8. `routes/admin/goi-y.tsx`: search `scen` (§6.1, Zod `.catch("standard")`, mặc định `standard`); đổi `scen` → `page = 1`, giữ `algo`, `k`, `a`, `b`, `navigate({ replace: true })`.
9. `lib/api.gen.ts`: `pnpm api:types` khi `curl -s http://localhost:9500/api/v3/api-docs | grep -c scenario` > 0; chưa có thì ghi trong `worker_done`.

## Ràng buộc
- Type / axios theo §5 (backend làm song song, không chờ `api:types` mới code).
- Mọi chuỗi giao diện nguyên văn §6 (nhãn Select, tên cột, tooltip, badge, dòng chữ phụ, nhãn A / B, trạng thái rỗng). Số `vi-VN` 4 chữ số cho 2 chỉ số mới.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/tinh-chinh-goi-y.spec.ts` (và hồi quy `danh-gia-goi-y.spec.ts`). Đọc để biết selector, KHÔNG sửa. Những điểm spec dựa vào:
  - Select "Kịch bản" là `combobox` có accessible name đúng "Kịch bản"; nội dung trigger đúng nhãn mục đang chọn ("Đánh giá chính", "Người mới · 3 sự kiện"…); mục chọn là `option` đúng nguyên văn.
  - Bảng "Các lần chạy": số `td` mỗi hàng bằng số `th`, ô lấy theo chỉ số cột (như phần 1). Text `columnheader` chỉ là tiêu đề ("Kịch bản", "LUT mới@10", "R LUT mới@10"); tooltip bọc chính chữ tiêu đề.
  - Ô "Thuật toán": text = nhãn, rồi (nếu tuned) `Badge` chứa đúng chữ "tinh chỉnh" — không thêm chữ nào khác trong ô.
  - Bảng "Chỉ số" của thẻ so sánh: ô đầu là tên dòng; 2 dòng mới ở cuối. Bảng "Tham số": ô đầu là tên khoá phẳng (`tuned`, `tuning.validNdcgFinal`, `excludeSeen`), cột 2 = A, cột 3 = B, chữ "khác" khi khác nhau; giá trị thiếu hiện "—".
  - Ở 390 px không tràn ngang; hai `Select` nằm trọn trong màn hình; bảng cuộn ngang trong khung riêng.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component dùng: có sẵn `select`, `badge`, `tooltip`, `table`, `checkbox`, `card`, `button`, `skeleton`, `empty`; không cần `shadcn add`.
- Không dùng `git stash/reset/checkout/clean` (worktree dùng chung với worker backend).

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend, không chạy lệnh eval.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Nếu `curl -s http://localhost:9500/api/v3/api-docs | grep -c scenario` > 0 và `eval/list?algorithm=m-mac-dinh&scenario=standard` đã có ≥ 2 dòng: `pnpm test:e2e tests/e2e/tinh-chinh-goi-y.spec.ts --reporter=line` và dán dòng tổng kết. Chưa có dữ liệu thì ghi rõ "chưa chạy E2E: backend chưa có lô".
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
