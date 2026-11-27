# DownBeat Frontend — quy tắc cho worker agy (Antigravity)

Đọc `../AGENTS.md` (giao thức worker chung) trước file này.

React 19 · Vite 7 · TypeScript · TanStack Router / Query / Table / Form · Zustand · axios · Tailwind 4 + shadcn · Playwright. Package manager: **pnpm**.

## Lệnh (chạy trong `frontend/`)

```bash
pnpm dev            # :4500, gọi backend theo VITE_API_URL (frontend/.env)
pnpm build          # tsc -b + vite build = type-check; cũng sinh lại src/routeTree.gen.ts
pnpm lint           # eslint (0 error mới được coi là xong; warning cũ chấp nhận)
pnpm test:e2e tests/e2e/<slug>.spec.ts --reporter=line   # chạy test nghiệm thu của Claude; CẦN backend :9500
pnpm api:types      # sinh src/lib/types/api.gen.ts từ OpenAPI (backend phải đang chạy)
```

Backend có thể chưa xong khi bạn bắt đầu, vì worker backend chạy song song. Hãy viết type và hàm axios **theo hợp đồng ở plan §5**, đừng chờ `api:types`. Nếu backend đã chạy được endpoint mới thì chạy `pnpm api:types` để đối chiếu.

## Cấu trúc

```
src/
├─ routes/                 file-based routing (TanStack Router). routeTree.gen.ts tự sinh — KHÔNG sửa tay
│  ├─ _auth/               login, forgot-password, logout (layout không cần đăng nhập)
│  ├─ admin.tsx            layout quản trị: chưa có token → redirect /login
│  ├─ admin/index.tsx      trang chủ quản trị
│  └─ admin/<url>.tsx      1 trang = 1 file (mẫu: chuc-vu, tai-nguyen, module, phan-quyen)
├─ components/
│  ├─ ui/                  shadcn (new-york). Thêm: `pnpm dlx shadcn@latest add <component>`
│  ├─ admin/<domain>/      columns.tsx + <domain>-dialog.tsx của từng trang
│  ├─ admin/table/         DataTableAdvanced (bảng + phân trang + lọc + chọn nhiều)
│  ├─ admin/sidebar/       menu (admin-sidebar.tsx: FEATURE_ITEMS, SYSTEM_ITEMS)
│  ├─ admin/               admin-permission-guard, admin-list-error, delete-confirm-dialog, admin-loading, admin-access-denied
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
   ├─ utils/form-errors.ts toFieldErrors (lỗi zod → lỗi từng field)
   └─ utils.ts             `cn`
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
backend xong + đang chạy :9500 ──► pnpm api:types ──► đối chiếu api.gen.ts với type tay, lệch thì `ask` (không tự sửa theo BE)
                                                                                         ──► 7. pnpm build + pnpm lint ──► 8. pnpm test:e2e tests/e2e/<slug>.spec.ts
```

1. **Không chờ backend.** Viết `lib/types/<domain>.ts` từ plan §5 ngay (JSON mẫu trong plan là nguồn sự thật).
2. **Khi backend đã xong và đang chạy** (`curl -s -o /dev/null -w "%{http_code}" http://localhost:9500/api/v3/api-docs` trả 200): chạy `pnpm api:types`, file `src/lib/types/api.gen.ts` được sinh lại từ OpenAPI. Mở phần schema của domain trong đó, so tên field / kiểu / nullable với type viết tay. Khớp thì giữ type tay; lệch thì `ask` Claude kèm đoạn lệch, vì hoặc backend sai hoặc plan cần sửa. Không import trực tiếp `api.gen.ts` vào component; type tay là thứ code dùng.
3. Viết tiếp theo thứ tự file ở mục dưới, rồi `pnpm build` (cũng sinh lại `routeTree.gen.ts` khi thêm route) và `pnpm lint`.
4. Chạy E2E của Claude nếu backend đã sẵn sàng. Đỏ do giao diện thì sửa code, không sửa test.

**Toast và lỗi gom một chỗ.** Toast thành công / lỗi chỉ đặt ở `meta` của mutation (`lib/tanstack/options/<domain>.ts`); `MutationCache` hiện message của backend. Hàm axios chỉ trả `res.data.result` và để lỗi ném ra, không `try/catch` hay `toast`. Component không gọi `toast`. Query (đọc dữ liệu) **không** có toast: query lỗi thì component hiện trạng thái rỗng / dự phòng (ví dụ dropdown chỉ còn "Không chọn"), không bật thông báo.

