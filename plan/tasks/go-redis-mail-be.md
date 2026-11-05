# Task: go-redis-mail — backend (Codex)

Plan: plan/go-redis-mail.md (đã duyệt 2026-11-05). Đọc §1, §3, §4, §5, §7, §9 (TC loại unit: TC-20 → TC-29).

## Target
Module `authenticate` (+ `entity`, `base`, `app`). Migration mới `V2__refresh_token.sql`. Sau task, backend chạy được chỉ với MySQL + MinIO (không Redis, không Mailpit).

## Việc cần làm
Làm đúng 14 bước ở plan §7, theo thứ tự. Tóm tắt:

1. Migration `app/src/main/resources/db/migration/V2__refresh_token.sql`: bảng `refresh_token` đúng §4 (`CREATE TABLE IF NOT EXISTS`, unique `refresh_token_hash_uindex (token_hash)`, index `refresh_token_user_index (user_id)`, FK → `user_app.id` ON DELETE CASCADE).
2. `sh scripts/ai/backend-restart.sh` để Flyway áp V2, rồi build lại để jOOQ sinh `RefreshToken` / `RefreshTokenRecord`. Không sửa tay file sinh.
3. Entity POJO `entity/src/main/java/vn/aeoc/entity/data/mysql/auth/RefreshToken.java`.
4. `RefreshTokenRepository` (`extends AbsMysqlRepository`): `insert`, `findValidByHash`, `deleteById` (trả số dòng), `deleteByUserId`, `deleteExpiredByUserId`.
5. `RefreshTokenService`: bỏ `StringRedisTemplate`, dùng repository. Giữ chữ ký public `issue / consume / revoke / revokeAll`, cách sinh token (32 byte, Base64 URL không padding) + SHA-256. Theo §4: so hạn và ghi `expires_at` bằng giờ DB; `issue` xoá dòng hết hạn của user; rotation chỉ hợp lệ khi `deleteById` trả **1**. `consume(null | blank)` → `REFRESH_TOKEN_INVALID` mà không gọi DB.
6. `LoginAttemptService`: Caffeine (`@Bean("loginAttemptCache")` trong `AuthCacheConfig`, `maximumSize(100_000)`), identifier `trim().toLowerCase(Locale.ROOT)`, cửa sổ tính từ lần sai đầu tiên (`Expiry`: create = lockDuration, update = currentDuration), `count >= login-max-failures` → `LOGIN_TOO_MANY_ATTEMPTS`. `Ticker` truyền được để test.
7. Xoá OTP + mail: `OtpService`, `constant/EmailContent`, `UserService.forgotPassword / resetPassword / sendEmail` + `JavaMailSender`; 2 endpoint ở `AuthController`; gỡ khỏi `WHITE_LIST_POST_API` (+ javadoc); field `otp`, `newPassword` trong `User`; `OTP_INVALID`, `OTP_TOO_MANY_ATTEMPTS` trong `ErrorCode`; field `otp*` trong `AuthGuardProperties` (sửa javadoc bỏ chữ Redis).
8. Xoá `ThreeLayerCacheTemplate`, `CacheInfraConfig`, `CacheTemplateProperties`, bean `cacheLoaderExecutor` trong `AsyncExecutor`. Giữ `CacheKeyFactory`, `AuthCacheConfig`, `dbExecutor`.
9. **404 cho đường dẫn không tồn tại — bắt buộc**: hiện tại `POST /api/auth/forgot-password` trả **500** (`INTERNAL_ERROR`). Sau khi xoá endpoint, có token phải ra **404** "Không tìm thấy API" (handler `NoResourceFoundException` / `NoHandlerFoundException` trong `GlobalExceptionHandler`). Không token vẫn 401 "Chưa đăng nhập".
10. pom: `authenticate/pom.xml` bỏ `spring-boot-starter-data-redis`, `commons-pool2`, `spring-boot-starter-mail`; `pom.xml` gốc bỏ `spring-boot-starter-mail` trong `dependencyManagement`; comment `business/pom.xml` "web/jOOQ/redis" → "web/jOOQ". Giữ `caffeine`.
11. Cấu hình `application.yml`, `application-local.yml`, `application-dev.yml` như §7.11.
12. `backend/.env.example` và `backend/.env`: bỏ đúng các dòng `REDIS_*`, `MAILPIT_*`, `MAIL_*` (+ tiêu đề mục), không đụng dòng khác.
13. Test: xoá `support/FakeRedis.java`, `OtpServiceTest.java`; viết lại `RefreshTokenServiceTest` (mock `RefreshTokenRepository`, TC-20 → TC-25) và `LoginAttemptServiceTest` (Caffeine thật + `Ticker` giả, TC-26 → TC-29). Tên method test có ID TC.
14. Kiểm tra cuối (xem Nghiệm thu).

## Ràng buộc
- Hợp đồng §5 cố định: `/user/authenticate`, `/auth/refresh`, `/auth/logout` giữ nguyên request / response; message nguyên văn bảng §5.5.
- Unique `token_hash`. Xoá cứng. Không lưu token gốc.
- Không sửa migration cũ (`V1__auth_schema.sql`, `V1_1`).
- Không dùng scheduler, Kafka, `@Idempotent`.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do agy làm song song trong cùng worktree. Không sửa `docker-compose*.yml`, `.env.example` gốc, tài liệu (Claude làm). Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl authenticate -am test` xanh, có test TC-20 → TC-29.
2. `grep -rniE "redis|mailsender|spring\.mail|otp" backend --include=*.java --include=*.yml --include=*.xml` (bỏ `target/`, `generated/`) không còn kết quả (ngoài comment hợp lệ — liệt kê nếu có).
3. `docker stop downBeat-redis downBeat-mailpit`, rồi `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V2. **Để nguyên 2 container ở trạng thái dừng.**
4. Spec nghiệm thu đã có sẵn (KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/go-redis-mail.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed`.
5. TC-15: đăng nhập lấy refreshToken, restart backend, `POST /api/auth/refresh` → 200 (dán status).
