# Task: bo-suu-tap — backend (agy)

Plan: plan/bo-suu-tap.md (đã duyệt 10/11/2026). Đọc §1, §2, §3, §4, §5, §7, §9 (TC loại unit: TC-01 → TC-08).

## Target
Package mới `vn.aeoc.business.collection` (`controller`, `service`, `repository`) trong module `business`; sửa thêm `base` (ErrorCode), `entity` (POJO `LutCollection`, `CollectionItem`), `business.lut` (`LutService`). Migration `V9__bo_suu_tap.sql` (V8 là mới nhất).

## Việc cần làm (theo plan §7)
1. `backend/app/src/main/resources/db/migration/V9__bo_suu_tap.sql`: bảng `collection` và `collection_item` đúng §4 — FK `user_app(id)` / `collection(id)` / `lut(id)` đều `ON DELETE CASCADE`; cột `collection.name VARCHAR(100) NOT NULL COLLATE utf8mb4_0900_as_ci`; `updated_time ... ON UPDATE CURRENT_TIMESTAMP`; UNIQUE `uq_collection_user_name (user_id, name)`; index `idx_collection_user (user_id, updated_time)`; PK `collection_item (collection_id, lut_id)`, index `idx_collection_item_lut (lut_id)`; `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`, `CREATE TABLE IF NOT EXISTS`. Không seed. Restart → build để jOOQ sinh `COLLECTION`, `COLLECTION_ITEM`.
2. `ErrorCode`: `COLLECTION_LIMIT(403, "Gói Miễn phí lưu được tối đa 3 bộ sưu tập")`, `COLLECTION_NAME_EXISTS(400, "Bạn đã có bộ sưu tập tên này")`. 404 dùng `DATA_NOT_FOUND` với message riêng: "Không tìm thấy bộ sưu tập" / "Không tìm thấy LUT".
3. `entity/.../data/mysql/collection/LutCollection.java` (ánh xạ bảng `collection`; tên lớp **`LutCollection`**): `id, userId, name, createdTime, updatedTime` + field không thuộc bảng `lutId` (chỉ đọc từ request), `itemCount`, `coverUrls` (`List<String>`), `containsLut` (`Boolean`), `luts` (`List<Lut>`). `@JsonInclude(NON_NULL)`. `CollectionItem.java`: `collectionId, lutId, createdTime`.
4. `collection/repository/CollectionRepository extends AbsMysqlRepository<CollectionRecord, LutCollection, Integer>`: `listByUser(userId)` (sắp `updated_time DESC, id DESC`), `getOwned(id, userId)`, `countByUser(userId)`, `existsName(userId, name, excludeId)`, `updateName(id, name)`, `touch(id)` (`UPDATE collection SET updated_time = NOW()`); bảng nối viết tay: `addItem(collectionId, lutId)` (`insertInto … onDuplicateKeyIgnore()`, trả số dòng), `removeItem(collectionId, lutId)` (trả số dòng), `publishedItems(collectionIds)` → `(collectionId, lutId, coverUrl)` JOIN `lut` `status = 'PUBLISHED'`, sắp `collection_item.created_time DESC, lut.id DESC`, `collectionIdsContaining(collectionIds, lutId)`.
5. `business/lut/service/LutService.java`: thêm `listPublishedByIds(List<Integer> ids)` → LUT `PUBLISHED` theo **đúng thứ tự `ids`**, cùng shape item của `POST /lut/public/list` (đã `enrich` thẻ, danh mục, `creatorName`; không `fileKey`, không `status`); và `isPublished(Integer id)` (id null → false). `business.collection` không gọi thẳng `LutRepository`.
6. `collection/service/CollectionService extends BaseService<CollectionRepository, LutCollection, Integer>`: `myList(userId, lutId)`, `get(userId, id)`, `upsert(userId, body, today)`, `delete(userId, id)`, `addItem(userId, item)`, `removeItem(userId, item)` theo **đúng thứ tự quy tắc** §5.1 → §5.6:
   - `upsert` tạo (`id` null hoặc `<= 0`): trim `name` → có `lutId` thì `isPublished` (không → 404 "Không tìm thấy LUT") → không có gói (`SubscriptionService.findActiveByUserId(userId, today) == null`) và `countByUser >= free-limit` → `COLLECTION_LIMIT` → `existsName(userId, name, null)` → `COLLECTION_NAME_EXISTS` → một transaction: insert collection (`id`, `userId` từ token, thời gian do DB đặt — bỏ mọi giá trị client gửi) + có `lutId` thì `addItem`. `DuplicateKeyException` → `COLLECTION_NAME_EXISTS`. Response có `lutId` thì `containsLut: true`.
   - `upsert` đổi tên (`id > 0`): `getOwned` (null → 404 "Không tìm thấy bộ sưu tập") → `existsName(userId, name, id)` → `COLLECTION_NAME_EXISTS` → `updateName`. Không kiểm giới hạn, bỏ qua `lutId`, response không có `containsLut`.
   - `addItem`: `getOwned` → 404 bộ sưu tập (chưa kiểm LUT) → `isPublished` → 404 LUT → `addItem`; trả 1 thì `touch`. Response `containsLut: true`.
   - `removeItem`: `getOwned` → 404 bộ sưu tập; **không** kiểm LUT; `removeItem` trả 1 thì `touch`. Response `containsLut: false`.
   - `delete`: `getOwned` → 404; xoá cứng; trả id.
   - `myList`: 1 câu lấy bộ, 1 câu `publishedItems` cho mọi bộ (gom `itemCount` + 4 `coverUrls` đầu trong Java), 1 câu `collectionIdsContaining` khi có `lutId`. **Không N+1.** Không `lutId` → `containsLut` null (không xuất khoá).
   - `get`: như một phần tử `myList` (không `containsLut`) + `luts` = `listPublishedByIds` theo thứ tự `publishedItems`.
   - Giới hạn đọc `@Value("${collection.free-limit:3}")`. Response luôn `userId = null`.
   - Ghi nhiều bảng bằng `@Transactional` (gọi từ controller, không gọi nội bộ cùng bean) hoặc `TransactionTemplate`.