## Trang quản trị: khung mẫu

**Code mẫu để chép** (4 trang phân quyền, nhóm "Hệ thống" ở sidebar, đã qua E2E `tests/e2e/phan-quyen.spec.ts`):

| Trang | File route | Chép khi trang mới có |
|---|---|---|
| Chức vụ `/admin/chuc-vu` | `routes/admin/chuc-vu.tsx` | CRUD đơn giản: bảng + lọc từ khoá + dialog + xoá / xoá nhiều. **Khung gốc, chép file này trước** |
| Tài nguyên `/admin/tai-nguyen` | `routes/admin/tai-nguyen.tsx` | bộ lọc dạng select lấy từ API khác, bật / tắt ngay trên bảng (Switch), cột hiện tên từ domain khác, field JSON |
| Module `/admin/module` | `routes/admin/module.tsx` | dialog phụ ngoài thêm / sửa (gán tài nguyên, danh sách "Tải thêm") |
| Phân quyền `/admin/phan-quyen` | `routes/admin/phan-quyen.tsx` | trang không phải bảng CRUD: tham số trên URL, ma trận tick lưu ngay, cập nhật lạc quan |

Mỗi trang gồm đúng các file dưới đây, ghép từ khối dùng chung (`DataTableAdvanced`, `FormDialog`, `DeleteConfirmDialog`, `AdminPermissionGuard`, `AdminListError`, `useBulkDelete`, `useCanView`). Đừng tự dựng lại bảng, dialog hay cơ chế quyền.

### Bảng thay thế khi chép

| Trong khung | Thay bằng | Lấy từ |
|---|---|---|
| `xxx` trong tên file `lib/` + `components/` và path API | tên domain kebab-case **theo backend**, ví dụ `lut-category` | plan §5 (`/api/<x>/…`) |
| `Xxx` trong tên type / hàm / component | PascalCase, ví dụ `LutCategory` | |
| `XXX_QUERY_KEY = ["xxx"]` | tên domain số nhiều, ví dụ `["lut-categories"]` | |
| `RESOURCE_CODE` | mã resource, ví dụ `"LUT_CATEGORY"` | plan §2, trùng `resource.code` trong migration |
| file route | URL tiếng Việt trong plan: `/admin/danh-muc` → `routes/admin/danh-muc.tsx` | plan §6 |
| field, chuỗi tiếng Việt (tiêu đề, cột, label, placeholder, toast, lỗi) | đúng **từng chữ** của plan | plan §5 / §6 |

```
lib/types/xxx.ts                     1. type theo §5
lib/axios/xxx.ts                     2. 1 hàm / 1 endpoint
lib/tanstack/options/xxx.ts          3. query + mutation options (meta toast)
components/admin/xxx/columns.tsx     4. cột bảng
components/admin/xxx/xxx-dialog.tsx  5. dialog thêm / sửa (zod)
routes/admin/<url>.tsx               6. trang
components/admin/sidebar/admin-sidebar.tsx   7. mục menu
```

### 1. `lib/types/xxx.ts`

Dùng **nguyên shape backend trả** (cùng tên field, cờ `0/1` giữ là `number`), không đặt tên khác như khu cửa hàng. Mẫu: `lib/types/role.ts`.

```ts
import type { PagedResult } from "@/lib/types/common";
import type { PagingDTO } from "@/lib/types/paging";

/** Bảng `xxx` như backend trả (plan §5). */
export interface XxxDTO {
  id: number;
  code: string;
  name: string;
  /** 1 = kích hoạt, 0 = tắt */
  active: number;
}

/** `GET /xxx/list` (plan §5.1). Bộ lọc để optional: không có giá trị thì không gửi. */
export interface XxxListApiRequest {
  keyword?: string;
  paging?: PagingDTO;
}

export type XxxListResponseDTO = PagedResult<XxxDTO>;

/** Body `POST /xxx/update`: không có `id` = tạo. Server tự ghi đè field nó quản lý. */
export type XxxUpsertApiRequest = Partial<Omit<XxxDTO, "id">> & { id?: number };
```

