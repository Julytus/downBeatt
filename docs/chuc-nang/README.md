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
| xep-hang-goi-y | Xếp hạng gợi ý: bảng `rec_impression`, `for-you` (score toàn kho, top 100, MMR λ 0,7, LUT Premium tối đa 4/12 cho gói Miễn phí / vãng lai, phổ biến 30 ngày xen kẽ phong cách, câu giải thích), `dismiss`, `related` cá nhân hoá; khối "Dành cho bạn" / "Phổ biến tuần này" ở `/luts`, "Không quan tâm" + "Hoàn tác" | [xep-hang-goi-y.md](xep-hang-goi-y.md) |
| quan-tri-goi-y | Quản trị gợi ý: resource `RECOMMEND`, 5 API (`config`, `rebuild`, `stats`, `customers`, `try-profile`), trang `/admin/goi-y` 4 thẻ "Cấu hình", "Đánh giá", "Trực tuyến" (CTR, tỉ lệ tải, tỉ lệ bỏ qua), "Thử hồ sơ" + nút "Tính lại chỉ mục" | [quan-tri-goi-y.md](quan-tri-goi-y.md) |
| danh-gia-goi-y | Đánh giá gợi ý (phần 1): bộ D1 mô phỏng, chia theo thời gian, 8 chỉ số K = 5 / 10 / 20, 5 thuật toán (B1, B2, B2-dd, B3, M) bằng `ProfileBuilder` + `Recommender` thật, bảng `rec_eval_run`, 2 API `eval/list` `eval/get`, profile `eval`, thẻ "Đánh giá" ở `/admin/goi-y` (bảng, đổi K, lọc, so sánh hai lần chạy) | [danh-gia-goi-y.md](danh-gia-goi-y.md) |
| tinh-chinh-goi-y | Tinh chỉnh gợi ý (đánh giá phần 2): loại LUT đã xem khỏi ứng viên, tinh chỉnh M / B3 trên tập kiểm định (500 bộ trọng số, λ, chu kỳ bán rã × k, đường tính nhanh), 12 thuật toán (7 biến thể bỏ bớt), kịch bản người mới n = 0 / 1 / 3 / 5, chỉ số LUT mới, cột `scenario` (V15), `eval/list?scenario=`, thẻ "Đánh giá" có bộ lọc "Kịch bản" và badge "tinh chỉnh" | [tinh-chinh-goi-y.md](tinh-chinh-goi-y.md) |
