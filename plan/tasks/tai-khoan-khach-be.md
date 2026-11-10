# Task: tai-khoan-khach — backend (agy, thay Codex)

Plan: plan/tai-khoan-khach.md (đã duyệt 10/11/2026). Đọc §2, §4, §5, §7, §9 (TC loại unit TC-14 → TC-19).

Lát này backend do **agy** làm (Codex hết quota). Quy tắc backend giữ nguyên: `AGENTS.md`, `backend/AGENTS.md` (chỗ nào ghi "Codex" thì hiểu là bạn). Một worker agy khác làm frontend **song song trong cùng worktree**: cấm `git stash/reset/checkout/clean`, không đụng `frontend/**`.

## Target
- Package mới `vn.aeoc.business.account` (module `business`), sửa nhỏ ở `authenticate`, `base`, `entity`.
- Migration `V5__vai_tro_khach_hang.sql`, seed local `V5_1__seed_khach_hang.sql`. Không bảng mới → **không sinh lại jOOQ**.

## Việc cần làm (đúng §7, đường dẫn tính từ `backend/`)
1. `app/src/main/resources/db/migration/V5__vai_tro_khach_hang.sql`: chép nguyên khối SQL ở plan §4.
2. `app/src/main/resources/db/seed/V5_1__seed_khach_hang.sql`: tài khoản `free@downbeat.local` theo bảng §4 (`INSERT … SELECT … WHERE NOT EXISTS`, không ghi cứng `id`, `role_id` lấy bằng subquery theo tên "Khách hàng").
3. `base/.../constant/ErrorCode.java`: thêm `EMAIL_EXISTS(400, "Email đã được đăng ký")`. Không sửa / xoá mã cũ (`DUPLICATED_EMAIL` để nguyên). Kiểm tra `REGISTRATION_DISABLED` đang là 403 "Hệ thống không mở đăng ký", `WEAK_PASSWORD` là 400 "Mật khẩu phải có từ 8 đến 72 ký tự" (nếu lệch, báo `question`, đừng tự đổi).
4. `entity/.../data/mysql/auth/User.java`: thêm `private String plan;` và `private Timestamp planExpiresAt;` (không phải cột DB, cùng loại với `roleName`; comment "Gói khách hàng, chỉ trả ở /account/me").
5. `authenticate/.../repository/auth/RoleRepository.java`: `Role getDefaultCustomerRole()` → `getOne(ROLE.IS_DEFAULT.eq(1).and(ROLE.IS_OPERATOR.eq(0)))` (không có → `null`).
6. `authenticate/.../service/auth/RoleService.java`: `getDefaultCustomerRole()` gọi repository.
7. `authenticate/.../service/auth/UserService.java`: thêm `@Transactional TokenResponse register(User request)` làm **đúng 7 bước, đúng thứ tự** ở §5.1 (inject thêm `RoleService`):
   - lỗi dùng `new AppException(ErrorCode.BAD_REQUEST, "Vui lòng nhập họ tên")` / `"Email không hợp lệ"`, `PasswordPolicy.validate` (→ `WEAK_PASSWORD`, kể cả khi `plainPassword` null), `ErrorCode.REGISTRATION_DISABLED`, `ErrorCode.EMAIL_EXISTS`;
   - email: `trim().toLowerCase(Locale.ROOT)`; rỗng hoặc không có `@` → "Email không hợp lệ";
   - bước 5: `repository.getUserByEmail(email)` trước; rồi bọc `insert(...)` bắt `org.jooq.exception.DataAccessException` có nguyên nhân vi phạm UNIQUE (`IntegrityConstraintViolationException` / `DuplicateKeyException`) → `EMAIL_EXISTS`;
   - bước 6: tạo `new User()` (không dùng lại object client), chỉ set `name`, `email`, `password = BCrypt.hashpw(plain, BCrypt.gensalt())`, `hasPassword = 1`, `roleId`, `active = 1`, `firstTime = 1`; insert bằng `insert(...)` kế thừa `BaseService`;
   - bước 7: `issueTokens(user)` như đăng nhập (user phải có `id` sau insert).
8. `authenticate/.../config/security/filter/JwtAuthenticationFilter.java`: thêm `"/account/register"` vào `WHITE_LIST_POST_API` (token hỏng gửi kèm cũng bị bỏ qua — TC-10); xoá `"/user/create"` khỏi `WHITE_LIST_API`.
9. Xoá file `authenticate/.../controller/FileController.java` (giữ `FileStorageService`). Sau khi xoá, `POST /api/file/upload` phải trả 404 "Không tìm thấy API" cho cả token khách và token admin.
10. `business/.../account/service/AccountService.java` (`@Service` thường, không kế thừa `BaseService`):
    - `TokenResponse register(User request)` → `userService.register(request)`.
    - `User me(Integer userId)`: `userService.getUserById(userId)`; `id == null` → `AppException(ErrorCode.LOGIN)`; `active ≠ 1` → `AppException(ErrorCode.LOCK_ACCOUNT)`; trả `new User()` chỉ set `id`, `name`, `email`, `plan = "free"` (comment: lát `goi-thanh-toan` đọc subscription ACTIVE để điền `plan`, `planExpiresAt`).
11. `business/.../account/controller/AccountController.java` `extends BaseController`, không hằng `URI` / `checkPermission`:
    - `@PostMapping("/account/register")` body `@RequestBody User` → `Mapper.map(accountService.register(request), ApiResponse::okEntity)`.
    - `@GetMapping("/account/me")` lấy `SecurityUtils.userId(principal)` → `accountService.me(...)`.

## Ràng buộc
- Hợp đồng §5 cố định: path, field, kiểu, mã lỗi, message nguyên văn (bảng §5.5). Body đăng ký dùng `plainPassword`.
- `GET /account/me` trả **đúng 4 khoá** `id, name, email, plan` (không `roleId`, `active`, `regisDate`…; `planExpiresAt` không có khi null).
- Role mặc định tra theo cờ (`is_default = 1 AND is_operator = 0`), không theo tên. Email lưu chữ thường.
- Không sửa migration cũ (V1 → V4). Không thêm `resource` / `permission`.
- Không `@Idempotent`, không Kafka.

## Unit test bắt buộc (JUnit 5 + AssertJ + Mockito, `new` service với mock, không dựng Spring)
- `authenticate/src/test/java/vn/aeoc/authenticate/service/auth/UserServiceRegisterTest.java`: TC-14 → TC-18 (§9).
- `business/src/test/java/vn/aeoc/business/account/service/AccountServiceTest.java`: TC-19.
Tên method test bắt đầu bằng ID, ví dụ `tc14_registerSuccess`.

## Phạm vi được sửa
Chỉ `backend/**`. Không sửa `plan/**`, `frontend/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt, không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl authenticate,business -am test` xanh, có TC-14 → TC-19.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp `5` và `5.1`.
3. Test hợp đồng có sẵn (Claude viết, KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/tai-khoan-khach.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed`. Phải xanh 14/14.
