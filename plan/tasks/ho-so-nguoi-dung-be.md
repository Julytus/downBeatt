# Task: ho-so-nguoi-dung — backend (agy)

Plan: plan/ho-so-nguoi-dung.md (đã duyệt 2026-11-10). Đọc §2, §3, §4, §5, §7, §9 (TC loại `unit`: TC-01 → TC-15; bảng số liệu tính tay ở §9.1).

## Target
- `business.recommend` (mới: sự kiện, hồ sơ, controller), `business.account` (sở thích + record `account/event/UserSignalChangedEvent`), `entity`, `base` (ErrorCode), `authenticate` (token tuỳ chọn ở đường dẫn `/public/`).
- Phát sự kiện xoá cache từ `business.download` / `collection` / `billing` (§5.7).
- Migration `app/src/main/resources/db/migration/V11__ho_so_nguoi_dung.sql` (đúng SQL ở §4).

## Việc cần làm
Làm đúng 13 mục ở plan §7, theo thứ tự:
1. Migration V11 → restart → `mvn -q -DskipTests package` sinh `USER_PREFERENCE`, `USER_EVENT`.
2. `ErrorCode.PREFERENCE_INVALID(400, "Lựa chọn không hợp lệ")`.
3. Entity `UserPreference`, `UserEvent` (`eventType` ↔ JSON `type`), `UserSignal`, `RecommendProfile`, `ProfileTerm`.
4. `RecommendProperties` + khối `recommend:` trong `application.yml` (§7 mục 4, giữ nguyên tên khoá).
5. `LutVectorIndex`: `tagDictionary()`, `categoryDictionary()`, `styleSet()`, `slug(id)`; `listPublishedForIndex()` thêm `slug`.
6. `LutService.existsPublishedStyle`, `activeIdsBySlugs` (một câu `IN`).
7. `UserPreferenceRepository`, `PreferenceService` (§5.2 đúng thứ tự 6 bước), `GET` / `POST /account/preference` trong `AccountController`.
8. `UserEventRepository`, `EventService` (`record` §5.3 đúng thứ tự 8 bước, `mergeAnon`, `clearHistory`, `cleanup` @Scheduled 00:30), 3 hàm tín hiệu ở `CollectionRepository` / `DownloadLogRepository` / `PaymentOrderRepository` (+ service tương ứng).
9. `UserSignalChangedEvent` + phát đúng chỗ §5.7 + `UserProfileCacheListener` (`@TransactionalEventListener(AFTER_COMMIT, fallbackExecution = true)`). Sửa test cũ cho constructor mới.
10. `recommend/profile`: `UserProfile`, `ProfileBuilder.build(...)` (Java thuần, 10 bước ở §7 mục 10), `UserProfileService` (Caffeine 5 phút, `maximumSize(10_000)`, tính lại khi `LutIndexService.current()` đổi, `evict`, `summary` → `RecommendProfile` §5.4).
11. `RecommendController`: `POST /recommend/public/event`, `/recommend/public/profile`, `/recommend/merge-anon`, `/recommend/clear-history`. Không `checkPermission`.
12. `JwtAuthenticationFilter`: ở đường dẫn công khai, token hợp lệ → gắn principal; thiếu / sai / hết hạn → đi tiếp không principal, **không** 401.
13. Unit test TC-01 → TC-15 (JUnit 5 + AssertJ + Mockito, không dựng Spring; kho 3 LUT dùng `RecommendFixtures.create3Luts()`).

## Ràng buộc
- Hợp đồng §5 cố định: path, field JSON (`type`, `categorySlugs`, `strategy`, `alpha`, `positiveLutCount`, `preference`, `topStyles` / `topCategories` / `topTags` `{key, weight}`, `signals` `{type, lutId, slug, value, count, days, weight}`), làm tròn (alpha / weight 4 chữ số, days 2), cách sắp, message nguyên văn.
- `event` luôn 200 + `true` / `false`; `profile` không bao giờ lỗi nghiệp vụ; hồ sơ rỗng đúng mẫu cuối §5.4 (mọi mảng `[]`, `alpha` 0.0).
- `signals` của `profile` chỉ gồm cặp ĐÃ DÙNG (sau lọc §7 mục 10.2 và giới hạn 200), không có `userId` / `anonId`.
- Các "Quyết định đã chốt" ở cuối §7: không tự đổi.
- Không thêm resource / migration phân quyền; không `@Async`; không gọi thẳng bean `recommend` từ `download` / `collection` / `billing` (chỉ phát sự kiện). Không sửa migration cũ.
- Unique `uk_user_preference (user_id, category_id)`; xoá cứng. Cột `user_event.value` COLLATE `utf8mb4_0900_as_cs`.

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Cấm `git stash/reset/checkout/clean`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, status HTTP — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" test 2>&1 | grep -E "Tests run|FAIL|ERROR|BUILD" | tail -20` xanh, có test cho TC-01 → TC-15 (tên test ghi ID TC).
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V11. `SHOW CREATE TABLE user_event` có `COLLATE utf8mb4_0900_as_cs` ở cột `value`.
3. Nhóm API của spec nghiệm thu (Claude viết sẵn, KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/ho-so-nguoi-dung.spec.ts -g "API" --reporter=line 2>&1 | tail -40` → dán dòng `N passed / M failed` (TC-27 được phép `skipped` nếu không có mạng tới payOS).
4. Dán response `POST /api/recommend/public/profile` của một anonId sau 3 VIEW (xanh-dem, da-lat-suong, bang-gia) và của một tài khoản sau `POST /api/account/preference ["phim-nhua","am-ap"]`.
