# DownBeat Frontend — quy tắc cho worker agy (Antigravity)

Đọc `../AGENTS.md` (giao thức worker chung) trước file này.

React 19 · Vite 7 · TypeScript · TanStack Router / Query / Table / Form · Zustand · axios · Tailwind 4 + shadcn · Playwright. Package manager: **pnpm**.

## Lệnh (chạy trong `frontend/`)

```bash
pnpm dev            # :4200, gọi backend theo VITE_API_URL (frontend/.env)
pnpm build          # tsc -b + vite build = type-check; cũng sinh lại src/routeTree.gen.ts
pnpm lint           # eslint (0 error mới được coi là xong; warning cũ chấp nhận)
pnpm test:e2e tests/e2e/<slug>.spec.ts --reporter=line   # chạy test nghiệm thu của Claude; CẦN backend :9200
pnpm api:types      # sinh src/lib/types/api.gen.ts từ OpenAPI (backend phải đang chạy)
```

Backend có thể chưa xong khi bạn bắt đầu, vì worker backend chạy song song. Hãy viết type và hàm axios **theo hợp đồng ở plan §5**, đừng chờ `api:types`. Nếu backend đã chạy được endpoint mới thì chạy `pnpm api:types` để đối chiếu.

## Cấu trúc

```
src/
├─ routes/                 file-based routing (TanStack Router). routeTree.gen.ts tự sinh — KHÔNG sửa tay
│  ├─ _auth/               login, forgot-password, logout (layout không cần đăng nhập)
│  ├─ admin.tsx            layout quản trị: chưa có token → redirect /login
│  ├─ admin/index.tsx      trang chủ (trang mẫu duy nhất hiện có)
│  └─ admin/<domain>.tsx   1 trang = 1 file
├─ components/
│  ├─ ui/                  shadcn (new-york). Thêm: `pnpm dlx shadcn@latest add <component>`
│  ├─ admin/<domain>/      columns.tsx + <domain>-dialog.tsx của từng trang
│  ├─ admin/table/         DataTableAdvanced (bảng + phân trang + lọc + chọn nhiều)
│  ├─ admin/sidebar/       menu (admin-sidebar.tsx, mảng FEATURE_ITEMS)
│  ├─ admin/               admin-permission-guard, delete-confirm-dialog, admin-loading, admin-access-denied
│  ├─ form/                field TanStack Form (useAppForm) + block login/forgot-password
│  └─ shop/                cửa hàng LUT (khách hàng) — xem mục "Khu cửa hàng" bên dưới
├─ hooks/                  use-bulk-delete, use-can-view, use-mobile
└─ lib/
   ├─ types/<domain>.ts    DTO viết tay; api.gen.ts = type sinh từ OpenAPI bằng `pnpm api:types` (để đối chiếu)
   ├─ axios/<domain>.ts    1 hàm async / 1 endpoint, trả `res.data.result`
   ├─ axios/instance.ts    axiosInstance: Bearer token, 401 → refresh 1 lần → retry
   ├─ axios/auth.ts        login, refresh, logout, quên mật khẩu, /user/info, /permission/resource
   ├─ tanstack/options/<domain>.ts   queryOptions + mutationOptions (kèm meta)
   ├─ tanstack/query-client/          MutationCache: toast + invalidate theo meta
   ├─ stores/auth.ts       Zustand: accessToken, refreshToken, userId, remember
   └─ utils.ts             chỉ có `cn`
tests/e2e/                 DO CLAUDE VIẾT — chỉ chạy, không sửa
```

## Khu cửa hàng (`/luts`, `/pricing`)

Giao diện riêng, không dùng token zinc của trang quản trị:

