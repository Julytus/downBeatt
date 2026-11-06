# DownBeat

Cửa hàng LUT chỉnh màu cho người làm video. Người dùng xem trước LUT bằng ảnh trước/sau hoặc video, tải miễn phí các LUT thường, còn LUT có dấu ★ (Premium) cần gói Pro hoặc Studio.

Đồ án môn học: ứng dụng thương mại điện tử. Monorepo gồm `backend/` (Spring Boot) và `frontend/` (React).

![Trang chủ](docs/img/readme/00-trang-chu.jpg)

## Trạng thái hiện tại

| Phần | Trạng thái |
|---|---|
| Trang chủ `/`: hero, nhà sáng tạo, colorist, ghép ảnh LUT phổ biến, tìm màu bằng lời, băng tính năng, bảng giá rút gọn, FAQ | Xong, dữ liệu giả; tài liệu ở [docs/chuc-nang/trang-chu.md](docs/chuc-nang/trang-chu.md) |
| Giao diện cửa hàng: kho LUT, chi tiết, danh mục, tìm kiếm, bảng giá, đăng ký/đăng nhập, nâng cấp, thanh toán | Xong, chạy bằng **dữ liệu giả** trong `frontend/src/lib/mock` (chưa gọi API) |
| Đăng nhập trang quản trị `/login` → `/admin` | Xong, chạy với backend thật (JWT + refresh token lưu MySQL; đã bỏ quên mật khẩu qua email) |
| Trang quản trị (quản lý LUT, đơn hàng, gói) | Mới có khung, chức năng làm theo từng lát trong `plan/` |
| Thanh toán payOS | Chưa nối; hộp thoại thanh toán hiện là bản giả lập |
| CSDL và API cho cửa hàng | Đã thiết kế ở [plan/thiet-ke-tong-quat.md](plan/thiet-ke-tong-quat.md), chưa làm |

## Giao diện

### Trang chủ

<table>
  <tr>
    <td width="50%"><img src="docs/img/readme/00-trang-chu-tinh-nang.jpg" alt="Băng tính năng trên trang chủ"><br><sub>Băng tính năng; header hiện menu khi đã cuộn qua hero</sub></td>
    <td width="50%"><img src="docs/img/readme/01-kho-lut.jpg" alt="Kho LUT"><br><sub>Kho LUT, giao diện sáng</sub></td>
  </tr>
</table>

Trang chủ có nút sáng / tối như các trang khác. Ở giao diện tối, các khối dùng xen kẽ hai tông nền.

### Cửa hàng

<table>
  <tr>
    <td width="50%"><img src="docs/img/readme/02-kho-lut-toi.jpg" alt="Kho LUT giao diện tối"><br><sub>Kho LUT, giao diện tối</sub></td>
    <td width="50%"><img src="docs/img/readme/03-tim-kiem.jpg" alt="Gợi ý tìm kiếm"><br><sub>Gợi ý khi gõ tìm kiếm</sub></td>
  </tr>
  <tr>
    <td><img src="docs/img/readme/04-chi-tiet-lut.jpg" alt="Chi tiết LUT, so sánh trước sau"><br><sub>Chi tiết LUT: kéo thanh giữa để so sánh trước/sau</sub></td>
    <td><img src="docs/img/readme/05-chi-tiet-video.jpg" alt="Chi tiết LUT Premium xem trước bằng video"><br><sub>LUT ★ Premium, xem trước bằng video</sub></td>
  </tr>
  <tr>
    <td><img src="docs/img/readme/06-danh-muc.jpg" alt="Trang danh mục"><br><sub>Trang danh mục (<code>/luts/danh-muc/dien-anh</code>)</sub></td>
    <td><img src="docs/img/readme/07-bang-gia.jpg" alt="Bảng giá"><br><sub>Bảng giá: Miễn phí, Pro, Studio; trả theo tháng hoặc năm</sub></td>
  </tr>
</table>

### Tài khoản và thanh toán

<table>
  <tr>
    <td width="50%"><img src="docs/img/readme/08-dang-ky.jpg" alt="Đăng ký"><br><sub>Đăng ký bằng email (không có đăng nhập Google)</sub></td>
    <td width="50%"><img src="docs/img/readme/09-dang-nhap.jpg" alt="Đăng nhập"><br><sub>Đăng nhập</sub></td>
  </tr>
  <tr>
    <td><img src="docs/img/readme/10-nang-cap.jpg" alt="Mời nâng cấp khi tải LUT Premium"><br><sub>Tài khoản miễn phí bấm tải LUT ★ thì được mời nâng cấp</sub></td>
    <td><img src="docs/img/readme/11-thanh-toan.jpg" alt="Thanh toán gói Pro"><br><sub>Mua gói Pro qua payOS (bản demo, chưa trừ tiền thật)</sub></td>
  </tr>
  <tr>
    <td><img src="docs/img/readme/12-tai-khoan.jpg" alt="Menu tài khoản gói Pro"><br><sub>Menu tài khoản: gói đang dùng và ngày hết hạn</sub></td>
    <td></td>
  </tr>
</table>

### Điện thoại

<p>
  <img src="docs/img/readme/13-dien-thoai.jpg" alt="Kho LUT trên điện thoại" width="260">
  &nbsp;
  <img src="docs/img/readme/14-dien-thoai-chi-tiet.jpg" alt="Chi tiết LUT trên điện thoại, giao diện tối" width="260">
</p>

### Quản trị

