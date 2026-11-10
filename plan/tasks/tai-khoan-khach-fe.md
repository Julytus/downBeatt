# Task: tai-khoan-khach — frontend (agy)

Plan: plan/tai-khoan-khach.md (đã duyệt 10/11/2026). Đọc §2, §3, §5, §6, §8, §11 câu 1 và 6.

Một worker agy khác làm backend **song song trong cùng worktree**: cấm `git stash/reset/checkout/clean`, không đụng `backend/**`, không restart backend.

## Target
Khu cửa hàng (`/`, `/luts/**`, `/pricing`): hộp thoại đăng nhập / đăng ký, menu tài khoản, đăng xuất chạy trên API thật (`/account/register`, `/user/authenticate`, `/account/me`, `/auth/logout`) thay cho `lib/mock/account.ts`. Không thêm route. Domain `account`.

Nguyên tắc: **một phiên đăng nhập cho cả trình duyệt**. Token nằm ở `useAuthStore` (`auth-storage`, như trang quản trị, `remember: true`); `useShopSession` chỉ giữ `user` của cửa hàng trong bộ nhớ (từ `/account/me`), **không lưu localStorage nữa**. Component đang đọc `useShopSession((s) => s.user)` giữ nguyên cách đọc.

## Việc cần làm (đúng §8, đường dẫn tính từ `frontend/src/`)
1. `lib/types/account.ts`: `ShopUserDTO.id` đổi `string` → `number`; thêm `AccountMeApiDTO` = `{ id: number; name: string; email: string; plan: PlanCode; planExpiresAt?: string | null }`. Giữ `ShopLoginRequest`, `ShopRegisterRequest` (form vẫn dùng `password`).
2. `lib/axios/account.ts` (mới), mỗi hàm một endpoint, trả `res.data.result`, không try/catch:
   - `register({ name, email, password })` → `POST /account/register` body `{ name, email, plainPassword: password }` → `LoginResponseDTO`.
   - `loginShop({ email, password })` → `POST /user/authenticate` body `{ email, plainPassword: password }` → `LoginResponseDTO`.
   - `getAccountMe()` → `GET /account/me` → `ShopUserDTO` (`planExpiresAt: dto.planExpiresAt ?? null`).
3. `lib/axios/instance.ts` — `endSession()`: xoá token (`useAuthStore.clear()`) và phiên cửa hàng (`useShopSession.getState().logout()`); **chỉ** chuyển `/login` khi `window.location.pathname` bắt đầu bằng `/admin`. Trang cửa hàng ở nguyên chỗ.
4. `lib/stores/shop-session.ts`: bỏ `persist`; state `{ user, loading, setUser, setLoading, logout }`. Khi module nạp, xoá khoá cũ `downbeat-shop-session` trong localStorage (bọc try/catch). Giữ `canDownloadPremium`.
5. `lib/stores/shop-dialog.ts`: dialog `login` thêm `email?: string` (điền sẵn).
6. `lib/mock/account.ts`: xoá `login`, `register`, `logout`, `SEED_USERS`, `readDb`, `writeDb`, `DB_KEY` (và khoá `downbeat-mock-users`). Còn lại `getPlans`, `requestLutDownload`, `ApiError`, `delay`; `checkout` đổi chữ ký thành `checkout(user: ShopUserDTO, req)` trả `{ ...user, plan, planExpiresAt }` (không đọc / ghi localStorage). Sửa comment đầu file: phần còn giả là gói, thanh toán, tải file.
7. `lib/tanstack/options/account.ts`:
   - `loginMutationOptions` / `registerMutationOptions`: `mutationFn` = gọi API → `useAuthStore.getState().set({ accessToken: token, refreshToken, userId, remember: true })` → `getAccountMe()` → `useShopSession.setUser(user)` → trả `user`. Giữ `meta` (toast thành công, `silentError: true`).
   - `accountMeQueryOptions`: key `["account-me"]`, `queryFn` = có token thì `getAccountMe()`, không thì `null`; `retry: false`, `staleTime: 0`.
   - `logoutMutationOptions`: lấy `refreshToken` → `void logoutRemote(refreshToken)` (có sẵn ở `lib/axios/auth.ts`, không chờ) → `useAuthStore.clear()` → `useShopSession.logout()` → `queryClient.removeQueries({ queryKey: ["account-me"] })`. `meta.successMessage` "Đã đăng xuất".
   - `checkoutMutationOptions`: `mutationFn: ({ user, ...req }) => checkout(user, req)`.
