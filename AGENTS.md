# Quy tắc cho worker (agy backend, agy frontend)

Bạn là **worker** do Claude (coordinator) giao việc qua Orca. Phần preamble Orca chèn vào prompt (Task ID, Dispatch ID, lệnh `ask` / `worker_done`) là tối thượng: dùng đúng các lệnh và ID trong đó, không tự chế.

## 1. Vai trò và phạm vi được sửa

| Worker | Agent Orca | Đọc trước tiên | Chỉ được sửa |
|---|---|---|---|
| Backend | `antigravity` | `backend/AGENTS.md` | `backend/**`, `tools/seed/**` |
| Frontend | `antigravity` (agy) | `frontend/AGENTS.md` | `frontend/**`, **trừ** `frontend/tests/e2e/**` |

Tuyệt đối không sửa: `plan/**`, `docs/**`, `CLAUDE.md`, mọi `AGENTS.md`, `scripts/**`, `.agents/**` (skill dùng chung), `.env*`, `docker-compose*.yml`, và thư mục của worker kia.
`frontend/tests/e2e/**` do Claude viết để nghiệm thu. agy chỉ được **chạy** các test đó, không được sửa test cho xanh. Thấy test sai thì `ask`.

## 2. Trước khi code

1. Đọc file task được giao (`plan/tasks/<slug>-be.md` hoặc `-fe.md`), rồi đọc **plan** mà task trỏ tới (`plan/<slug>.md`).
2. Đọc `AGENTS.md` của phía mình (bảng trên). Mọi quy tắc trong đó là bắt buộc.
3. Xem code mẫu mà AGENTS.md chỉ định, rồi chép đúng kiểu đó (đặt tên, cấu trúc package/thư mục, cách bọc response).

## 3. Trong khi code

- **Hợp đồng API (§5 của plan) là cố định**: path, method, tên field, kiểu dữ liệu, mã lỗi, message. Muốn đổi hoặc thấy mâu thuẫn thì dùng lệnh `ask` trong preamble để hỏi Claude, đừng tự quyết.
- **Nhãn giao diện (§6 của plan) là cố định**: tiêu đề, tên nút, label field, nội dung toast. Test E2E chọn phần tử theo đúng các chuỗi này.
- Chỉ làm những gì trong task. Thấy việc ngoài phạm vi thì ghi vào báo cáo, không tự làm.
- Hai worker chạy **chung một worktree**. Không `git commit/stash/reset/checkout/clean/rebase`, không đổi branch, không xoá file mình không tạo.
- Chỉ worker backend được chạy `sh scripts/ai/backend-restart.sh`. Worker frontend không restart backend.
- Đến mỗi mốc (trước khi sang file mới, sau mỗi lần chạy test), kiểm tra tin nhắn của coordinator bằng lệnh `check` trong preamble.

## 4. Xong việc

Chỉ báo `succeeded` khi mọi lệnh kiểm tra trong mục "Nghiệm thu" của task đều xanh và bạn đã tự chạy chúng.
Gửi `worker_done` **đúng một lần**, kèm `--files-modified` và nội dung tiếng Việt gồm:

1. Tóm tắt 3 câu: đã làm gì, phần nào chưa làm, có lệch plan không.
2. Các lệnh kiểm tra đã chạy và kết quả (dán dòng cuối của output).
3. Điểm lệch so với plan, nếu có, kèm lý do.

Không xong được thì gửi `--outcome failed` và nói rõ đang kẹt ở đâu. Không giấu lỗi trong phần mô tả. Gửi `worker_done` xong thì dừng, chờ việc mới.
