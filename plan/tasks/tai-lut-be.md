# Task: tai-lut — backend (agy)

Plan: plan/tai-lut.md (đã duyệt 10/11/2026). Đọc §1, §2, §3, §4, §5, §7, §9 (TC loại unit: TC-01 → TC-09).

## Target
Package mới `vn.aeoc.business.download` (`controller`, `service`, `repository`) trong module `business`; sửa thêm `base` (ErrorCode), `entity` (POJO `DownloadLog` sinh từ jOOQ), `authenticate` (`FileStorageService`), `business.lut` (`LutRepository`). Migration `V8__tai_lut.sql` (V7 là mới nhất).

## Việc cần làm (theo plan §7)
1. `backend/app/src/main/resources/db/migration/V8__tai_lut.sql`: bảng `download_log` đúng §4 (cột, FK `user_app(id)` + `lut(id)`, index `idx_download_log_user (user_id, created_time)`, `idx_download_log_lut (lut_id, created_time)`, không UNIQUE). Chạy jOOQ codegen để có `DownloadLog` / `DownloadLogRecord`.
2. `ErrorCode`: `PLAN_REQUIRED(403, "LUT Premium cần gói Pro hoặc Studio")`, `LUT_FILE_UNAVAILABLE(503, "File LUT đang không sẵn sàng, vui lòng thử lại sau")`.
3. POJO `DownloadLog`: thêm field không thuộc bảng `fileName`, `url`. Response `result` **chỉ có** `fileName`, `url` (không `id`, `userId`, `lutId`, `planCode`, `ip`, `createdTime`, không `fileKey` / khoá zip).
4. `FileStorageService`: `existsPrivate(String key)` (`statObject`; `ErrorResponseException` mã `NoSuchKey` → false, lỗi khác ném), `presignPrivateGet(String key, Duration ttl, String downloadName, String contentType)` (§5.3: `Method.GET`, `extraQueryParams` `response-content-disposition` = `attachment; filename="{downloadName}"`, `response-content-type` = contentType). Dùng lại `readPrivate`, `putPrivate`. Lỗi MinIO ở hàm mới → `AppException(ErrorCode.LUT_FILE_UNAVAILABLE)`; không đổi hành vi hàm cũ.
5. `LutRepository`: `getPublishedById(Integer id)` (cột `id, title, is_premium, file_key, slug`, `status = 'PUBLISHED'`; id null → null), `increaseDownloadCount(Integer id)` = **một** câu `UPDATE lut SET download_count = download_count + 1 WHERE id = ?`.
6. `download/repository/DownloadLogRepository extends AbsMysqlRepository<DownloadLogRecord, DownloadLog, Integer>`: dùng `insert` có sẵn.
7. `download/service/LutPackage` (lớp tiện ích thuần, không Spring): `baseName(String title, Integer id)`, `fileName(String base)` = `{base}-LUT-DownBeat.zip`, `zipKey(String fileKey, String fileName)` = `zip/{fileKey bỏ .cube}/{fileName}`, `zip(String base, byte[] cube)` → `byte[]` — đúng **một** entry `{base}-LUT/Assets/{base}.cube`, không entry thư mục, DEFLATED, byte giữ nguyên. Luật tên gốc §5.2 (đ/Đ → d/D, `StringUtils.stripAccents`, chuỗi ngoài `[A-Za-z0-9]` → `-`, bỏ `-` hai đầu, **giữ hoa thường**, cắt 60 rồi bỏ `-` cuối, rỗng → `LUT-{id}`).
8. `download/service/LutDownloadService extends BaseService<DownloadLogRepository, DownloadLog, Integer>`: `download(Integer userId, Integer lutId, String ip, LocalDate today)` theo **đúng thứ tự** §5.1: (1) 404 `DATA_NOT_FOUND` "Không tìm thấy LUT" → (2) LUT ★: `SubscriptionRepository.findActiveByUserId(userId, today)` + `PlanRepository`, không có hoặc `can_download_premium != 1` → `PLAN_REQUIRED`; `planCode` ghi log = `plan.code` của subscription còn hạn, không có thì `"free"` (cả LUT thường) → (3) `file_key` null → `LUT_FILE_UNAVAILABLE` → (4) `existsPrivate(zipKey)`; false thì `readPrivate(file_key)` → `LutPackage.zip` → `putPrivate(zipKey, bytes, "application/zip")`; rồi `presignPrivateGet(zipKey, ttl, fileName, "application/zip")`; mọi lỗi MinIO → `LUT_FILE_UNAVAILABLE` + log ERROR có `lutId` và khoá object → (5) **sau** MinIO, trong một transaction (`TransactionTemplate`, không `@Transactional` gọi nội bộ cùng bean): `insert download_log (user_id, lut_id, plan_code, ip)` + `increaseDownloadCount` → (6) trả `{ fileName, url }`.
9. `download/controller/LutDownloadController extends BaseController`: `@PostMapping("/lut/download")`, body `DownloadLog` (chỉ đọc `lutId`), `SecurityUtils.userId(principal)`, IP = phần tử đầu của `X-Forwarded-For` (trim), không có thì `request.getRemoteAddr()`, cắt 45 ký tự; `LocalDate.now()`. Không gọi `checkPermission`.
10. `application.yml`: `lut.download.url-ttl: 5m` (đọc thành `Duration`).

## Ràng buộc
- Hợp đồng §5 cố định: path, field, mã lỗi, message nguyên văn §5.4.
- Không tự đổi: cấu trúc zip §5.2 (một entry, không thêm file); khoá zip **suy ra** từ `file_key` + `fileName`, **không** thêm cột; MinIO trước, DB sau; tăng lượt tải bằng một câu UPDATE; không giới hạn, không chống lặp; **không** thêm `/lut/download` vào whitelist của `JwtAuthenticationFilter`; không trả `fileKey` / khoá zip trong JSON.
- Không sửa migration cũ. Không resource / permission mới.
- Không dùng `@Idempotent`, Kafka. Cấm `git stash/reset/checkout/clean` (worktree dùng chung).

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Spec `frontend/tests/e2e/tai-lut.spec.ts` là hợp đồng nghiệm thu — đọc, không sửa.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, `N passed / M failed` — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có các test unit TC-01 → TC-09 (§9): `LutPackageTest` (TC-01 → TC-03), `LutDownloadServiceTest` (TC-04 → TC-09, mock `FileStorageService`, `SubscriptionRepository`, `PlanRepository`, repository). Ghi tên test ↔ TC trong báo cáo.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V8.
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/tai-lut.spec.ts -g "API" --reporter=line --workers=1` → dán dòng `N passed / M failed` (mong đợi 10 passed, TC-10 → TC-19; TC-17 gọi payOS thật bằng khoá trong `backend/.env`). Test đỏ thì sửa code, không sửa spec; nếu thấy spec mâu thuẫn plan thì hỏi (question).
4. Chạy lại `E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/quan-ly-lut.spec.ts -g "API" --reporter=line --workers=1` để chắc sửa `LutRepository` / `FileStorageService` không phá lát trước.