- Màu lấy từ biến `--sh-*` trong `components/shop/shop-theme.css` (có bản sáng / tối), viết `bg-(--sh-surface)`, `text-(--sh-muted)`… Chữ trắng trên nền hồng dùng `--sh-primary` (đạt AA), `--sh-pink` chỉ để trang trí. Nút dùng `ShopButton`, ô nhập dùng `ShopField` / `ShopCheckbox`. Nội dung portal (Dialog, DropdownMenu, Sheet) phải thêm class `shop` để có biến màu.
- Layout: `routes/_shop.tsx` (sidebar + header + footer) cho `/luts/**`; `routes/_plain.tsx` (không sidebar) cho `/pricing`. Phần chung (font, hộp thoại, thanh tiến trình) ở `components/shop/layout/shop-shell.tsx`.
- Hộp thoại đăng nhập / đăng ký / nâng cấp / thanh toán mở bằng `useShopDialog().open({ type, ... })`, render một lần ở `ShopDialogs`. Bấm tải LUT luôn đi qua `useLutDownload()` (kiểm đăng nhập + gói trước khi gọi API).
- **Dữ liệu đang là giả** ở `lib/mock/**` (cùng chữ ký với hàm axios sau này). Khi lát backend xong: viết `lib/axios/<x>.ts` cùng chữ ký, đổi import trong `lib/tanstack/options/luts.ts` / `account.ts`, xoá hàm giả. Bảng hàm giả → endpoint ở `plan/thiet-ke-tong-quat.md` §8.
- Tham số lọc của `/luts` nằm trên URL (`lib/search/luts.ts`, zod `.catch(undefined)` để URL sai không vỡ trang).

## Luồng làm một chức năng mới

```
plan §5 (hợp đồng API) ──► 1. viết type tay theo §5 ──► 2. axios ──► 3. tanstack options (meta toast) ──► 4. components ──► 5. route ──► 6. sidebar
                                     ▲
backend xong + đang chạy :9200 ──► pnpm api:types ──► đối chiếu api.gen.ts với type tay, lệch thì `ask` (không tự sửa theo BE)
                                                                                         ──► 7. pnpm build + pnpm lint ──► 8. pnpm test:e2e tests/e2e/<slug>.spec.ts
```

1. **Không chờ backend.** Viết `lib/types/<domain>.ts` từ plan §5 ngay (JSON mẫu trong plan là nguồn sự thật).
2. **Khi backend đã xong và đang chạy** (`curl -s -o /dev/null -w "%{http_code}" http://localhost:9200/api/v3/api-docs` trả 200): chạy `pnpm api:types`, file `src/lib/types/api.gen.ts` được sinh lại từ OpenAPI. Mở phần schema của domain trong đó, so tên field / kiểu / nullable với type viết tay. Khớp thì giữ type tay; lệch thì `ask` Claude kèm đoạn lệch, vì hoặc backend sai hoặc plan cần sửa. Không import trực tiếp `api.gen.ts` vào component; type tay là thứ code dùng.
3. Viết tiếp theo thứ tự file ở mục dưới, rồi `pnpm build` (cũng sinh lại `routeTree.gen.ts` khi thêm route) và `pnpm lint`.
4. Chạy E2E của Claude nếu backend đã sẵn sàng. Đỏ do giao diện thì sửa code, không sửa test.

**Toast và lỗi gom một chỗ.** Toast thành công / lỗi chỉ đặt ở `meta` của mutation (`lib/tanstack/options/<domain>.ts`); `MutationCache` hiện message của backend. Hàm axios chỉ trả `res.data.result` và để lỗi ném ra, không `try/catch` hay `toast`. Component không gọi `toast`. Query (đọc dữ liệu) **không** có toast: query lỗi thì component hiện trạng thái rỗng / dự phòng (ví dụ dropdown chỉ còn "Không chọn"), không bật thông báo.

## Thêm 1 trang quản trị (thứ tự file, đặt tên theo `<domain>`)

Chưa có trang CRUD nào để chép; làm theo thứ tự dưới đây với các khối dùng chung có sẵn (`DataTableAdvanced`, `FormDialog`, `DeleteConfirmDialog`, `AdminPermissionGuard`, `useBulkDelete`, `useCanView`). Trang quản trị có route `/admin/<domain>` (file `routes/admin/<domain>.tsx`); trang cho khách (cửa hàng ecom) đặt route theo plan §6.