7. `collection/controller/CollectionController extends BaseController`: `GET /collection/my-list?lutId=`, `GET /collection/get?id=` (`@RequestParam(required = false)`; thiếu → 404 "Không tìm thấy bộ sưu tập"), `POST /collection/update` (body `LutCollection`), `POST /collection/delete/{id}`, `POST /collection/item/add`, `POST /collection/item/remove` (body `CollectionItem`). `SecurityUtils.userId(principal)`, `LocalDate.now()`. **Không** `checkPermission`.
8. `application.yml`: `collection.free-limit: 3`.

## Ràng buộc
- Hợp đồng §5 cố định: path, field, kiểu, mã lỗi, message nguyên văn §5.7. Thời gian dạng `yyyy-MM-ddTHH:mm:ss`.
- Không tự đổi (plan §7 cuối): tên lớp `LutCollection`; bộ của người khác trả **404** không phải 403; xoá **cứng**; tên so theo collation `utf8mb4_0900_as_ci` của cột (không `LOWER()` trong Java); thêm trùng / bỏ không có là no-op 200; `itemCount` / `coverUrls` / `luts` chỉ tính LUT `PUBLISHED` nhưng **không** xoá dòng `collection_item` của LUT bị ẩn; giới hạn chỉ áp lúc **tạo**; **không** thêm `/collection/**` vào whitelist; không trả `userId`; không N+1 ở `my-list`.
- Backend không kiểm `name` rỗng / quá 100 ký tự (frontend kiểm).
- Không sửa migration cũ. Không resource / permission mới. Không `@Idempotent`, Kafka.
- Cấm `git stash/reset/checkout/clean` (worktree dùng chung).

## Phạm vi được sửa
Chỉ `backend/**`. Frontend do worker khác làm song song trong cùng worktree. Spec `frontend/tests/e2e/bo-suu-tap.spec.ts` là hợp đồng nghiệm thu — đọc, không sửa.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, `N passed / M failed` — không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có `CollectionServiceTest` phủ TC-01 → TC-08 (§9; mock `CollectionRepository`, `LutService`, `SubscriptionService`, `new QueryExecutor(Runnable::run)`). Ghi tên test ↔ TC trong báo cáo.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp V9. Backend local chạy cổng **9500** (`backend/.env`).
3. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/bo-suu-tap.spec.ts -g "API" --reporter=line --workers=1` → dán dòng `N passed / M failed` (mong đợi 14 passed, TC-09 → TC-22; TC-13 gọi payOS thật bằng khoá trong `backend/.env`). Test đỏ thì sửa code, không sửa spec; thấy spec mâu thuẫn plan thì hỏi (question).
4. Chạy lại `E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/kho-lut.spec.ts tests/e2e/quan-ly-lut.spec.ts -g "API" --reporter=line --workers=1` để chắc sửa `LutService` không phá lát trước.
