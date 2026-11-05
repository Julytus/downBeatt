# Fix 1: go-redis-mail — backend

Vòng trước: dispatch `ctx_0496d370fb35` (báo `failed` vì `backend-restart.sh` treo). Claude đã tự kiểm lại: restart **chạy được** (backend lên 4s, Redis/Mailpit đã dừng), nhóm API E2E 11/11 pass, TC-15 pass, `mvn test` xanh. Không cần làm lại phần đó.

Chỉ còn lỗi mã hoá tiếng Việt và vài điểm nhỏ dưới đây. Sửa đúng các dòng này, không làm thêm việc khác.

| # | Vị trí | Vi phạm | Bằng chứng | Mong đợi |
|---|---|---|---|---|
| 1 | `backend/app/src/main/resources/application.yml:77` | Comment tiếng Việt bị hỏng mã hoá (ký tự có dấu thành `?`) | `# Ch?ng d? m?t kh?u theo t?i kho?n (Caffeine).` | `# Chống dò mật khẩu theo tài khoản (Caffeine, trong bộ nhớ; restart là mất bộ đếm). Giới hạn theo IP do nginx đảm nhận.` |
| 2 | `backend/authenticate/src/main/java/vn/aeoc/authenticate/service/auth/UserService.java:93` | Như #1 | `/** C?p c?p access token (JWT ng?n h?n) + refresh token l?u MySQL (d?i h?n). */` | `/** Cấp cặp access token (JWT ngắn hạn) + refresh token lưu MySQL (dài hạn). */` |
| 3 | `backend/authenticate/src/main/java/vn/aeoc/authenticate/config/property/AuthGuardProperties.java` (2 javadoc của `loginMaxFailures`, `loginLockDuration`) | UTF-8 bị mã hoá kép | `Sá»‘ láº§n Ä‘Äƒng nháº­p sai…`, `Thá»i gian khoÃ¡ táº¡m…` | Giữ nguyên văn bản gốc: `Số lần đăng nhập sai liên tiếp cho 1 tài khoản trước khi khoá tạm.` và `Thời gian khoá tạm đăng nhập (tính từ lần sai đầu tiên trong chuỗi).` |
| 4 | `AuthGuardProperties.java` javadoc lớp | Plan §7.7 "sửa javadoc bỏ chữ Redis", không phải thay bằng tiếng Anh; mất dòng nginx | `/** Login abuse guard settings. */` | `/**\n * Chống dò mật khẩu theo tài khoản (bộ đếm Caffeine trong bộ nhớ, mỗi instance đếm riêng).\n * Giới hạn theo IP do nginx đảm nhận (deploy/nginx/default.conf, zone auth_limit).\n */` |
| 5 | `LoginAttemptService` constructor `@Autowired` | Tự tạo `Ticker.systemTicker()` thay vì dùng bean `loginAttemptTicker` mà cache đang dùng → hai nơi đọc hai đồng hồ khác nhau nếu sau này đổi bean | `this(cache, properties, Ticker.systemTicker());` | Inject bean `Ticker` (một constructor duy nhất `(Cache, AuthGuardProperties, Ticker)`, test vẫn truyền ticker giả). Bỏ `remainingNanos` nếu không nơi nào dùng. |

**Cách sửa an toàn với mã hoá:** dùng công cụ sửa file của bạn, ghi UTF-8 (không BOM). Không dùng PowerShell `Set-Content` / `Out-File` / `>` (đây là nguyên nhân thường gặp làm hỏng dấu). Sửa xong kiểm tra bằng lệnh ở Nghiệm thu.

## Phạm vi được sửa
Chỉ 4 file: `application.yml`, `UserService.java`, `AuthGuardProperties.java`, `LoginAttemptService.java` (+ `AuthCacheConfig.java` / `LoginAttemptServiceTest.java` nếu #5 cần).

## Nghiệm thu (dán dòng tóm tắt)
1. `grep -rnE "Ã|á»|Ä‘|Æ°|Ch\?ng|C\?p c\?p" backend --include=*.java --include=*.yml | grep -vE "/target/|/generated/"` → rỗng.
2. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl authenticate -am test` → exit 0.
3. `sh scripts/ai/backend-restart.sh 2>&1 | tail -3` → "backend sẵn sàng". (Script trả về ngay sau khi backend lên; nếu shell của bạn vẫn treo thì bỏ qua, Claude sẽ tự restart.)
