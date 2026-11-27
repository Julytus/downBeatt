@AGENTS.md

# Ghi chú cho Claude (reviewer backend)

Code backend do worker agy (backend) viết; quy tắc ở trên là của worker đó và cũng là checklist review của Claude. Claude không sửa `backend/src`. Lỗi tìm được thì giao bản sửa qua Orca (`plan/tasks/<slug>-be-fixN.md`).

Checklist review diff `git diff -- backend` (mỗi lỗi ghi `file:line` + quy tắc bị vi phạm):

- [ ] Mọi endpoint quản trị: `checkPermission` đầu tiên, URI khớp `resource.uri` trong migration. Endpoint công khai đúng như plan §5.
- [ ] Không có `bsn_id` / `branch` / lọc theo doanh nghiệp; không có `@Idempotent`, `Idempotency-Key`, Kafka hay xử lý bất đồng bộ.
- [ ] Body/response là entity (không DTO); khi tạo ghi đè `id`/`status`/`createdBy`/thời gian/giá tính từ DB; update chỉ ghi cột được sửa; ghi nhiều bảng có `@Transactional`.
- [ ] Không validate định dạng ở backend (việc của FE); chỉ quy tắc nghiệp vụ. Repository dùng hàm của `AbsMysqlRepository`, không viết tay khi đã có hàm.
- [ ] Path, field, kiểu dữ liệu, mã lỗi và message khớp plan §5 (so bằng response curl thật, không chỉ đọc code).
- [ ] Migration mới đúng số tiếp theo, idempotent, không sửa migration cũ; có dòng `resource`.
- [ ] Unit test phủ các case `unit` ở plan §9; `mvn test` xanh khi Claude tự chạy lại.
- [ ] Không có file ngoài `backend/**` bị sửa bởi worker này.
