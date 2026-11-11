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
| bo-suu-tap | Bộ sưu tập: bảng `collection` / `collection_item`, 6 API, gói Miễn phí tối đa 3 bộ, hộp thoại "Lưu vào bộ sưu tập", trang `/bo-suu-tap` và `/bo-suu-tap/<id>` | [bo-suu-tap.md](bo-suu-tap.md) |
| chi-muc-tuong-dong | Chỉ mục tương đồng: hồ sơ sản phẩm 6 khối, `sim(i, j)`, bảng `lut_similarity` top 50, `related` và "LUT tương tự" theo nội dung (chỉ backend) | [chi-muc-tuong-dong.md](chi-muc-tuong-dong.md) |
| ho-so-nguoi-dung | Hồ sơ người dùng: bảng `user_preference` / `user_event`, ghi sự kiện VIEW / PREVIEW / SEARCH / FILTER_STYLE (`anonId`), `merge-anon`, `clear-history`, sở thích khai báo, `UserProfileService` (suy giảm 30 ngày, trộn α, strategy, cache 5 phút), bước 2 "Bạn thích phong cách màu nào?", mục "Sở thích màu" | [ho-so-nguoi-dung.md](ho-so-nguoi-dung.md) |