Ngoại lệ duy nhất: **cột JSON** (backend trả chuỗi, ví dụ `actions: '["VIEW","ADD"]'`). Khai báo thêm `XxxApiDTO` (shape thật) và cho code dùng `XxxDTO` (mảng), đổi qua lại trong hàm axios. Mẫu: `lib/types/resource.ts` + `parseActions` / `toResourceDTO` ở `lib/axios/resource.ts`.

### 2. `lib/axios/xxx.ts`

Method, path, tên tham số theo plan §5. Mặc định theo `backend/AGENTS.md`: `list` / `get` là GET query (`page`, `limit`), `update` / `delete/{id}` là POST. Mẫu: `lib/axios/role.ts`.

```ts
import axiosInstance from "@/lib/axios/instance";
import type { ApiResponse } from "@/lib/types/common";
import type { XxxDTO, XxxListApiRequest, XxxListResponseDTO, XxxUpsertApiRequest } from "@/lib/types/xxx";

export async function getXxxList(req: XxxListApiRequest = {}): Promise<XxxListResponseDTO> {
  const params: Record<string, unknown> = {
    page: req.paging?.page ?? 1,
    limit: req.paging?.limit ?? 10
  };
  if (req.keyword?.trim()) params.keyword = req.keyword.trim();

  const res = await axiosInstance.get<ApiResponse<XxxListResponseDTO>>("/xxx/list", { params });
  return res.data.result;
}

export async function upsertXxx(payload: XxxUpsertApiRequest): Promise<XxxDTO> {
  const res = await axiosInstance.post<ApiResponse<XxxDTO>>("/xxx/update", payload);
  return res.data.result;
}

export async function deleteXxx(id: number): Promise<number> {
  const res = await axiosInstance.post<ApiResponse<number>>(`/xxx/delete/${id}`);
  return res.data.result;
}
```

Không `try/catch`, không `toast`, không tự gắn header. Body là mảng (ví dụ gán nhiều id) thì truyền thẳng mảng (`assignModuleResources` ở `lib/axios/module.ts`).

### 3. `lib/tanstack/options/xxx.ts`

Bảng phân trang theo số trang nên danh sách dùng `queryOptions` + `keepPreviousData`. `infiniteQueryOptions` chỉ dùng cho danh sách "Tải thêm" (dialog chọn, cửa hàng); mẫu: `createInfiniteResourcesQueryOptions`. Mọi `queryKey` bắt đầu bằng `XXX_QUERY_KEY`, nên `invalidatesQuery: [XXX_QUERY_KEY]` làm mới mọi query của domain. Mẫu: `lib/tanstack/options/role.ts`.

```ts
import { keepPreviousData, queryOptions, type MutationOptions } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { deleteXxx, getXxxList, upsertXxx } from "@/lib/axios/xxx";
import type { ErrorResponse } from "@/lib/types/common";
import type { XxxDTO, XxxListApiRequest, XxxUpsertApiRequest } from "@/lib/types/xxx";

export const XXX_QUERY_KEY = ["xxx"] as const;

export const createXxxListQueryOptions = (req: XxxListApiRequest) =>
  queryOptions({
    queryKey: [...XXX_QUERY_KEY, "list", req],
    queryFn: () => getXxxList(req),
    placeholderData: keepPreviousData
  });

/** Toast tạo / sửa khác nhau (plan §6) nên nhận `isEdit`. */
export const createUpsertXxxMutationOptions = (
  isEdit: boolean
): MutationOptions<XxxDTO, AxiosError<ErrorResponse>, XxxUpsertApiRequest> => ({
  mutationKey: [...XXX_QUERY_KEY, "upsert"],
  mutationFn: upsertXxx,
  meta: {
    invalidatesQuery: [XXX_QUERY_KEY],
    successMessage: isEdit ? "Cập nhật xxx thành công" : "Tạo xxx thành công",
    errorMessage: "Không lưu được xxx"
  }
});

export const deleteXxxMutationOptions: MutationOptions<number, AxiosError<ErrorResponse>, number> = {
  mutationKey: [...XXX_QUERY_KEY, "delete"],
  mutationFn: deleteXxx,
  meta: {
    invalidatesQuery: [XXX_QUERY_KEY],
    successMessage: "Xóa xxx thành công",
    errorMessage: "Không xóa được xxx"
  }
};
```

