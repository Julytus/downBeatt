# Tài liệu chức năng

| Slug | Chức năng | Tài liệu |
|---|---|---|
| trang-chu | Trang chủ `/` (landing page cửa hàng, chỉ frontend) | [trang-chu.md](trang-chu.md) |
| kho-lut | Kho LUT: 6 API công khai, 36 LUT mẫu có file .cube + ảnh trước / sau / bìa thật, cửa hàng đọc từ backend | [kho-lut.md](kho-lut.md) |
| go-redis-mail | Gỡ Redis + gửi mail (Mailpit): refresh token sang MySQL, bỏ quên mật khẩu OTP | [go-redis-mail.md](go-redis-mail.md) |
| tai-khoan-khach | Tài khoản khách hàng: role Khách hàng, đăng ký / đăng nhập / menu tài khoản ở cửa hàng dùng API thật, gỡ `/file/upload` | [tai-khoan-khach.md](tai-khoan-khach.md) |
| dac-trung-mau | Đặc trưng màu: đọc file .cube, đo 10 đặc trưng (CIELAB), bảng `lut_color_feature`, tính lúc khởi động, trang `/admin/dac-trung-mau` | [dac-trung-mau.md](dac-trung-mau.md) |
| quan-ly-lut | Quản lý LUT: thêm nháp, sửa, tải .cube / ảnh / video, xuất bản có kiểm điều kiện, ẩn, xoá ở `/admin/luts` | [quan-ly-lut.md](quan-ly-lut.md) |
| goi-thanh-toan | Gói và thanh toán payOS: bảng giá từ API, tạo đơn, webhook có chữ ký, kích hoạt / gia hạn / nâng cấp gói, trang kết quả, nhắc gia hạn | [goi-thanh-toan.md](goi-thanh-toan.md) |
| tai-lut | Tải LUT: `POST /lut/download` kiểm gói, đóng gói `.zip`, link MinIO ký sẵn 5 phút, bảng `download_log`, hộp thoại "Đã tải xong" + "LUT tương tự" | [tai-lut.md](tai-lut.md) |