8. `components/shop/account/shop-session-sync.tsx` (mới), gắn vào `components/shop/layout/shop-shell.tsx`: theo dõi `accessToken`; có token mà chưa có `user` → `setLoading(true)`, chạy `accountMeQueryOptions`, xong thì `setUser` / lỗi thì `user = null`, rồi `setLoading(false)`; token về `null` (đăng xuất ở `/admin`, hết phiên) → `logout()`. **Lần nạp đầu có token thì `loading` phải là `true` ngay từ render đầu** (không được nháy nút "Đăng nhập" trước — TC-21).
9. `components/shop/layout/header/header-actions.tsx`: `loading` → khung chờ tròn cỡ ảnh đại diện, `role="status"`, `aria-label="Đang tải tài khoản"` (dùng `components/ui/skeleton.tsx`); trong lúc này **không** hiện "Đăng ký" / "Đăng nhập". Đăng xuất dùng `logoutMutationOptions` mới, ở nguyên trang hiện tại.
10. `components/shop/account/login-form.tsx`: lỗi hiện `ErrorResponseWarper(mutation.error)` (`lib/types/common.ts`) thay `mutation.error.message`; prop `defaultEmail?: string` điền sẵn ô Email và khi có thì focus ô "Mật khẩu"; dòng gợi ý dev: "Tài khoản thử: **free@downbeat.local**, mật khẩu **Admin@123**".
11. `components/shop/account/register-form.tsx`: lỗi như mục 10; thêm rule "Mật khẩu tối đa 72 ký tự"; khi `errorCode === "EMAIL_EXISTS"` hiện nút "Đăng nhập bằng email này" **bên trong khung `role="alert"`**, gọi prop mới `onSwitchToLogin(email)`.
12. `components/shop/account/shop-dialogs.tsx`: truyền `email` từ dialog vào `LoginForm`; `onSwitchToLogin(email?)` mở `{ type: "login", lut, plan, email }` (giữ LUT / gói đang chờ).
13. `components/shop/account/checkout-panel.tsx`: `mutation.mutate({ user, plan, cycle })`; chú thích dưới nút: "Bản demo: thanh toán giả lập, chưa nối payOS, không trừ tiền thật. Gói chỉ giữ đến khi tải lại trang."
14. Rà `hooks/use-lut-download.ts`, `lut-grid.tsx`, `lut-detail.tsx`, `use-plan-select.ts`, `story-cta.tsx`: chỉ sửa nếu `pnpm build` báo lỗi kiểu (`id` thành số). Luồng "chưa đăng nhập bấm tải → hộp thoại đăng ký → tải tiếp" và "chọn gói → đăng ký → hộp thoại mua gói" giữ nguyên.

Không sửa: `routes/_auth/login.tsx`, trang `/admin/**`, `tests/e2e/**`.

## Ràng buộc
- Type / axios theo §5 (backend đang làm song song — không chờ `api:types`). Body đăng nhập / đăng ký dùng `plainPassword`.
- Mọi chuỗi giao diện **nguyên văn §6** (tiêu đề hộp thoại, label, message validate, toast, nút). Lỗi server hiện **đúng message backend** trong `role="alert"` ngay trên nút gửi; không bật toast lỗi.
- Header cửa hàng vẫn nằm trong `<header>` (landmark banner): test chọn nút "Đăng ký" / "Đăng nhập" trong banner. Nút menu tài khoản có tên đọc "Tài khoản {tên}".
- Menu tài khoản: tên, email, "Gói **{tên gói}**" (Miễn phí / Pro / Studio), dòng "Hết hạn {dd/mm/yyyy}" chỉ khi có `planExpiresAt`, mục "Nâng cấp lên Pro" (chỉ gói Miễn phí) → `/pricing`, mục "Đăng xuất". Header gói Miễn phí có link "Nâng cấp" thay "Bảng giá".
- `frontend/src` không còn import `login` / `register` / `logout` từ `lib/mock/account`; không còn khoá `downbeat-mock-users`, `downbeat-shop-session` (trừ chỗ xoá khoá cũ ở mục 4).
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/tai-khoan-khach.spec.ts` (TC-20 → TC-29) — đọc để biết selector, **KHÔNG sửa**. Spec cũ `shop-flows`, `shop-ui`, `trang-chu` đã được Claude chỉnh theo tài khoản thật.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Component dùng, có sẵn trong `components/ui/`: `dialog`, `dropdown-menu`, `skeleton`, `sonner`, `button`, `alert` (nếu có). Không cần `shadcn add`.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed`)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. Khi `curl http://localhost:9500/api/v3/api-docs` đã có `/account/register` (backend xong): `pnpm test:e2e tests/e2e/tai-khoan-khach.spec.ts -g "Cửa hàng" --workers=1 --reporter=line` và dán kết quả. Backend chưa xong thì ghi rõ "chưa chạy E2E vì backend chưa có endpoint".
4. Báo cáo có dòng "Skill: …" (component shadcn đã dùng, quy tắc UX đã áp).