- `queryKey` phải chứa mọi biến `queryFn` dùng (lint `@tanstack/query/exhaustive-deps` báo **error**).
- Dữ liệu domain khác phụ thuộc vào domain này thì thêm key của nó vào `invalidatesQuery`. Ví dụ đổi tài nguyên làm mới `RESOURCES_QUERY_KEY`, `PERMISSIONS_QUERY_KEY` và `["permission-resource"]` (quyền của chính người đăng nhập, sidebar dựa vào đó).
- Danh sách "mọi bản ghi" cho ô chọn: `allXxxQueryOptions` (limit 200, `staleTime: 60_000`), mẫu `allRolesQueryOptions`.

### 4. `components/admin/xxx/columns.tsx`

Mẫu: `components/admin/role/columns.tsx`. Hàm `createXxxColumns({ canUpdate, canDelete, onEdit, onShowDeleteConfirm, … })`:

- **Cờ quyền là tham số**: không có quyền thì không render mục menu / ô chọn. Cột `select` (checkbox) chỉ thêm khi `canDelete`, vì `DataTableAdvanced` bật chọn hàng nhưng không tự vẽ checkbox.
- `header` của cột dữ liệu là **chuỗi** đúng tên cột ở §6 (menu "Tùy chỉnh cột" và E2E dùng chuỗi đó). Cột thao tác: `header: () => <span className="sr-only">Thao tác</span>`, `enableHiding: false`.
- Thao tác của hàng nằm trong menu ⋮ (`DropdownMenu`). Nút ⋮ có `aria-label={`Thao tác ${row.original.name}`}` để E2E bấm đúng hàng. Mục menu: "Chỉnh sửa" / "Sửa", hành động riêng (ví dụ "Phân quyền", "Gán tài nguyên"), rồi `DropdownMenuSeparator` + "Xóa" (`className="text-destructive"`). Tên mục theo §6.
- Checkbox chọn hàng: `aria-label={`Chọn ${row.original.name}`}`, ô đầu bảng `aria-label="Chọn tất cả"`. Switch bật / tắt: `aria-label="Bật hoặc tắt <loại> <tên>"`, `disabled={!canUpdate}`.
- Bản ghi backend cấm xoá (ví dụ `SYSTEM_RESOURCE_CODES`) thì ẩn mục "Xóa" của hàng đó (backend vẫn chặn).

```tsx
export const createXxxColumns = ({ canUpdate, canDelete, onEdit, onShowDeleteConfirm }: {
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (item: XxxDTO) => void;
  onShowDeleteConfirm: (id: number, name?: string) => void;
}): ColumnDef<XxxDTO>[] => [
  ...(canDelete ? [{ id: "select", /* Checkbox như role/columns.tsx */ } satisfies ColumnDef<XxxDTO>] : []),
  { accessorKey: "name", header: "Tên", enableHiding: false },
  { accessorKey: "code", header: "Code" },
  {
    id: "rowActions",
    header: () => <span className="sr-only">Thao tác</span>,
    enableHiding: false,
    cell: ({ row }) => canUpdate || canDelete ? (/* DropdownMenu ⋮ như role/columns.tsx */) : null
  }
];
```

### 5. `components/admin/xxx/xxx-dialog.tsx`

Dialog dùng `FormDialog` + `useState` từng field + **zod `safeParse` lúc submit**. Mẫu: `components/admin/role/role-dialog.tsx` (1 field), `resource/resource-dialog.tsx` (nhiều field, regex, nhóm checkbox).

- **Props cố định**: `{ open, item, isLoading, onOpenChange, onSubmit }`. `item === null` = thêm mới. Dialog không gọi API: trang cha giữ mutation và đóng dialog ở `onSuccess`. Nhờ vậy lỗi backend (trùng mã…) hiện qua toast mà dialog vẫn mở, dữ liệu đã nhập không mất.
- `useEffect(() => { …đặt lại state theo item…; setErrors({}) }, [item, open])`.
- **Backend không kiểm định dạng**, nên schema có đủ ràng buộc của §6: bắt buộc, độ dài tối đa đúng cột DB (xem migration), regex, enum, ít nhất một lựa chọn. Message đúng từng chữ. Lỗi đổi bằng `toFieldErrors` (`lib/utils/form-errors.ts`), hiện dưới ô bằng `<FieldError>` (`components/ui/field`), ô lỗi có `aria-invalid`.
- Mỗi ô có `<Label htmlFor>` trùng `id` (E2E dùng `getByLabel`). Nhóm checkbox không có `id` thì mỗi checkbox có `aria-label`.
- Tiêu đề / nút theo §6; mặc định của khung: tiêu đề "Tạo mới xxx" / "Chỉnh sửa xxx", nút "Tạo mới" / "Cập nhật", "Hủy".

