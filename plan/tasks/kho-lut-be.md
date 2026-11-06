# Task: kho-lut — backend (Codex)

Plan: plan/kho-lut.md (đã duyệt 2026-11-05). Đọc §1, §2, §4, §5, §7, §9 (TC loại unit: TC-40 → TC-50; TC-24, TC-25 kiểm tay).

## Target
Module `business` (package `vn.aeoc.business.lut`, đang trống) + entity `vn.aeoc.entity.data.mysql.lut` + sửa nhỏ ở `authenticate` (`JwtAuthenticationFilter`) và `FileStorageService` / `application.yml`. Migration mới `V3__kho_lut.sql`; seed local `db/seed/V3_1__seed_kho_lut.sql` **do công cụ sinh**. Công cụ dữ liệu mẫu mới `tools/seed/kho-lut/`.

## Việc cần làm
Làm đúng 9 bước ở plan §7, theo thứ tự, tuân theo quyết định D1–D6 (không tự đổi). Tóm tắt:

1. `tools/seed/kho-lut/` (Python 3.12 + Pillow + numpy + minio): `requirements.txt`, `README.md`, `.gitignore` (`out/`, `.cache/`), `luts.json`, `build.py` (+ `--self-test`).
   - `luts.json` chép từ dữ liệu giả. **Đọc bằng `git show HEAD:frontend/src/lib/mock/data/luts.ts`** (agy sẽ xoá file này trong cùng đợt; đừng đọc bản trên đĩa). Danh mục mỗi LUT tính theo `match` của `CATEGORY_DEFS`. Thêm 2 LUT bẫy (id 37 DRAFT, 38 HIDDEN 99999 lượt) và danh mục ẩn `tet` (map LUT 9) đúng bảng §4.
   - `build.py` 6 bước §7.1: ảnh gốc picsum → .cube 33³ (theo W3C Filter Effects, filter rỗng = identity) → `after.jpg` / `before.jpg` 1280×720, `cover.jpg` 960×540 có chữ (font OFL tải về `.cache/fonts/`) → video MDN cho LUT 2, 14, 23, 27 → đẩy MinIO (`downbeat-public` công khai, `downbeat-lut` riêng tư; Content-Type + Cache-Control; bỏ qua object cùng kích thước) → ghi `V3_1__seed_kho_lut.sql` (deterministic, `INSERT IGNORE`).
   - Khoá MinIO đọc từ biến môi trường, không có thì đọc `backend/.env`. **Không sửa `.env`.**
2. `V3__kho_lut.sql`: 5 bảng đúng §4 (collation `utf8mb4_0900_as_ci` cho 4 cột tìm kiếm; khoá / index đúng §4; không FULLTEXT) + 16 danh mục (`INSERT … SELECT … WHERE NOT EXISTS`, không ghi cứng id; name / description chép nguyên văn `CATEGORY_DEFS`).
3. `application.yml` (D5: `minio.bucket` mặc định `downbeat-public`, thêm `minio.private-bucket: ${MINIO_PRIVATE_BUCKET:downbeat-lut}`); `FileStorageService.ensureBucket` tạo cả 2 bucket (private không gắn policy); `JwtAuthenticationFilter.isWhiteListed` thêm regex `^/[a-z0-9-]+/public/.*` (D6) — không mở gì khác.
4. Chạy `python tools/seed/kho-lut/build.py` → `sh scripts/ai/backend-restart.sh` (Flyway V3, V3_1) → `mvn -q -DskipTests package` (jOOQ sinh bảng mới; không sửa tay file sinh).
5. Entity `Creator`, `Lut` (`creatorName`, `categories`, `tags`; `fileKey` `@JsonProperty(access = WRITE_ONLY)`; `@JsonInclude(NON_NULL)`), `LutCategory`, `LutTag`.
6. `constant/LutStatus`, `LutPreviewType`, `LutSort` (lạ → `RELEVANCE`).
7. Repository: `LutRepository` (search + count dùng chung một `Condition`; `getPublishedBySlug`; related + count), `LutTagRepository.getByLutIds`, `LutCategoryRepository` (`getActive`, `getActiveBySlug`, `getActiveSlugsByLutIds`). Điểm liên quan bằng `DSL.when(...)`; chỉ vào ORDER BY khi `relevance` có từ khoá. Truy vấn công khai không chọn `file_key`.
8. Service `LutService` (`list`, `get`, `related`, `suggest`; chuẩn hoá từ khoá D2 kèm escape `\ % _`; kẹp page / limit; ghép thẻ / danh mục theo lô D3), `LutCategoryService` (`listPublic` qua cache Caffeine `lutCategoryCache` 10 phút trong `vn.aeoc.business.lut.config.LutCacheConfig`, `getPublic`).
9. Controller `LutPublicController` (`/lut/public/list|get|related|suggest`), `LutCategoryPublicController` (`/lut-category/public/list|get`). Tất cả GET, không `checkPermission`.

Unit test bắt buộc: TC-40 → TC-50 (tên method có ID TC) + bộ tối thiểu "Thêm 1 CRUD" phần áp dụng được.

## Ràng buộc
- Hợp đồng §5 cố định: path, tham số (mảng lặp lại tên), field (đúng danh sách, null không xuất hiện), kiểu (`isPremium` số 0/1, `publishedTime` ISO không múi giờ), thứ tự sắp xếp, mã lỗi + message nguyên văn §5.7 ("Không tìm thấy LUT", "Không tìm thấy danh mục").
- Dữ liệu mẫu phải khớp đúng các con số ở §9 (TC-01 → TC-19): spec nghiệm thu kiểm tổng số, thứ tự, tiêu đề. Nếu dữ liệu sinh ra không khớp một con số trong plan thì **hỏi** (question), đừng tự đổi số hay đổi thuật toán.
- Không sửa migration cũ (V1, V1_1, V2). Không có bảng `branch` / `bsn_id`. Không `@Idempotent`.
- `fileKey` không bao giờ ra JSON công khai.

## Phạm vi được sửa
Chỉ `backend/**` và `tools/seed/**`. Frontend do agy làm song song trong cùng worktree. Không sửa `docker-compose*.yml`, `backend/.env`, tài liệu, `frontend/**`. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, `N passed / M failed` — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có TC-40 → TC-50 (TC-50 nằm ở module `authenticate` thì chạy thêm `-pl authenticate -am`).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V3 và V3_1.
3. `python tools/seed/kho-lut/build.py --self-test` in `OK`. Chạy `build.py` lần hai: log báo bỏ qua object đã có, `git status --short backend/app/src/main/resources/db/seed/` không thấy `V3_1__seed_kho_lut.sql` đổi so với lần một (TC-25).
4. Spec nghiệm thu đã có sẵn (KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/kho-lut.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed` (mục tiêu 23/23).
5. TC-24: dán dòng `LUT_3D_SIZE`, số dòng dữ liệu của `kodak-400.cube` (35937) và `file_size_kb` trong DB của LUT 10.
