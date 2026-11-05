# DownBeat — Đồ án: ứng dụng thương mại điện tử

Monorepo: `backend/` (Spring Boot 3.2, Java 21, jOOQ, MySQL) · `frontend/` (React 19, Vite, TanStack, Playwright).
Base hiện tại chỉ có luồng đăng nhập (backend `authenticate`) + trang quản trị `/admin` (frontend; `/` là trang chủ cửa hàng, kho LUT ở `/luts`); module `business` trống, chờ các chức năng ecom.
Danh sách plan: `plan/README.md`. Các plan cũ trong `plan/` thuộc dự án AEOC (hoá đơn, khách hàng thân thiết), chỉ để tham khảo cách viết.

## Vai trò

| Ai | Làm gì | Được sửa |
|---|---|---|
| **Claude** (Opus 5.5, effort high) | Lập plan + test case, giao việc qua Orca, theo dõi, review, chạy E2E, viết tài liệu | `plan/**`, `docs/**`, `frontend/tests/e2e/**`, file hướng dẫn (`CLAUDE.md`, `AGENTS.md`), `scripts/ai/**`, skill của worker `.agents/skills/**` |
| **Codex** (worker Orca `--agent codex`, GPT-6 Luna, effort medium) | Code backend theo plan | `backend/**`, `tools/seed/**` (script nạp dữ liệu mẫu) |
| **agy** (worker Orca `--agent antigravity`, Gemini 3.8 Flash High) | Code frontend theo plan | `frontend/**` trừ `frontend/tests/e2e/**` |

Claude **không tự viết code nghiệp vụ** ở `backend/src` hay `frontend/src`, trừ khi người dùng bảo. Lỗi tìm được khi review thì giao lại cho worker kèm bằng chứng. Như vậy người code và người kiểm tra luôn là hai bên khác nhau.

Quy tắc cho worker nằm ở `AGENTS.md` (chung), `backend/AGENTS.md`, `frontend/AGENTS.md`. Khi review, Claude dùng chính các file đó làm checklist.

## Luồng làm việc

```
/plan-feature <slug>   → plan/<slug>.md (status: draft) + test case
        │  người dùng đọc, sửa, nói "duyệt"  → status: approved
        ▼  (/clear rồi mới cook, để ngữ cảnh lập plan không lẫn vào)
/cook <slug>            — phiên A (plan approved)
  1. Preflight: Orca, Docker (MySQL/Redis…), backend :9200
  2. Claude viết frontend/tests/e2e/<slug>.spec.ts từ test case (nhóm "API" phủ mọi endpoint §5 + lỗi §5.4)
  3. Orca giao song song: Codex ← plan/tasks/<slug>-be.md · agy ← plan/tasks/<slug>-fe.md → dừng
        ▼  /clear
/cook <slug>            — phiên B (plan in-progress, §12 "phiên A xong")
  4. Theo dõi hộp thư: trả lời câu hỏi, nhận worker_done
  5. Review BE (diff, mvn test, restart, E2E -g "API") → còn lỗi thì giao bản sửa cho Codex
  6. Review FE (diff, build, lint) → còn lỗi thì giao bản sửa cho agy
  7. E2E có giao diện (--headed, slowMo) + chụp ảnh tài liệu → lỗi thì phân loại BE/FE rồi giao lại
  8. Giải phóng worker, ghi §12 "phiên B xong"
        ▼  /clear
/doc-chuc-nang <slug>   — phiên C (Sonnet)
  docs/chuc-nang/<slug>.md, plan status: done, commit + push + mở PR vào main (người dùng tự merge)
```

Chia phiên vì mỗi lượt gọi tool gửi lại toàn bộ ngữ cảnh; §12 của plan là nhật ký nối các phiên. Chi tiết từng bước nằm trong skill: `.claude/skills/plan-feature/SKILL.md`, `.claude/skills/cook/SKILL.md`, `.claude/skills/doc-chuc-nang/SKILL.md`.

## Quy ước thư mục

- `plan/<slug>.md`: một plan cho **một lát chức năng** (BE + FE + test), đủ nhỏ để mỗi worker làm một lượt. `slug` là kebab-case không dấu, ví dụ `cua-hang`, `khach-hang-nhap-excel`. Mẫu: `plan/_template.md`.
- `plan/tasks/<slug>-{be,fe}[-fixN].md`: task spec đã giao cho worker. Đây là vết giao việc nên giữ lại, không xoá.
- `docs/chuc-nang/<slug>.md`: tài liệu chức năng để viết báo cáo. Mẫu: `docs/chuc-nang/_template.md`. Ảnh nằm ở `docs/chuc-nang/img/<slug>/`.

Trạng thái plan (frontmatter `status`): `draft` → `approved` → `in-progress` → `done` (hoặc `blocked`). Chỉ người dùng mới duyệt; Claude chỉ đổi sang `approved` khi người dùng nói rõ là duyệt.

## Lệnh hay dùng

```bash
sh scripts/ai/backend-restart.sh                    # build + restart backend :9200, in dòng Flyway
docker compose -f docker-compose.local.yml --env-file backend/.env up -d   # MySQL / Redis / MinIO / Mailpit local (container downBeat-*)
cd backend && mvn -q "-Djooq.codegen.skip=true" -pl <module> -am test
cd frontend && pnpm build && pnpm lint
cd frontend && E2E_SLOWMO=400 pnpm test:e2e tests/e2e/<slug>.spec.ts --headed --workers=1 --reporter=line
```

Orca (cheat sheet, task spec mẫu, cách xử lý sự cố): `.claude/skills/cook/references/orca.md`.

## Quy tắc chung

- Hợp đồng API ở §5 của plan là nguồn sự thật cho cả hai bên. Cần đổi thì Claude sửa plan trước, rồi báo cho cả hai worker.
- Không commit, push hay đổi branch khi người dùng chưa bảo. Ngoại lệ đã được cho phép sẵn: `/doc-chuc-nang` tự commit, push branch feature và mở PR vào `main`; không bao giờ tự merge hay push thẳng vào `main`. Hai worker dùng chung một worktree, nên cấm mọi lệnh `git stash/reset/checkout/clean`.
- Báo cáo, tài liệu và text giao diện viết bằng tiếng Việt.
- Một cửa hàng duy nhất: không có bảng `branch`, cột `bsn_id` hay `BsnScope`. Phân quyền quản trị bằng `role` + `permission` + `resource` (cấp qua migration).
- Ghi dữ liệu đồng bộ, đơn giản: không dùng `@Idempotent` / header `Idempotency-Key` / Kafka (đã gỡ). Chống trùng bằng ràng buộc DB + kiểm tra ở service.
- Tài khoản local: `admin@downbeat.local` / `Admin@123` (toàn quyền), `noaccess@downbeat.local` / `Admin@123` (không quyền).
