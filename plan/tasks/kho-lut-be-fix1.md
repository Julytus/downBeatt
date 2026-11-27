# Fix 1: kho-lut — backend (làm tiếp phần còn dở)

Vòng trước: dispatch `ctx_d16ffc1e98f5`, outcome `failed`. Task gốc vẫn là `plan/tasks/kho-lut-be.md`; file này chỉ liệt kê phần **chưa xong** và lỗi đang chặn. Đọc lại task gốc + plan `plan/kho-lut.md` §4, §5, §7, §9 trước khi làm.

## Trạng thái hiện tại (Claude kiểm tra 2026-11-06)

| # | Hiện trạng | Bằng chứng | Mong đợi |
|---|---|---|---|
| 1 | Backend :9500 không chạy | `curl :9500/api/v3/api-docs` → `000`; `backend/target/backend-run.err.log`: `FlywayValidateException: Validate failed: Migrations have failed validation` | `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V3 + V3_1 thành công |
| 2 | `flyway_schema_history` có dòng `3.1 seed kho lut success=0` | `select … from flyway_schema_history` (container `downBeat-mysql`) | Sửa lỗi quote URL trong `build.py` → sinh lại `V3_1__seed_kho_lut.sql`; xoá dòng thất bại (`flyway repair`, hoặc `DELETE FROM flyway_schema_history WHERE version='3.1' AND success=0` trên DB local); kiểm tra không còn dữ liệu nửa chừng của V3_1 trong `creator`/`lut`/`lut_category_map`/`lut_tag` (nếu còn thì xoá trước khi chạy lại). **Không** sửa `V3__kho_lut.sql` đã áp thành công (checksum) — nếu bắt buộc phải sửa V3 thì hỏi Claude trước |
| 3 | Seed chưa đủ: map danh mục và hai LUT bẫy (theo §7 / task gốc bước 1) | báo cáo worker_done vòng trước | `luts.json` + V3_1 có đủ 36 LUT, map danh mục, hai LUT bẫy đúng plan |
| 4 | Task gốc bước 4: chưa `mvn -q -DskipTests package` sinh jOOQ cho bảng mới sau khi Flyway thành công | — | jOOQ sinh `Creator`, `Lut`, `LutCategory`, `LutCategoryMap`, `LutTag` (không sửa tay file sinh) |
| 5 | Task gốc bước 7 (Repository) chưa làm | `find backend/business/src -path '*lut*'` chỉ có `constant/*` và `service/LutQuerySupport.java` | Đúng bước 7 task gốc |
| 6 | Task gốc bước 8 (Service + cache) chưa làm | như trên | Đúng bước 8 task gốc |
| 7 | Task gốc bước 9 (Controller) chưa làm | như trên | Đúng bước 9 task gốc |

Đã xong, giữ nguyên (chỉ sửa nếu có lỗi): `V3__kho_lut.sql`, `application.yml`, `FileStorageService`, `JwtAuthenticationFilter` (+ test), entity `Creator`/`Lut`/`LutCategory`/`LutTag`, `constant/*`, `LutQuerySupport` (+ test), `LutJsonTest`, `tools/seed/kho-lut/*`; ảnh + .cube đã lên MinIO (chạy lại `build.py` phải bỏ qua object đã có).

## Ràng buộc
Như task gốc. Hợp đồng §5 cố định. Chỉ sửa `backend/**`, `tools/seed/**` (và DB local cho việc repair Flyway). Cấm `git stash/reset/checkout/clean`. Frontend đã xong, không đụng `frontend/**`.

Gặp chặn thật (không tự gỡ được) thì gửi `question` / `escalation` mô tả cụ thể lỗi + đã thử gì, đừng kết thúc `failed` khi việc còn dở.

## Nghiệm thu
Đúng mục "Nghiệm thu" 1 → 5 của `plan/tasks/kho-lut-be.md` (mục tiêu API 23/23), + chứng minh từng dòng ở bảng trên đã hết (dán dòng tóm tắt: Flyway history 3.1 `success=1`, `Tests run`, `N passed / M failed`).