```tsx
const xxxSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên").max(300, "Tên tối đa 300 ký tự"),
  code: z.string().trim().min(1, "Vui lòng nhập code").max(100, "Code tối đa 100 ký tự")
    .regex(/^[A-Z0-9_]+$/, "Code chỉ gồm chữ in hoa, số và dấu _")
});

export function XxxFormDialog({ open, item, isLoading, onOpenChange, onSubmit }: {
  open: boolean;
  item: XxxDTO | null;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: XxxUpsertApiRequest) => void;
}) {
  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    setName(item?.name ?? "");
    setCode(item?.code ?? "");
    setErrors({});
  }, [item, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = xxxSchema.safeParse({ name, code });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error));
      return;
    }
    setErrors({});
    onSubmit({ id: item?.id, ...parsed.data }); // giá trị đã trim
  };

  return (
    <FormDialog open={open} onOpenChange={onOpenChange} onSubmit={handleSubmit} isLoading={isLoading}
      title={item ? "Chỉnh sửa xxx" : "Tạo mới xxx"} submitLabel={item ? "Cập nhật" : "Tạo mới"}>
      <div className="space-y-2">
        <Label htmlFor="xxx-name">Tên</Label>
        <Input id="xxx-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        <FieldError>{errors.name}</FieldError>
      </div>
      {/* … */}
    </FormDialog>
  );
}
```

Form dài, nhiều ràng buộc chéo (ví dụ "Kiểu xem trước" của LUT) thì dùng `useAppForm` + zod như `components/form/block/login-form.tsx`; plan sẽ ghi rõ.

### 6. `routes/admin/<url>.tsx`

Chép `routes/admin/chuc-vu.tsx` rồi đổi tên. Các điểm phải giữ:

```tsx
const RESOURCE_CODE = "XXX";

export const Route = createFileRoute("/admin/<url>")({ component: XxxRoute });

// Guard bọc component trang: query chỉ chạy khi đã có quyền VIEW (không bắn request 403 vô ích)
function XxxRoute() {
  return (
    <AdminPermissionGuard code={RESOURCE_CODE}>
      <XxxPage />
    </AdminPermissionGuard>
  );
}

function XxxPage() {
  const queryClient = useQueryClient();
  const { can } = useCanView();
  const canAdd = can(RESOURCE_CODE, "ADD");
  const canUpdate = can(RESOURCE_CODE, "UPDATE");
  const canDelete = can(RESOURCE_CODE, "DELETE");

  // pageIndex của bảng tính từ 0, backend tính trang từ 1
  const [paging, setPaging] = useState({ pageIndex: 0, pageSize: 10 });
  const [filter, setFilter] = useState<Record<string, string>>({ keyword: "" });
  const [dialog, setDialog] = useState<{ open: boolean; item: XxxDTO | null }>({ open: false, item: null });
  const [deleting, setDeleting] = useState<{ id: number; name?: string } | null>(null);

  const { data, isFetching, isError, refetch } = useQuery(
    createXxxListQueryOptions({
      keyword: filter.keyword || undefined,
      paging: { page: paging.pageIndex + 1, limit: paging.pageSize }
    })
  );

  const upsertMutation = useMutation({
    ...createUpsertXxxMutationOptions(dialog.item !== null),
    onSuccess: () => setDialog((d) => ({ ...d, open: false })) // chỉ đổi state UI
  });
  const deleteMutation = useMutation(deleteXxxMutationOptions);
  const bulkDelete = useBulkDelete({
    deleteOne: deleteXxx, // hàm API trần, không phải mutateAsync
    label: "xxx",
    onSettled: () => void queryClient.invalidateQueries({ queryKey: XXX_QUERY_KEY })
  });

  // Bảng gọi lại hàm này cả khi giá trị không đổi: giữ nguyên object để không render thừa
  const handlePaginationChange = useCallback((pageIndex: number, pageSize: number) => {
    setPaging((p) => (p.pageIndex === pageIndex && p.pageSize === pageSize ? p : { pageIndex, pageSize }));
  }, []);

  const columns = useMemo(() => createXxxColumns({
    canUpdate,
    canDelete,
    onEdit: (item) => setDialog({ open: true, item }),
    onShowDeleteConfirm: (id, name) => setDeleting({ id, name })
  }), [canUpdate, canDelete]);

  return (
    <>
      {isError && <AdminListError onRetry={() => void refetch()} />}
      <DataTableAdvanced
        title="Xxx" description="…"                         /* §6 */
        data={data?.items ?? []} total={data?.total ?? 0} columns={columns}
        pageIndex={paging.pageIndex} pageSize={paging.pageSize} onPaginationChange={handlePaginationChange}
        isLoading={isFetching || bulkDelete.isPending} onRefresh={() => void refetch()}
        filter={{ fields: FILTER_FIELDS, values: filter, onChange: setFilter }}
        onAdd={canAdd ? () => setDialog({ open: true, item: null }) : undefined} addLabel="Thêm xxx"
        onDeleteSelected={canDelete ? (ids) => void bulkDelete.run(ids) : undefined}
      />
      <XxxFormDialog open={dialog.open} item={dialog.item} isLoading={upsertMutation.isPending}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        onSubmit={(values) => upsertMutation.mutate(values)} />
      <DeleteConfirmDialog open={deleting !== null} itemId={deleting?.id ?? null} itemName={deleting?.name}
        itemType="xxx" isLoading={deleteMutation.isPending} onConfirm={(id) => deleteMutation.mutate(id)}
        onOpenChange={(open) => { if (!open) setDeleting(null); }} />
    </>
  );
}
```