1. `lib/types/<domain>.ts`: `XxxDTO`, `XxxListApiRequest`, `XxxListResponseDTO {total, page, items}`, theo đúng plan §5. Backend `Page<T>` trả `{total, page, items}`.
2. `lib/axios/<domain>.ts`: `getXxx(params)`, `upsertXxx(payload)`, `deleteXxx(id)`; luôn dùng `axiosInstance`, map `paging` → `page`/`limit`.
3. `lib/tanstack/options/<domain>.ts`: `createInfiniteXxxQueryOptions` (queryKey `["<domain số nhiều>", opts]`) + `upsertXxxMutationOptions` / `deleteXxxMutationOptions` có `meta: { invalidatesQuery: [["<domain số nhiều>"]], successMessage, errorMessage }`.
4. `components/admin/<domain>/columns.tsx` (`createXxxColumns({ onEdit, onShowDeleteConfirm })`) và `<domain>-dialog.tsx` (dùng `FormDialog`).
5. `routes/admin/<domain>.tsx`: bọc `<AdminPermissionGuard code="<RESOURCE_CODE>">`, dùng `DataTableAdvanced`, `DeleteConfirmDialog`, `useBulkDelete({ deleteOne: deleteXxx })`.
6. `components/admin/sidebar/admin-sidebar.tsx`: thêm `{ code: "<RESOURCE_CODE>", title, url, icon }` vào `FEATURE_ITEMS` (tự lọc theo quyền VIEW).

`<RESOURCE_CODE>` lấy từ plan §2 và phải trùng `resource.code` mà backend tạo bằng migration. Operator luôn thấy mọi trang; user thường cần được cấp quyền VIEW trong bảng `permission` (qua migration / seed, chưa có màn hình phân quyền).

## Quy tắc

- **Nhãn giao diện theo đúng plan §6**: tiêu đề trang, tên nút, label field, placeholder ô tìm kiếm, nội dung toast, tên cột. Test E2E chọn phần tử bằng `getByRole` / `getByLabel` / `getByText` với chính các chuỗi đó, nên sai một chữ là test đỏ. Mỗi input phải có `<Label htmlFor>` hoặc `aria-label` trùng label trong plan.
- **HTTP**: chỉ qua `axiosInstance`. Không tự gắn `Authorization`, không tự xử lý 401 (instance đã làm).
- **Toast và làm mới dữ liệu nằm ở `meta` của mutation**. `onSuccess` trong component chỉ đổi state UI (đóng dialog...), không gọi `toast` (sẽ ra 2 toast) và không cần `refetch()` (đã có `invalidatesQuery`). Khi lỗi, MutationCache ưu tiên message của backend; `meta.errorMessage` chỉ dùng dự phòng lúc mất mạng.
- **Xoá nhiều**: `useBulkDelete({ deleteOne: deleteXxx })` truyền hàm API trần, không truyền `mutation.mutateAsync`.
- **Form**: dialog trang quản trị dùng `FormDialog` + `useState` như các dialog hiện có; form nhiều ràng buộc dùng `useAppForm` (`components/form/hooks.tsx`) + zod như `login-form.tsx`. **Validate định dạng chỉ nằm ở frontend** (backend không kiểm): bắt buộc, độ dài tối đa đúng cột DB, regex mã, SĐT, giá trị enum, đúng message ở plan §5/§6. Thiếu là dữ liệu sai lọt vào DB hoặc ra lỗi 500. Backend chỉ trả lỗi nghiệp vụ cần tra DB (trùng mã, hết hàng…), hiện qua toast.
- **Quyền trên UI chỉ để ẩn/hiện** (`useCanView`, `AdminPermissionGuard`); không coi đó là lớp bảo vệ.
- Class Tailwind gộp bằng `cn` từ `@/lib/utils`. Import dùng alias `@/`.
- Text giao diện, comment và toast viết tiếng Việt. Biến môi trường chỉ có `VITE_API_URL` (`lib/env.ts`); không đặt secret trong `VITE_*`.

