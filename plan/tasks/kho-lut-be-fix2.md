# Fix 2: kho-lut — backend

Vòng trước: dispatch `ctx_7053138bf9db` (fix1, succeeded). Sửa đúng các lỗi dưới, không làm thêm việc khác. Chỉ sửa `backend/**`.

| # | Vị trí | Vi phạm (quy tắc / mục plan) | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `business/.../lut/service/LutService.java` `suggest(...)` | plan §5.4: `result` là mảng **đối tượng LUT** như §5 (có `categories`, `tags`); `list`/`get`/`related` đều ghép, riêng `suggest` trả thẳng kết quả repository không ghép | `GET /api/lut/public/suggest?q=kodak&limit=1` → item không có `categories`, `tags`. Spec (đã bổ sung) `pnpm test:e2e tests/e2e/kho-lut.spec.ts -g "TC-17"` → 1 failed (Received thiếu `categories`, `tags`) | Ghép thẻ / danh mục theo lô như `list` (dùng lại `enrich` hoặc tách hàm ghép dùng chung); `suggest?q=kodak` trả `categories: ["phim-nhua","premiere-pro","davinci-resolve","final-cut-pro","capcut"]`, `tags: ["grain","phim"]` |
| 2 | `business/.../lut/repository/LutCategoryRepository.java` `getActive()` | plan §5.5: xếp `sort_order` ASC, **`id` ASC** | `orderBy(c.SORT_ORDER.asc())` thiếu `id` | `orderBy(c.SORT_ORDER.asc(), c.ID.asc())` |
| 3 | Mọi file mới trong `business/.../lut/**` (controller, repository, service, config) | `backend/AGENTS.md` (khung `ProductController` mẫu): mã viết dồn một dòng, thiếu khoảng trắng (`int p=page==null\|\|page<1?1:page;`, constructor một dòng, nhiều câu lệnh trên một dòng, tên đầy đủ `vn.aeoc.entity.data.mysql.lut.Lut` lặp lại) — khó đọc, khó đưa vào báo cáo | `LutService.java`, `LutRepository.java`, `LutCategoryRepository.java`, 2 controller | Định dạng lại theo khung mẫu `backend/AGENTS.md`: mỗi câu lệnh một dòng, khoảng trắng quanh toán tử / sau dấu phẩy, constructor nhiều dòng, import (dùng alias / import entity thay cho tên đầy đủ khi không trùng tên với bảng jOOQ — trùng thì giữ tên đầy đủ cho một bên). **Chỉ đổi định dạng, không đổi logic** |

## Nghiệm thu
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng".
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/kho-lut.spec.ts -g "API" --reporter=line` → dán dòng `N passed` (mục tiêu 25/25, gồm TC-17 đã bổ sung). Không sửa spec.
4. Dán response `suggest?q=kodak&limit=1` rút gọn (chỉ `title`, `categories`, `tags`).