- Dùng `if (…) …` trong callback, không viết `!open && setX(null)` (lint `no-unused-expressions`).
- Mutation dùng trong `useMemo` (bật / tắt trên bảng): lấy `const { mutate: toggleActive } = useMutation(...)` rồi đưa `toggleActive` vào deps (mẫu: `tai-nguyen.tsx`).
- Đã có sẵn, không viết lại: lọc tự debounce 400 ms và về trang 1; bấm "Bộ lọc" lần nữa là đóng và xoá lọc; bảng rỗng hiện "Không có dữ liệu."; "Xóa mục đã chọn" hỏi `confirm()` rồi xoá song song tối đa 4 request, cuối cùng hiện một toast tổng kết.

### 7. Sidebar (`components/admin/sidebar/admin-sidebar.tsx`)

Mỗi nhóm menu là một mảng `{ code, title, url, icon }[]`, lọc `canView(code)`, render bằng `<AdminMain label="…" items={…} />`. Nhóm rỗng thì không render nhãn. Chức năng ecom thêm vào `FEATURE_ITEMS` (nhóm "Chức năng chính"); trang quản trị hệ thống thêm vào `SYSTEM_ITEMS` (nhóm "Hệ thống"). Plan cần nhóm mới thì thêm mảng mới theo cùng cách. `title` theo §6, icon lấy từ `lucide-react`.

### Biến thể đã có mẫu

| Cần | Mẫu |
|---|---|
| Bộ lọc dạng select lấy từ domain khác (kèm "Tất cả", "Chưa phân …") | `filterFields` trong `routes/admin/tai-nguyen.tsx` |
| Cột hiện tên từ domain khác (id → tên) | `moduleNames` (Map) truyền vào `createResourceColumns` |
| Query domain khác cần quyền khác | `useQuery({ ...allModulesQueryOptions, enabled: can("MODULE", "VIEW") })`; thiếu quyền thì hiện dự phòng ("Chưa phân module"), không toast |
| Bật / tắt ngay trên bảng | `toggleMutation` (cùng API update) trong `tai-nguyen.tsx` / `module.tsx` |
| Dialog phụ chọn nhiều bản ghi, tìm kiếm + "Tải thêm" | `components/admin/module/assign-resources-dialog.tsx` + `createInfiniteResourcesQueryOptions` |
| Chuyển sang trang khác kèm tham số | `navigate({ to: "/admin/phan-quyen", search: { roleId } })` ở `chuc-vu.tsx`; trang nhận dùng `validateSearch` zod `.catch(undefined)` |
| Tick lưu ngay, cập nhật lạc quan | `save()` trong `routes/admin/phan-quyen.tsx`: `queryClient.setQueryData` rồi `mutate`; `invalidatesQuery` tự đồng bộ lại |
| Trang không phải bảng (tiêu đề + ô chọn + nội dung) | `routes/admin/phan-quyen.tsx` (khung `container mx-auto flex flex-col gap-6 p-6` như `DataTableAdvanced`, đang tải dùng `Skeleton`) |
| Cột JSON (mảng trong một cột) | `parseActions` / `toResourceDTO` ở `lib/axios/resource.ts` |

