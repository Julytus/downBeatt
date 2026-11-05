# Task: go-redis-mail — frontend (agy)

Plan: plan/go-redis-mail.md (đã duyệt 2026-11-05). Đọc §1, §5, §6, §8.

## Target
Bỏ chức năng quên mật khẩu (OTP) ở frontend. Không thêm màn hình, không thêm component.

## Việc cần làm
1. Xoá `src/routes/_auth/forgot-password.tsx` và `src/components/form/block/forgot-password-form.tsx`.
2. `src/components/form/block/login-form.tsx`: bỏ `<Link to="/forgot-password">Quên mật khẩu?</Link>`; hàng dưới ô mật khẩu chỉ còn checkbox "Ghi nhớ đăng nhập" (căn trái, giữ khoảng cách như cũ); sửa comment "Remember Me & Forgot Password Row"; bỏ import `Link` nếu không còn dùng.
3. `src/components/shop/account/login-form.tsx`: bỏ nút "Quên mật khẩu?" + comment giữ chỗ (toast "Tính năng lấy lại mật khẩu sẽ có ở bản sau"); hàng đó chỉ còn checkbox "Hiện mật khẩu"; bỏ import `toast` nếu không còn dùng.
4. `src/lib/axios/auth.ts`: xoá `forgotPassword`, `resetPassword`. `src/lib/tanstack/options/auth.ts`: xoá `createForgotPasswordMutationOptions`, `createResetPasswordMutationOptions`. `src/lib/types/auth.ts`: xoá `ForgotPasswordApiRequest`, `ResetPasswordApiRequest`. Không đụng login / refresh / logout.
5. `src/routes/_auth.tsx`: comment "(login, forgot-password)" → "(login)". `src/components/shop/ui/shop-field.tsx`: sửa ví dụ trong comment, không nhắc "Quên mật khẩu?".
6. `pnpm build` (sinh lại `routeTree.gen.ts`, không sửa tay).

## Ràng buộc
- Hợp đồng §5: không đổi gì ở login / refresh / logout.
- Chuỗi §6: sau task, `frontend/src` không còn "Quên mật khẩu", "Gửi mã OTP", "Nếu email có trong hệ thống, mã OTP đã được gửi". `/forgot-password` mở ra trang 404 có sẵn.
- Test nghiệm thu đã có sẵn: `frontend/tests/e2e/go-redis-mail.spec.ts` (TC-16 → TC-19) — đọc để biết selector, KHÔNG sửa.
- UI theo skill `shadcn` + `ui-ux-pro-max` (frontend/AGENTS.md mục "Skill UI/UX"). Không thêm component shadcn nào; chỉ giữ layout hàng checkbox gọn sau khi bỏ link.

## Phạm vi được sửa
Chỉ `frontend/**` trừ `frontend/tests/e2e/**`. Không restart backend, không đụng docker. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — dòng cuối build, số error lint, `N passed / M failed` — không dán log đầy đủ)
1. `cd frontend && pnpm build` xanh.
2. `pnpm lint` 0 error.
3. `grep -rn "forgot\|Quên mật khẩu\|OTP" src` không còn kết quả (dán output rỗng).
4. `pnpm test:e2e tests/e2e/go-redis-mail.spec.ts -g "TC-1[6-8]" --reporter=line` → dán `N passed / M failed`.
5. Báo cáo có dòng "Skill: …" (quy tắc UX đã áp).
