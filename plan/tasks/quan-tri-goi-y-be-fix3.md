# Fix 3: quan-tri-goi-y — backend

Plan §5.5 vừa được bổ sung (người dùng duyệt 2026-11-11): `categoryNames` phải có tên cho cả `style` của **mọi phần tử `items`**, vì cột LUT ở thẻ "Thử hồ sơ" (§6.6) hiện tên phong cách của từng gợi ý.

## Lỗi

- Chỗ: `business/.../recommend/service/RecommendService.java` khoảng dòng 257–284 (khối dựng `categoryNames`, chỉ gom slug từ `preference`, `topStyles`, `topCategories`).
- Bằng chứng: admin `POST /recommend/try-profile { "anonId": "00000000-0000-4000-8000-000000000001" }` → `categoryNames = {}` trong khi `items[*].style` gồm `am-ap, den-trang, teal-orange, du-lich, dien-anh, phim-nhua, co-dien, lanh` (đều có tên trong `lut_category`). Spec đã thêm kiểm tra ở TC-15 và TC-16 (ca POPULAR), hiện đỏ: `Error: tên phong cách am-ap (POPULAR)`.
- Mong đợi: thêm `item.getStyle()` của mọi item vào tập slug cần tên (kể cả khi `summaryProfile` null / strategy POPULAR). Giữ nguyên quy tắc "slug không có tên thì không có trong map". Thêm assertion tương ứng vào unit test `tryProfile` hiện có trong `RecommendServiceTest`.

## Phạm vi được sửa
Chỉ `RecommendService.java` và `RecommendServiceTest.java`. Cấm `git stash/reset/checkout/clean`. Không chạy `java -jar` foreground; `curl` trong PowerShell dùng `curl.exe -m 10`.

## Nghiệm thu
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh (dán tổng `Tests run` từ `business/target/surefire-reports`).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng".
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-tri-goi-y.spec.ts -g "API" --workers=1 --reporter=line 2>&1 | tail -5` → 10 passed; và `tests/e2e/xep-hang-goi-y.spec.ts` cùng cách (hồi quy `for-you`). Dán hai dòng `N passed`.
