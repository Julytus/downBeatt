# Task: dac-trung-mau — backend (agy, thay Codex)

Plan: plan/dac-trung-mau.md (đã duyệt 10/11/2026). Đọc §1 → §5, §7, §9 (TC loại unit TC-01 → TC-09).

Lát này backend do **agy** làm (Codex hết quota, người dùng quyết). Quy tắc backend giữ nguyên: `AGENTS.md`, `backend/AGENTS.md` (chỗ nào ghi "Codex" thì hiểu là bạn). Một worker agy khác làm frontend **song song trong cùng worktree**: cấm `git stash/reset/checkout/clean`, không đụng `frontend/**`.

## Target
- Package `vn.aeoc.business.lut` (module `business`, đã có `LutRepository`, `LutService`…) thêm gói con `feature`; sửa nhỏ ở `base` (ErrorCode), `entity` (POJO), `authenticate` (`FileStorageService`).
- Migration `V6__dac_trung_mau.sql` (bảng mới `lut_color_feature` → **phải sinh lại jOOQ** sau khi Flyway tạo bảng).

## Việc cần làm (đúng §7, đường dẫn tính từ `backend/`)
1. `app/src/main/resources/db/migration/V6__dac_trung_mau.sql`: chép nguyên khối SQL ở plan §4. Chạy `sh scripts/ai/backend-restart.sh` (Flyway tạo bảng) → `cd backend && mvn -q -DskipTests package` (sinh jOOQ `LUT_COLOR_FEATURE`, `LutColorFeatureRecord`).
2. `base/.../constant/ErrorCode.java`: thêm `LUT_FILE_INVALID(400, "File .cube không hợp lệ")`.
3. `entity/.../data/mysql/lut/LutColorFeature.java`: POJO `@Data @JsonInclude(NON_NULL)` đủ cột §4 (camelCase: `lutId`, `brightness`, `contrast`, `saturation`, `warmth`, `tint`, `shadowA`, `shadowB`, `highlightA`, `highlightB`, `isMono` kiểu `Integer`, `computedTime` kiểu `LocalDateTime`); `@JsonIgnore` trên `id`. JSON `computedTime` dạng `"2026-11-10T09:15:02"` như §5.
4. `entity/.../data/mysql/lut/Lut.java`: thêm `private LutColorFeature colorFeature;` và `private String featureError;` (không phải cột DB, comment "chỉ trả ở /lut/feature/**"). API công khai `/lut/public/**` không bao giờ set 2 field này (TC-18).
5. `authenticate/.../service/FileStorageService.java`: thêm `byte[] readPrivate(String key)` đọc object ở `privateBucket` (`downbeat-lut`). Lỗi MinIO → ném exception để service bắt và đổi thành `featureError` "Không đọc được file .cube".
6. `business/.../lut/feature/CubeLut.java`: `record CubeLut(int size, double[] data)` — `data` dài `3·N³`, đã đổi thang domain, thứ tự R nhanh nhất.
7. `business/.../lut/feature/CubeParser.java`: lớp thuần (không Spring), `static CubeLut parse(InputStream in)`, **đúng từng quy tắc §5.3**, message lỗi đúng từng chữ (bảng §5.3), luôn `new AppException(ErrorCode.LUT_FILE_INVALID, "<message>")`.
8. `business/.../lut/feature/ColorFeatureExtractor.java`: lớp thuần, `static LutColorFeature extract(CubeLut lut)` theo §7 mục 8: lưới mẫu 17³ (`s = (N − 1) / 16`), cắt màu ra về [0, 1], sRGB → Lab (ma trận D65, `f(t)`, trắng chuẩn 0.95047 / 1.0 / 1.08883 — thiết kế `docs/tai-lieu-thiet-ke.md` §7.2.4), 10 đặc trưng theo bảng §4. `contrast` dùng **độ lệch chuẩn tổng thể** (chia n); `saturation` chỉ trên điểm `C_vào > 10`; vùng tối `L_vào < 30`, vùng sáng `L_vào > 70`; `isMono = mean(C_ra) < 5 ? 1 : 0`. Không làm tròn.
9. `business/.../lut/repository/LutColorFeatureRepository.java` `extends AbsMysqlRepository<LutColorFeatureRecord, LutColorFeature, Integer>`: `upsert(LutColorFeature)` (`insertInto … onDuplicateKeyUpdate`, đặt `computed_time = now()` cả khi insert lẫn update), `getByLutIds(List<Integer>)` (một truy vấn `IN`), `getLutIdsWithFeature()`.
10. `business/.../lut/repository/LutRepository.java`: thêm `adminList(keyword, style, status, hasFeature, pageable)` + `adminCount(...)` dùng chung `getAdminCondition(...)` (keyword LIKE trên `title` hoặc `slug`, escape `\ % _` — `keyword=%` phải ra 0; `hasFeature` bằng `DSL.exists(selectOne().from(LUT_COLOR_FEATURE)…)`), lấy cột §5.1 + `creator_name` (JOIN `creator`), **mọi trạng thái**, thứ tự `LUT.ID.asc()`; `getAdminByIds(ids)` (cùng cột); `getWithFile()` (LUT có `file_key`). Đặt tên chung, không gắn "feature" (lát `quan-ly-lut` dùng lại).
11. `business/.../lut/service/LutColorFeatureService.java` `extends BaseService<LutColorFeatureRepository, LutColorFeature, Integer>` (inject thêm `LutRepository`, `FileStorageService`):
    - `Page<Lut> list(...)`: `page` mặc định 1, `limit` mặc định 10, > 100 → 100; gắn `colorFeature` cho cả trang bằng **một** lần `getByLutIds`.
    - `List<Lut> recompute(List<Integer> ids)`: §5.2 — mảng rỗng = `getWithFile()`; có id không tồn tại → `AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT")` **trước khi** đọc file nào; rồi từng LUT độc lập (không gói chung transaction), lỗi → `featureError` ("LUT chưa có file .cube" · "Không đọc được file .cube" · message `LUT_FILE_INVALID`), LUT lỗi giữ dòng cũ và trả kèm `colorFeature` cũ nếu có. Kết quả theo `id` ASC.
    - `public LutColorFeature computeAndSave(Integer lutId, byte[] cube)`: parse + extract + upsert, ném `LUT_FILE_INVALID` nếu file hỏng (không bắt lỗi — lát `quan-ly-lut` gọi khi upload).