<table>
  <tr>
    <td width="50%"><img src="docs/img/readme/15-admin-dang-nhap.jpg" alt="Đăng nhập quản trị"><br><sub>Đăng nhập quản trị (<code>/login</code>)</sub></td>
    <td width="50%"><img src="docs/img/readme/16-admin.jpg" alt="Trang quản trị"><br><sub>Trang quản trị (đang là khung)</sub></td>
  </tr>
</table>

## Công nghệ

| | |
|---|---|
| **Backend** | Java 21, Spring Boot 3.2, jOOQ, Flyway, MySQL 8.4, MinIO (lưu file), JWT |
| **Frontend** | React 19, Vite 7, TypeScript, TanStack Router + Query + Form, Tailwind CSS 4, shadcn/ui (Radix), zustand, zod |
| **Kiểm thử** | JUnit (backend), Playwright + axe-core (E2E, kiểm tra khả năng truy cập WCAG) |
| **Hạ tầng local** | Docker Compose: MySQL, MinIO, phpMyAdmin |

## Cấu trúc thư mục

```
backend/            Spring Boot, nhiều module Maven
  entity/           Lớp sinh từ CSDL (jOOQ codegen)
  base/             Hạ tầng dùng chung: repository, xử lý lỗi, phân quyền
  authenticate/     Đăng nhập, refresh token (bảng MySQL), đếm đăng nhập sai (bộ nhớ)
  business/         Nghiệp vụ cửa hàng (chưa có)
  app/              Điểm khởi chạy, cấu hình, migration Flyway (src/main/resources/db)
frontend/
  src/routes/       Trang theo file (TanStack Router): index (trang chủ), _shop/luts, _plain/pricing, _auth/login, admin
  src/components/   shop/ (cửa hàng, trang chủ ở shop/home), admin/ (quản trị), ui/ (shadcn)
  src/lib/mock/     Dữ liệu và API giả của cửa hàng, cùng chữ ký với API thật sau này
plan/               Thiết kế tổng quát + plan từng chức năng
docs/               Tài liệu chức năng, ảnh chụp giao diện
scripts/ai/         Script hỗ trợ (restart backend, chụp ảnh README)
```

## Chạy trên máy

Cần: JDK 21, Maven, Node 22+, pnpm, Docker.

```bash
# 1. Biến môi trường (sửa mật khẩu nếu muốn)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. MySQL, MinIO
docker compose -f docker-compose.local.yml --env-file backend/.env up -d

# 3. Backend: http://localhost:9500/api (Flyway tự tạo bảng và tài khoản mẫu)
cd backend && mvn -q -DskipTests package && java -jar app/target/aeoc-backend.jar
#    hoặc trên Windows / Git Bash: sh scripts/ai/backend-restart.sh

# 4. Frontend: http://localhost:4200
cd frontend && pnpm install && pnpm dev
```

Chỉ xem trang chủ và giao diện cửa hàng thì bước 4 là đủ, vì cửa hàng đang chạy bằng dữ liệu giả.

Các địa chỉ khác khi chạy local:

| | |
|---|---|
| Tài liệu API (Swagger) | http://localhost:9500/api/swagger-ui.html |
| phpMyAdmin | http://localhost:8092 |
| MinIO console | http://localhost:9021 |

### Tài khoản mẫu

| Khu vực | Email | Mật khẩu | Ghi chú |
|---|---|---|---|
| Quản trị `/login` | `admin@downbeat.local` | `Admin@123` | Toàn quyền |
| Quản trị `/login` | `noaccess@downbeat.local` | `Admin@123` | Không có quyền nào |
| Cửa hàng (nút Đăng nhập) | `free@downbeat.local` | `Admin@123` | Gói Miễn phí, dữ liệu giả |
| Cửa hàng (nút Đăng nhập) | `pro@downbeat.local` | `Admin@123` | Gói Pro, tải được LUT ★ |

Tài khoản cửa hàng và tài khoản quản trị là hai hệ riêng: tài khoản cửa hàng hiện chỉ lưu trong trình duyệt (localStorage) cho bản demo.

## Kiểm tra chất lượng

```bash
cd frontend && pnpm build && pnpm lint
cd frontend && pnpm test:e2e                       # Playwright, cần dev server :4200 (và backend cho auth.spec)
cd backend  && mvn -q "-Djooq.codegen.skip=true" test
```

Bộ E2E của cửa hàng chạy trên 4 cỡ màn hình × 2 giao diện sáng/tối, kiểm tra luồng tải LUT, đăng ký, nâng cấp, thanh toán, và quét lỗi truy cập bằng axe (độ tương phản, cỡ vùng bấm tối thiểu 24px…).

Mã test (`frontend/tests/`, `backend/**/src/test/`) đang nằm trong `.gitignore` nên chỉ có trên máy phát triển.

## Tài liệu

- [plan/thiet-ke-tong-quat.md](plan/thiet-ke-tong-quat.md): thiết kế CSDL, API, luồng thanh toán payOS và các lát chức năng sẽ làm.
- [plan/README.md](plan/README.md): danh sách plan.
- `docs/chuc-nang/`: tài liệu từng chức năng khi làm xong (phục vụ báo cáo).

Ảnh trong README chụp tự động bằng `node scripts/ai/chup-anh-readme.mjs` (chỉ chụp lại ảnh trang chủ: `README_ONLY=trang-chu node scripts/ai/chup-anh-readme.mjs`) (cần frontend :4200; ảnh quản trị cần thêm backend :9500). Giao diện đổi thì chạy lại lệnh này.
