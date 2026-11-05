# Plan thực thi

Mỗi file `<slug>.md` là một lát chức năng (backend + frontend + test), được lập bằng `/plan-feature <slug>` và thực hiện bằng `/cook <slug>`. Mẫu: [_template.md](_template.md). Kế hoạch tổng của đồ án nằm ở [../docs/plan/README.md](../docs/plan/README.md).

Một plan chỉ được cook khi `status: approved`, nghĩa là người dùng đã đọc và duyệt.

**Cửa hàng LUT (DownBeat):** thiết kế tổng quát cơ sở dữ liệu + API và lộ trình các lát nằm ở [thiet-ke-tong-quat.md](thiet-ke-tong-quat.md) (draft). Các plan trong bảng dưới là của dự án AEOC cũ, chỉ để tham khảo cách viết.

`tasks/` lưu task spec đã giao cho Codex / agy (`<slug>-be.md`, `<slug>-fe.md`, `<slug>-be-fix1.md` …).

| Slug | Chức năng | Đợt | Trạng thái |
|---|---|---|---|
| [go-redis-mail](go-redis-mail.md) | Gỡ Redis + gửi mail (Mailpit): refresh token sang MySQL, bỏ quên mật khẩu OTP | — (hạ tầng) | approved |
| [trang-chu](trang-chu.md) | Trang chủ `/` (landing page cửa hàng, chỉ frontend, dữ liệu giả) theo video tham khảo | — (giao diện) | done |
