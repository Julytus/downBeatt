# Task: seed-minio — backend (agy)

Plan: plan/seed-minio.md (đã duyệt 14/11/2026). Đọc §1, §3, §4, §5 (khoá object, dòng log, cách sinh nội dung), §7, §9 (TC loại `unit` và bảng giá trị tham chiếu).

## Target

- Module `business`, package mới `vn.aeoc.business.lut.seed`.
- Module `authenticate`: thêm 2 hàm vào `FileStorageService`.
- Resource mới `backend/business/src/main/resources/seed/kho-lut/` (luts.json + 38 ảnh + 2 video + README).
- `tools/seed/kho-lut/build.py` + `tools/seed/kho-lut/README.md`.
- Không migration. Không endpoint mới. Không sửa `V3_1__seed_kho_lut.sql`.

## Việc cần làm (theo đúng thứ tự plan §7)

1. **Dữ liệu nguồn**
   - `git mv tools/seed/kho-lut/luts.json backend/business/src/main/resources/seed/kho-lut/luts.json` (phải là rename trong git, không chép).
   - Chép 38 file `tools/seed/kho-lut/.cache/*.jpg` → `.../seed/kho-lut/photos/`, `flower.mp4`, `friday.mp4` → `.../seed/kho-lut/videos/`. Tên file giữ nguyên (đã đúng `picsumSeed` / `videoSource`).
   - `README.md` 3 dòng: nguồn ảnh (picsum.photos, giấy phép Unsplash), nguồn video (MDN, CC0), giấy phép.
   - Kiểm mỗi `picsumSeed` trong `luts.json` có đúng một ảnh, mỗi `videoSource` có video. Thiếu thì `ask` Claude, **không** tải từ mạng.
2. **`build.py`**: đọc `luts.json` từ chỗ mới; ảnh / video gốc ưu tiên lấy từ `photos/` / `videos/` mới, chỉ thiếu mới tải về `.cache` như cũ. Không đổi gì khác. `python tools/seed/kho-lut/build.py --self-test` in `OK`. README của tool thêm đoạn ở plan §7 mục 2 (nguyên văn).
3. **`FileStorageService`**: thêm `boolean existsPublic(String key)` (khuôn `existsPrivate`, bucket công khai; `NoSuchKey` → `false`, lỗi khác → `AppException(ErrorCode.UPLOAD_FILE_FAILED)`) và `String publicBucket()`. Không đổi chữ ký hàm khác.
4. **`SeedManifest`**: POJO Jackson, chỉ các field ở plan §7 mục 4, `id` chuỗi → `Integer`, bỏ qua field lạ.
5. **`CubeFilter`** (thuần Java): `parse`, `apply`, `grid` (`[b][g][r][c]`), `writeCube` đúng định dạng §5.3 (`%.6f`, `Locale.ROOT`, `\n` cuối, UTF-8 không BOM, `"` trong title đổi thành `'`). Ma trận chép nguyên văn từ hàm `transform` trong `build.py`, áp các phép theo đúng thứ tự xuất hiện. Không dùng lại `recommend.eval.sim.CubeWriter`.
6. **`SeedImageRenderer`** (thuần Java, `java.awt` + `ImageIO`, headless): `before` (1280 × 720 bilinear), `after` (trilinear như `apply_cube`), `cover` (960 × 540, dải đen 40 % ở y 430 → 540, chữ hoa tại (40, 500), `Font.SANS_SERIF` đậm 36 px, màu (245, 197, 66) khi style `bold`, còn lại trắng, bật khử răng cưa). JPEG chất lượng 0.85. Mỗi LUT chỉ đọc ảnh gốc và tính `after` một lần.
7. **`SeedAssetLoader`** (`@Component`): `@Value("${seed.minio.enabled:false}")`, `@EventListener(ApplicationReadyEvent.class)` + `@Order(-100)`, chạy đồng bộ. Thứ tự và quy tắc đúng plan §7 mục 7:
   - khoá lấy từ phần URL sau `/{publicBucket}/` của `cover_url` / `before_url` / `after_url` / `preview_video_url` và từ `file_key` của dòng DB, chỉ khi khớp mẫu ở bảng §5.1 (URL ảnh upload kiểu `.../2026/11/14/<uuid>.jpg` thì bỏ qua trường đó);
   - chỉ đẩy object **thiếu**, không ghi đè; chỉ sinh `grid` / `after` khi LUT thật sự thiếu `.cube` / `after` / `cover`;
   - `.cube` dùng `title` trong manifest, không lấy từ DB;
   - try/catch theo LUT (log E2) và toàn hàm (log E1); dòng log tổng kết **nguyên văn** §5.2.
8. **Cấu hình** (bảng §4): `application.yml` thêm `seed.minio.enabled: false` kèm chú thích; `application-local.yml` thêm `${SEED_MINIO_ENABLED:true}`. Lưu ý `application.yml` đang có sẵn thay đổi chưa commit của người dùng: chỉ **thêm** khoá, không đụng dòng khác.
9. **Unit test** (`business/src/test/java/vn/aeoc/business/lut/seed/`): TC-01 → TC-15 ở §9, tên method / `@DisplayName` bắt đầu bằng ID TC. Giá trị tham chiếu (4 dòng `.cube`, kích thước 970341 / 970344 byte, `friday.mp4` 515198 byte) lấy từ bảng §9.

## Ràng buộc

- Khoá object, content-type, dòng log ở §5 cố định từng chữ.
- Quyết định đã chốt ở cuối §7 (chỉ đẩy object thiếu, khoá từ DB, mặc định tắt, không endpoint nạp lại, không đụng `V3_1`): không tự đổi.
- Không `@Async`, không thread riêng (quy tắc `backend/AGENTS.md`).
- Không `git stash/reset/checkout/clean` (dùng chung worktree với người dùng).

## Phạm vi được sửa

`backend/**` và `tools/seed/**`. Không có worker frontend lần này. Không sửa `frontend/**`, `plan/**`, `docs/**`.

## Nghiệm thu (tự chạy; worker_done chỉ dán dòng tóm tắt — `Tests run`, `BUILD`, dòng log — không dán log đầy đủ)

1. `cd backend && mvn -q "-Djooq.codegen.skip=true" -pl business -am test` xanh, có TC-01 → TC-15.
2. `sh scripts/ai/backend-restart.sh` → backend sẵn sàng, log có dòng `Nạp dữ liệu mẫu MinIO: 38 LUT, đã có … object, đã nạp … object, bỏ qua … LUT, lỗi 0 LUT` (máy này MinIO đã đủ nên mong đợi "đã có 148 object, đã nạp 0 object"). Dán nguyên dòng đó.
3. `python tools/seed/kho-lut/build.py --self-test` in `OK`; `git status --short tools/seed backend/business/src/main/resources/seed | head` cho thấy `luts.json` là rename.
4. `cd frontend && E2E_SKIP_WEBSERVER=1 pnpm test:e2e tests/e2e/seed-minio.spec.ts -g "API" --reporter=line` xanh 3/3 (spec do Claude viết, không sửa).