Mẫu tải file lên (multipart `FormData`, không tự đặt `Content-Type`, kiểm đuôi và dung lượng ở FE trước khi gửi): `components/admin/lut/file-slot.tsx`.

Chưa có mẫu (làm khi plan yêu cầu): số / tiền trong form (giữ chuỗi, zod regex, `Number()` khi dựng payload, hiện bằng `formatVnd`); trang chỉ xem có `Sheet` chi tiết.

### Tự kiểm trước khi gửi `worker_done`

- [ ] Chuỗi khớp §6 từng chữ: `title`, `addLabel`, `header` của cột, mục menu ⋮, label, placeholder lọc, mục sidebar, toast, message lỗi zod.
- [ ] Nút ⋮, checkbox, switch có `aria-label` chứa tên bản ghi.
- [ ] Đăng nhập `noaccess@downbeat.local`: menu không có mục, gõ thẳng URL thấy "Truy cập bị từ chối". Quyền chỉ VIEW thì không thấy nút Thêm / mục Sửa / Xóa.
- [ ] Không có `toast` trong component hay hàm axios (trừ `useBulkDelete` có sẵn); không `refetch()` sau mutate.
- [ ] Mọi `queryKey` bắt đầu bằng `XXX_QUERY_KEY` và chứa đủ tham số của `queryFn`.
- [ ] Schema zod đủ ràng buộc §6; payload chỉ có field client được sửa.
- [ ] Backend tắt hoặc lỗi: trang hiện khung "Không tải được danh sách" + "Thử lại", không trắng trang, không toast.
- [ ] `pnpm build` xanh, `pnpm lint` 0 error.

## Quy tắc

- **Nhãn giao diện theo đúng plan §6**: tiêu đề trang, tên nút, label field, placeholder ô tìm kiếm, nội dung toast, tên cột. Test E2E chọn phần tử bằng `getByRole` / `getByLabel` / `getByText` với chính các chuỗi đó, nên sai một chữ là test đỏ. Mỗi input phải có `<Label htmlFor>` hoặc `aria-label` trùng label trong plan.
- **HTTP**: chỉ qua `axiosInstance`. Không tự gắn `Authorization`, không tự xử lý 401 (instance đã làm).
- **Toast và làm mới dữ liệu nằm ở `meta` của mutation**. `onSuccess` trong component chỉ đổi state UI (đóng dialog...), không gọi `toast` (sẽ ra 2 toast) và không cần `refetch()` (đã có `invalidatesQuery`). Khi lỗi, MutationCache ưu tiên message của backend; `meta.errorMessage` chỉ dùng dự phòng lúc mất mạng.
- **Xoá nhiều**: `useBulkDelete({ deleteOne: deleteXxx })` truyền hàm API trần, không truyền `mutation.mutateAsync`.
- **Form**: dialog trang quản trị dùng `FormDialog` + `useState` + zod `safeParse` lúc submit (mục 5 của khung mẫu); form dài nhiều ràng buộc chéo dùng `useAppForm` (`components/form/hooks.tsx`) + zod như `login-form.tsx`. **Validate định dạng chỉ nằm ở frontend** (backend không kiểm): bắt buộc, độ dài tối đa đúng cột DB, regex mã, SĐT, giá trị enum, đúng message ở plan §5/§6. Thiếu là dữ liệu sai lọt vào DB hoặc ra lỗi 500. Backend chỉ trả lỗi nghiệp vụ cần tra DB (trùng mã, hết hàng…), hiện qua toast.
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
