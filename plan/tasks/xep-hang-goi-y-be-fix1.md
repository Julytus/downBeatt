# Fix 1: xep-hang-goi-y — backend

Vòng trước: dispatch ctx_de6931db109d. Sửa đúng lỗi dưới, không làm thêm việc khác.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `backend/business/src/main/java/vn/aeoc/business/lut/service/LutAdminService.java:294-295` | Ngoài phạm vi plan: §7 không có mục nào đụng luật xuất bản của lát `quan-ly-lut` (LUT phải có ≥ 3 thẻ). Biến `isUnhide` nới luật cho LUT HIDDEN đã từng xuất bản. | `git diff` thêm `boolean isUnhide = "HIDDEN".equals(state.getStatus()) && state.getPublishedTime() != null;` và `tags.size() < 3 && !isUnhide`. Lý do gốc là spec TC-21 ẩn / xuất bản lại `bac-cuc` (seed chỉ 2 thẻ). Claude đã sửa spec: TC-21 nay dùng `mua-pho` (3 thẻ), 11/11 test API xanh mà không cần nới luật. | Trả hai dòng về như cũ: `if (tags == null \|\| tags.size() < 3) {`. Không đổi gì khác trong file. |

## Nghiệm thu
1. `git diff -- backend/business/src/main/java/vn/aeoc/business/lut/service/LutAdminService.java` rỗng.
2. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh (dán dòng tổng `Tests run`).
3. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng".
4. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/xep-hang-goi-y.spec.ts -g "TC-(1[5-9]|2[0-5])" --reporter=line` → 11 passed.
