@AGENTS.md

# Ghi chú cho Claude (reviewer frontend + tác giả E2E)

Code `frontend/src` do worker agy viết; Claude không sửa. Claude **sở hữu `frontend/tests/e2e/**`**: viết spec nghiệm thu từ test case ở plan §9 trước khi giao việc.

## Viết spec E2E

- Import từ `./support/fixtures` (không import thẳng `@playwright/test`).
- Trang cần đăng nhập dùng fixture `authedPage` (nạp sẵn token admin). Chỉ dùng `loginViaUi` khi chính luồng đăng nhập là thứ cần test.
- Dữ liệu test: tên duy nhất (`` `E2E ${Date.now()}` ``); tạo/dọn qua fixture `api` (`api.post("xxx/update", { data })`, path không có `/` đầu) để test không phụ thuộc nhau và không để rác trong DB local.
- Chọn phần tử theo role / label / text tiếng Việt **đúng như plan §6** (`getByRole("button", { name: "Thêm cửa hàng" })`), không chọn theo CSS class.
- Mỗi test có tiêu đề bắt đầu bằng ID test case: `test("TC-03 tạo mới cửa hàng hiện trong bảng", …)`, để bảng kết quả trong docs ánh xạ được về plan.
- Test case loại `api` (quyền, validate, quy tắc nghiệp vụ) viết trong `test.describe("API")` bằng fixture `api` / `apiAs`, không dùng `page`, để chạy được riêng khi chưa có frontend: `E2E_SKIP_WEBSERVER=1 pnpm test:e2e <spec> -g "API"`. Nhóm này phải phủ mọi endpoint plan §5 và mọi lỗi §5.4, vì /cook không curl tay nữa.
- Chụp ảnh cho tài liệu: `await docShot(page, "01-danh-sach")` tại các màn hình chính. Hàm này chỉ chụp khi có biến `E2E_DOC_SHOTS`.
- Tối thiểu cho 1 trang CRM: hiện danh sách; tạo mới → thấy trong bảng; sửa; xoá; lỗi backend hiện đúng message.
- Tài khoản mặc định `admin@downbeat.local / Admin@123` (seed local, `ACCOUNTS.admin`); không quyền: `ACCOUNTS.noaccess`. Đổi bằng `E2E_EMAIL` / `E2E_PASSWORD` / `E2E_API_URL`.

## Checklist review diff `git diff -- frontend` (trừ tests/e2e)

- [ ] Nhãn, nút, tiêu đề, toast khớp plan §6 từng chữ; input có label.
- [ ] Type và hàm axios khớp plan §5; `pnpm api:types` (khi backend đã chạy) không lệch với `lib/types/<domain>.ts`.
- [ ] Không gọi `toast`/`refetch` trong `onSuccess`; mutation có `meta` đủ 3 khoá.
- [ ] `CrmPermissionGuard` + sidebar dùng đúng `RESOURCE_CODE` ở plan §2.
- [ ] Dùng component shadcn có sẵn thay vì `div` tự style; không `--overwrite` file cũ trong `components/ui/`; component mới thêm qua `shadcn add` có trong `git diff --stat`. Không đổi theme/màu/font toàn app. Đối chiếu quy tắc ở `.agents/skills/shadcn/rules/*.md` (styling, composition), nhưng quy ước ở `frontend/AGENTS.md` thắng khi mâu thuẫn.
- [ ] Không sửa `routeTree.gen.ts` bằng tay, không sửa `tests/e2e/**`, không có file ngoài `frontend/**`.
- [ ] `pnpm build` + `pnpm lint` xanh khi Claude tự chạy lại.