## Skill UI/UX (nằm ở `.agents/skills/`, Antigravity tự nạp, khi design hay xây giao diện nên dùng /ui-ux-pro-max)

| Skill | Nguồn | Dùng khi |
|---|---|---|
| `shadcn` | [shadcn-ui/ui `skills/shadcn`](https://github.com/shadcn-ui/ui/tree/main/skills/shadcn) (chính chủ) | Dựng giao diện bằng component shadcn: chọn component, ghép component, styling, form, icon |
| `ui-ux-pro-max` | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) (MIT) | Tra quy tắc UX: accessibility, form, bảng, trạng thái rỗng/loading, responsive |

Cách dùng trong dự án này:

1. **Trước khi viết component**, đọc `.agents/skills/shadcn/SKILL.md` và các file `rules/*.md` liên quan. Xem component đang có: `pnpm dlx shadcn@latest info --json` (dòng ``!`npx shadcn@latest info --json` `` trong SKILL.md chỉ chạy được ở Claude Code, ở đây phải tự chạy). Dự án là base **radix** (style new-york): dùng `asChild`, toast dùng `sonner`.
2. **Ưu tiên component shadcn có sẵn** (`src/components/ui/`) rồi mới đến component chính thức chưa cài: `pnpm dlx shadcn@latest search @shadcn -q "<từ khoá>"`, `pnpm dlx shadcn@latest docs <component>`, rồi `pnpm dlx shadcn@latest add <component>`. Không viết `div` tự style khi đã có component tương ứng (`Alert`, `Badge`, `Skeleton`, `Separator`, `Empty`…). Không dùng registry cộng đồng (`@xxx/...`, `owner/repo`) trừ khi task cho phép. **Không bao giờ `--overwrite`** component trong `src/components/ui/` (nhiều file đã sửa tay); cần cập nhật thì `ask`.
3. **Tra UX khi gặp chỗ cần quyết định** (form, bảng, dialog xoá, trạng thái rỗng, focus bàn phím…), mỗi lần một ý, chạy từ gốc repo:
   ```bash
   python .agents/skills/ui-ux-pro-max/scripts/search.py "form validation error" --domain ux
   python .agents/skills/ui-ux-pro-max/scripts/search.py "data table pagination" --stack shadcn
   python .agents/skills/ui-ux-pro-max/scripts/search.py "keyboard focus dialog" --stack react
   ```
   Không dùng `--design-system`, `--persist` hay đổi theme/màu/font toàn app: giao diện trang quản trị giữ nguyên token zinc ở `src/index.css`. Kết quả tra là gợi ý, không phải lệnh.
4. **Thứ tự ưu tiên khi mâu thuẫn**: plan §5/§6 (nhãn, hợp đồng) > file này và `AGENTS.md` > code hiện có > skill. Ví dụ: dialog trang quản trị vẫn dùng `FormDialog` dù skill shadcn khuyên `FieldGroup` + `Field`; toast vẫn chỉ đặt ở `meta` của mutation.
5. Không sửa gì trong `.agents/**`. Ghi vào báo cáo `worker_done` một dòng "Skill: …" nêu component shadcn đã thêm và quy tắc UX đã áp (nếu có).

## Nghiệm thu chuẩn (task không ghi gì thêm thì dùng mục này)

1. `pnpm build` xanh (type-check + sinh routeTree).
2. `pnpm lint` 0 error.
3. Nếu backend đã sẵn sàng: `pnpm test:e2e tests/e2e/<slug>.spec.ts --reporter=line`, dán kết quả vào báo cáo. Test đỏ vì backend chưa xong thì ghi rõ trong báo cáo, không coi là lỗi của bạn.

## Code cũ chưa theo chuẩn (đừng chép)

- `"use client"` ở đầu một số file: thừa từ Next.js, không có tác dụng với Vite.
- Các trang cũ vẫn gọi `refetch()` sau mutate: thừa, vì đã có `invalidatesQuery`.