12. `business/.../lut/service/LutColorFeatureBootstrap.java`: `@Component`, `@EventListener(ApplicationReadyEvent.class)`, cờ `lut.feature.compute-on-startup` (mặc định `true`, khai báo trong `application.yml`); chỉ tính LUT có `file_key` **chưa có** đặc trưng; bắt mọi lỗi (kể cả MinIO chưa lên), log cảnh báo kèm slug + lý do; cuối cùng log đúng `Đặc trưng màu: đã tính X LUT, lỗi Y LUT`; không ném exception ra ngoài.
13. `business/.../lut/controller/LutFeatureController.java` `extends BaseController`, `URI = "/lut/"`, `checkPermission` đầu tiên: `GET /lut/feature/list` (VIEW; tham số `keyword`, `style`, `status`, `hasFeature`, `page`, `limit`), `POST /lut/feature/recompute` body `@RequestBody List<Integer>` (UPDATE).

## Ràng buộc
- Hợp đồng §5 cố định: path, field, kiểu, mã lỗi, message nguyên văn (§5.3, §5.4). Item list/recompute **chỉ** có các khoá `id, slug, title, creatorName, style, status, coverUrl, lutSize, colorFeature, featureError` (NON_NULL) — không `description`, `fileKey`, …
- `colorFeature` đủ 12 khoá: `lutId, brightness, contrast, saturation, warmth, tint, shadowA, shadowB, highlightA, highlightB, isMono, computedTime`.
- Quyết định đã chốt (§7 cuối): lưới 17³ cho mọi kích thước; độ lệch chuẩn tổng thể; không làm tròn; LUT lỗi giữ dòng cũ; mảng rỗng = tất cả; list gồm mọi trạng thái; khởi động chỉ tính LUT chưa có.
- Không sửa migration cũ (V1 → V5). Không `@Idempotent`, không Kafka.

## Unit test bắt buộc (JUnit 5 + AssertJ + Mockito; file .cube dựng trong code bằng hàm sinh, không đọc file ngoài repo)
- `business/src/test/java/vn/aeoc/business/lut/feature/CubeParserTest.java`: TC-05, TC-06
- `business/src/test/java/vn/aeoc/business/lut/feature/ColorFeatureExtractorTest.java`: TC-01 → TC-04
- `business/src/test/java/vn/aeoc/business/lut/service/LutColorFeatureServiceTest.java`: TC-07, TC-08
- `business/src/test/java/vn/aeoc/business/lut/service/LutColorFeatureBootstrapTest.java`: TC-09
Tên method test bắt đầu bằng ID, ví dụ `tc01_identityAllSizes`.

## Phạm vi được sửa
Chỉ `backend/**`. Không sửa `plan/**`, `frontend/**`, `tools/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt, không dán log đầy đủ)
1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có TC-01 → TC-09.
2. `sh scripts/ai/backend-restart.sh` → "backend sẵn sàng", Flyway áp `6`, log có `Đặc trưng màu: đã tính 38 LUT, lỗi 0 LUT` (lần restart sau: `đã tính 0 LUT, lỗi 0 LUT`).
3. Test hợp đồng có sẵn (Claude viết, KHÔNG sửa): `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/dac-trung-mau.spec.ts -g "API" --reporter=line` → dán dòng `N passed / M failed`. Phải xanh 9/9 (TC-12 so 5 LUT với bảng tham chiếu §4, ±0,01).
