# Fix 1: kiem-dinh-goi-y — frontend

Vòng trước: dispatch ctx_00c5f77d86e2. Sửa đúng lỗi dưới, không làm thêm việc khác. Chỉ sửa `frontend/src/**`, không đụng `frontend/tests/e2e/**`.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `frontend/src/components/admin/recommend/summary-cards.tsx:249` | plan §6.3 card 3: "Thay đổi so với M" = `formatSignedPercentChange(mean M, mean biến thể)`; chỉ M = 0 (hoặc thiếu dữ liệu) mới in "—" (§5.3) | điều kiện `isM \|\| !mNdcgStat?.mean \|\| !ndcgStat?.mean` coi `mean` = 0 của **biến thể** là thiếu dữ liệu → in "—" | Chỉ in "—" khi dòng là M, hoặc `mNdcgStat`/`ndcgStat` là `undefined`; còn lại gọi `formatSignedPercentChange(mNdcgStat.mean, ndcgStat.mean)` (hàm này tự trả "—" khi M = 0). Ví dụ M = 0,0640, biến thể = 0 → "-100,0%". |

## Nghiệm thu
1. `cd frontend && pnpm build && pnpm lint` xanh (0 lỗi).
2. Dán đoạn code sau khi sửa vào báo cáo `worker_done`.
