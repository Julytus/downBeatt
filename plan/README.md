# Plan thực thi

Mỗi file `<slug>.md` là một lát chức năng (backend + frontend + test), được lập bằng `/plan-feature <slug>` và thực hiện bằng `/cook <slug>`. Mẫu: [_template.md](_template.md). Kế hoạch tổng của đồ án (giai đoạn → lát → việc con, có đánh dấu done) nằm ở [../docs/plan/README.md](../docs/plan/README.md).

Một plan chỉ được cook khi `status: approved`, nghĩa là người dùng đã đọc và duyệt.

**Cửa hàng LUT (DownBeat):** thiết kế tổng quát cơ sở dữ liệu + API và lộ trình các lát nằm ở [thiet-ke-tong-quat.md](thiet-ke-tong-quat.md) (draft), gồm cả thuật toán gợi ý theo nội dung (§11). Bản đầy đủ để viết báo cáo: [../docs/tai-lieu-thiet-ke.md](../docs/tai-lieu-thiet-ke.md). Các plan trong bảng dưới là của dự án AEOC cũ, chỉ để tham khảo cách viết.

`tasks/` lưu task spec đã giao cho Codex / agy (`<slug>-be.md`, `<slug>-fe.md`, `<slug>-be-fix1.md` …).

| Slug | Chức năng | Đợt | Trạng thái |
|---|---|---|---|
| [go-redis-mail](go-redis-mail.md) | Gỡ Redis + gửi mail (Mailpit): refresh token sang MySQL, bỏ quên mật khẩu OTP | — (hạ tầng) | done |
| [trang-chu](trang-chu.md) | Trang chủ `/` (landing page cửa hàng, chỉ frontend, dữ liệu giả) theo video tham khảo | — (giao diện) | done |
| [kho-lut](kho-lut.md) | Kho LUT: 6 API công khai, 36 LUT mẫu có file .cube + ảnh trước / sau / bìa thật trên MinIO, cửa hàng đổi từ dữ liệu giả sang API | thiết kế tổng quát §9 lát 1 | done |
| [tai-khoan-khach](tai-khoan-khach.md) | Tài khoản khách hàng: role Khách hàng, `account/register`, `account/me`, hộp thoại đăng nhập / đăng ký và menu tài khoản ở cửa hàng dùng API thật | kế hoạch tổng 1.1 | done |
| [dac-trung-mau](dac-trung-mau.md) | Đặc trưng màu: đọc file .cube, đo 10 đặc trưng màu (CIELAB), bảng `lut_color_feature`, tính lúc khởi động, trang `/admin/dac-trung-mau` | kế hoạch tổng 1.2 | done |
| [quan-ly-lut](quan-ly-lut.md) | Quản lý LUT: thêm nháp, sửa, upload .cube / ảnh / video, xuất bản có kiểm điều kiện, ẩn, xoá ở `/admin/luts` (danh mục, tác giả tách lát sau) | kế hoạch tổng 1.3 | done |
| [goi-thanh-toan](goi-thanh-toan.md) | Gói và thanh toán payOS: bảng `plan` / `payment_order` / `subscription`, tạo đơn, webhook có chữ ký, kích hoạt / gia hạn / nâng cấp, trang kết quả, nhắc gia hạn (lịch sử đơn, huỷ gói, quản trị đơn tách lát sau) | kế hoạch tổng 1.4 | done |
| [tai-lut](tai-lut.md) | Tải LUT: `POST /lut/download` kiểm gói, đóng gói `.zip` (`{Tên}-LUT/Assets/{Tên}.cube`), link MinIO ký sẵn 5 phút, bảng `download_log`, hộp thoại "Đã tải xong" + "LUT tương tự" | kế hoạch tổng 1.5 | done |
| [bo-suu-tap](bo-suu-tap.md) | Bộ sưu tập: bảng `collection` / `collection_item`, 6 API (`my-list`, `get`, `update`, `delete`, `item/add`, `item/remove`), gói Miễn phí tối đa 3 bộ, hộp thoại "Lưu vào bộ sưu tập", trang `/bo-suu-tap` và `/bo-suu-tap/$id` | kế hoạch tổng 1.6 | done |
| [chi-muc-tuong-dong](chi-muc-tuong-dong.md) | Chỉ mục tương đồng: hồ sơ sản phẩm 6 khối (thẻ, màu, danh mục, phong cách, văn bản, tác giả), `sim(i, j)`, bảng `lut_similarity` top 50 dựng lại khi khởi động / xuất bản / ẩn / sửa / 03:00, "Có thể bạn cũng thích" và "LUT tương tự" theo độ tương đồng nội dung (chỉ backend) | kế hoạch tổng 2.1 | done |
