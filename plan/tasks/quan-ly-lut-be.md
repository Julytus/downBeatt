# Task: quan-ly-lut — backend (agy)

Plan: plan/quan-ly-lut.md (đã duyệt 10/11/2026). Đọc §1, §3, §4, §5 (toàn bộ), §7, §9 (TC-01 → TC-08 loại unit; TC-09 → TC-23 loại api để biết request / response Claude sẽ kiểm).

## Target
Package `vn.aeoc.business.lut` (đã có từ lát `dac-trung-mau`: `CubeParser`, `LutColorFeatureService.computeAndSave`, `LutRepository.adminList`, resource `LUT` ở V6). **Không có migration.** Sửa thêm `base` (ErrorCode), `authenticate` (FileStorageService), `app` (application.yml), `entity` nếu POJO thiếu field.

## Việc cần làm (đúng §7)
1. `base/.../constant/ErrorCode.java`: thêm `PREVIEW_MISSING(400, "LUT chưa có đủ ảnh / video xem trước")`, `LUT_FILE_MISSING(400, "LUT chưa có file .cube đã đo đặc trưng màu")`, `LUT_FEATURE_MISSING(400, "LUT cần ít nhất 3 thẻ và 1 danh mục")`.
2. `app/src/main/resources/application.yml`: `spring.servlet.multipart.max-file-size: 50MB`, `max-request-size: 52MB` (bỏ tham chiếu `${upload.max-size}` ở dòng này; `upload.max-size` vẫn 10MB cho ảnh / .cube).
3. `authenticate/.../service/FileStorageService.java`: `putPublic(key, in, size, contentType)` → URL công khai (Cache-Control immutable như hiện có); `putPrivate(key, byte[], contentType)`; hàm kiểm dùng chung `requireExtension(file, allowed, message)`, `requireMaxSize(file, max)`, `verifySignature` thêm `mp4` (byte 4–7 = `ftyp`), `webm` (`1A 45 DF A3`). Hàm `upload(MultipartFile)` cũ: xoá nếu không còn tham chiếu.
4. `entity/.../lut/Creator.java`: kiểm đủ `id`, `name`, `slug`, `status`.
5. `business/.../lut/constant/LutUploadKind.java`: enum `CUBE`, `COVER`, `BEFORE`, `AFTER`, `VIDEO` (đuôi, cỡ tối đa, cột đích, tên hiển thị).
6. `business/.../lut/service/LutSlugGenerator.java`: `static toSlug(title)`, `static nextFree(base, Predicate<String> exists)` theo §5.3 mục 7.
7. `business/.../lut/repository/LutRepository.java`: các hàm liệt kê ở §7 mục 7 (`adminList(..., order)` dùng lại điều kiện `dac-trung-mau`, `getAdminById`, `existsBySlug`, `updateInfo` (6 cột), `updateFile`, `updateStatus`, `replaceTags`, `replaceCategories`, `getTags`, `getCategorySlugs` (xếp `sort_order`), đếm danh mục ngoài `phan-mem`, `getCategoryIdsBySlugs`, `listCreators`, `existsCreator`).
8. `business/.../lut/service/LutAdminService.java` `extends BaseService<LutRepository, Lut, Integer>`: `list`, `get` (gắn `tags`, `categories`, `colorFeature`), `upsert(User login, Lut req)`, `delete`, `upload(id, kind, file)`, `publish`, `hide`, `creators`. Một hàm `checkPublishable(...)` dùng cho cả `publish` và `update` LUT đang xuất bản. `@Transactional` cho phần ghi. Upload `CUBE`: đọc byte → `CubeParser.parse` (lỗi thì dừng trước MinIO) → `putPrivate` → `updateFile` → `computeAndSave` (trong một transaction).
9. `business/.../lut/controller/LutAdminController.java` `extends BaseController`, `URI = "/lut/"`, `checkPermission` là dòng đầu mỗi endpoint: `GET list`, `GET get`, `POST update` (ADD khi không có id, UPDATE khi có), `POST delete/{id}` (DELETE), `POST upload` (multipart `id`, `kind`, `file`; UPDATE), `POST publish/{id}`, `POST hide/{id}` (UPDATE), `GET creators` (VIEW).
10. Không xoá cache `lutCategoryCache` (lát này không sửa danh mục).

## Ràng buộc
- Hợp đồng §5 cố định: path, field, kiểu, mã lỗi, **message nguyên văn** §5.9 (kể cả dấu "xoá" / "Xóa", "(10MB)").
- Response chi tiết: `fileKey` không bao giờ ra JSON; chưa có .cube thì không có `fileSizeKb`, `lutSize`, `colorFeature`; chưa xuất bản thì không có `publishedTime`; `tags` A→Z, `categories` là slug xếp `sort_order`, rỗng thì `[]`.
- Item `list` chỉ có 11 khoá §5.1 (không `description`, `tags`, `categories`, `colorFeature`). `keyword` khớp `title` hoặc `slug` (spec dọn dữ liệu bằng `list?keyword=E2E LUT`). Thứ tự `updated_time` DESC, `id` DESC.
- `creators`: mọi tác giả kể cả `status = 0`, xếp `name` A→Z, mỗi phần tử đúng 4 khoá `id`, `name`, `slug`, `status`.
- Quyết định đã chốt (§7 cuối): slug không đổi khi sửa; xoá cứng chỉ Nháp / Đã ẩn có lượt tải 0; `published_time` chỉ đặt lần đầu; thứ tự `PREVIEW_MISSING` → `LUT_FILE_MISSING` → `LUT_FEATURE_MISSING`; nhóm `phan-mem` không tính; không xoá object cũ trên MinIO; khoá object có UUID (`lut/<id>/<uuid>.cube`, `lut/<id>/<cover|before|after|video>-<uuid>.<đuôi>`).
- Thứ tự kiểm upload: LUT tồn tại → `kind` hợp lệ → file không rỗng → đuôi → dung lượng → nội dung → MinIO → DB. Content-type do server quyết định.
- Không dùng `@Idempotent` / Kafka. Không đổi branch, không `git stash/reset/checkout/clean`.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Spec E2E `frontend/tests/e2e/quan-ly-lut.spec.ts` đã có sẵn (đọc được để biết Claude kiểm gì), không sửa.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có `LutSlugGeneratorTest` (TC-01) và `LutAdminServiceTest` (TC-02 → TC-08).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng".
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-ly-lut.spec.ts -g "API" --reporter=line --workers=1` → dán dòng `N passed / M failed` (mong đợi 15 passed). Test đỏ thì sửa code, không sửa spec; nếu thấy spec mâu thuẫn plan thì hỏi (question).
4. Sau đó chạy lại `pnpm test:e2e tests/e2e/dac-trung-mau.spec.ts -g "API" --reporter=line --workers=1` (E2E_SKIP_WEBSERVER=1) để chắc không phá lát trước.
