---
title: Tải LUT — kiểm gói, đóng gói .zip, link ký sẵn 5 phút, ghi lượt tải, hộp thoại "LUT tương tự"
slug: tai-lut
status: done   # draft → approved → in-progress → done | blocked
dot: docs/plan/README.md §1.5 (thiết kế §4.6, §5.4, §5.7, §6.3; thiet-ke-tong-quat §6.2)
module_be: business.download   # + base (ErrorCode), entity (POJO DownloadLog), authenticate (FileStorageService), business.lut (LutRepository)
resource_code: —      # API khách, chỉ cần token; không tạo resource
created: 2026-11-10
approved: 2026-11-10
---

# Tải LUT

## 1. Mục tiêu và phạm vi

Sau plan này, **khách đã đăng nhập tải được LUT thật**: bấm "Tải" thì backend kiểm LUT đã xuất bản và (với LUT ★) gói trả phí còn hạn, đóng file .cube trong bucket riêng tư thành một file `.zip` theo cấu trúc của file mẫu người dùng đưa, trả link MinIO ký sẵn sống 5 phút, ghi `download_log` và tăng `download_count` bằng một câu UPDATE. Tải xong, cửa hàng hiện hộp thoại "Đã tải xong" có hướng dẫn dùng và 4 "LUT tương tự".

**Định dạng file tải về** (theo file mẫu `Cinematic-Teal-LUT-Studio-Orange.zip` người dùng đưa, bên trong chỉ có `Cinematic-Teal-LUT/Assets/Cinematic-Teal.cube`):

```
Xanh-Dien-Anh-LUT-DownBeat.zip
└── Xanh-Dien-Anh-LUT/
    └── Assets/
        └── Xanh-Dien-Anh.cube      ← đúng từng byte file .cube đang lưu trong bucket downbeat-lut
```

| Có làm (lát này) | Không làm (để plan khác) |
|---|---|
| Migration `V8__tai_lut.sql`: bảng `download_log` | Xoá cache hồ sơ gợi ý sau khi tải (thiết kế §6.3 quy tắc 6) → lát `ho-so-nguoi-dung` (2.2), vì chưa có hồ sơ |
| `POST /lut/download` (401, 404, 403 `PLAN_REQUIRED`, 503 `LUT_FILE_UNAVAILABLE`) | Lịch sử "LUT đã tải" của khách, tải lại từ lịch sử |
| Đóng gói `.zip` lần đầu tải rồi giữ trong bucket riêng tư (dùng lại cho lần sau) | Thống kê lượt tải ở quản trị → lát `dashboard-admin` (4.1); lượt tải gần đây của khách → `quan-tri-don-hang` |
| Link MinIO ký sẵn 5 phút, tên file tải về do backend đặt | "LUT tương tự" theo độ tương đồng nội dung → lát `chi-muc-tuong-dong` (2.1) đổi ruột `related`, hộp thoại không phải sửa |
| Frontend: bỏ bản giả `requestLutDownload`, nút "Tải" gọi API thật, 403 mở hộp thoại nâng cấp, hộp thoại "Đã tải xong" + "LUT tương tự", lượt tải trên trang cập nhật ngay | Giới hạn số lượt tải (đã chốt: không giới hạn ở mọi gói) |
| | Link ký sẵn cho môi trường deploy qua nginx `/s3/` (§11 câu 2) |

## 2. Tác nhân và phân quyền

| Tác nhân | Được làm | Ghi chú |
|---|---|---|
| Khách vãng lai | — | Bấm "Tải" → hộp thoại đăng ký (đã có); gọi thẳng API → 401 |
| Người đã đăng nhập, gói Miễn phí (mọi role, kể cả admin chưa mua gói) | Tải LUT thường đã xuất bản | Không kiểm resource, chỉ cần token |
| Người đã đăng nhập có subscription `ACTIVE`, `end_date >= hôm nay`, gói `can_download_premium = 1` (Pro, Studio) | Tải mọi LUT đã xuất bản, kể cả LUT ★ | |

Không tạo resource, không có migration phân quyền. `/lut/download` không khớp mẫu công khai `^/[a-z0-9-]+/public/.*` của `JwtAuthenticationFilter` nên tự động cần token; **không** thêm vào whitelist. Controller không gọi `checkPermission` (giống `order/create`).

## 3. Luồng nghiệp vụ

**Luồng chính — khách Miễn phí tải LUT thường ở trang chi tiết:**
1. Khách đăng nhập, mở `/luts/xanh-dien-anh`, bấm "Tải miễn phí" (nút quay spinner).
2. `POST /api/lut/download { lutId: 1 }`. Backend lấy LUT `PUBLISHED` id 1; không phải ★ nên không kiểm gói.
3. Backend dựng tên gốc `Xanh-Dien-Anh` từ tiêu đề, khoá zip `zip/lut/xanh-dien-anh/Xanh-Dien-Anh-LUT-DownBeat.zip`. Chưa có object này trong bucket riêng tư → đọc `lut/xanh-dien-anh.cube`, nén thành zip (§5.2), ghi vào bucket riêng tư.
4. Backend ký URL GET cho object zip, sống 300 giây, kèm `response-content-disposition: attachment; filename="Xanh-Dien-Anh-LUT-DownBeat.zip"`.
5. Trong một transaction: INSERT `download_log (user_id, lut_id = 1, plan_code = 'free', ip)` và `UPDATE lut SET download_count = download_count + 1 WHERE id = 1`.
6. Trả `{ fileName: "Xanh-Dien-Anh-LUT-DownBeat.zip", url: "http://localhost:9020/downbeat-lut/zip/...?X-Amz-...&X-Amz-Expires=300&..." }`.
7. Trình duyệt tải file (thẻ `<a>` tạm, không rời trang). Hộp thoại "Đã tải xong" mở: thẻ LUT, tên file, cách dùng, 4 "LUT tương tự". "Lượt tải" trên trang tăng 1.

**Luồng thay thế:**
- A1. Khách Pro / Studio tải LUT ★ (`kodak-400`): bước 2 thêm kiểm gói, `plan_code` ghi `pro` / `studio`.
- A2. Lần tải sau của cùng LUT (bất kỳ khách nào): object zip đã có → bỏ qua bước 3, chỉ ký URL mới. Mỗi lần bấm đều ghi một dòng `download_log` và tăng `download_count` (không chống lặp, không giới hạn).
- A3. Quản trị sửa tiêu đề hoặc tải file .cube mới: tên gốc hoặc `file_key` đổi → khoá zip đổi → lần tải kế tiếp tự đóng gói lại. Zip cũ nằm lại trong bucket (không dọn, §11 câu 3).
- A4. Chưa đăng nhập bấm "Tải" → hộp thoại đăng ký kèm thẻ LUT (đã có); đăng ký / đăng nhập xong tự tải tiếp (đã có ở `shop-dialogs.tsx`, giờ gọi API thật).
- A5. Tải từ nút tải trên thẻ LUT ở lưới `/luts` (hiện khi rê chuột): cùng hook, cùng hộp thoại.
- A6. Trong hộp thoại "Đã tải xong", bấm "Tải lại" (trình duyệt chặn / khách lỡ huỷ): gọi lại `POST /lut/download`, tính thêm một lượt.

**Ngoại lệ:**
- E1. Không token / token hết hạn mà refresh hỏng → 401 (filter trả `errorCode` `LOGIN`, "Chưa đăng nhập"). Interceptor có sẵn xoá phiên; hook mở hộp thoại đăng nhập kèm thẻ LUT.
- E2. `lutId` không có, thiếu, hoặc LUT không `PUBLISHED` (`DRAFT`, `HIDDEN`) → 404 `DATA_NOT_FOUND` "Không tìm thấy LUT". Không ghi log.
- E3. LUT ★ mà khách không có gói trả phí còn hạn (kể cả dòng `ACTIVE` có `end_date` đã qua vì tác vụ 00:10 chưa chạy) → 403 `PLAN_REQUIRED` "LUT Premium cần gói Pro hoặc Studio". Không ghi log. Giao diện mở hộp thoại "Nâng cấp để tải LUT Premium" (trường hợp phiên trên trình duyệt còn ghi gói cũ).
- E4. LUT `PUBLISHED` nhưng `file_key` NULL, hoặc MinIO không đọc / ghi / ký được (ví dụ máy mới chưa nạp file lên MinIO, xem đề xuất lát `seed-minio`) → 503 `LUT_FILE_UNAVAILABLE` "File LUT đang không sẵn sàng, vui lòng thử lại sau". Không ghi log, không tăng lượt tải. Log ERROR có `lutId` và khoá object.

```mermaid
sequenceDiagram
  actor K as Khách
  participant FE as Frontend
  participant BE as Backend
  participant DB as MySQL
  participant S3 as MinIO (downbeat-lut, riêng tư)
  K->>FE: "Tải miễn phí" / "Tải LUT Premium"
  FE->>BE: POST /lut/download { lutId }
  BE->>DB: lut WHERE id = ? AND status = 'PUBLISHED'
  alt LUT ★
    BE->>DB: subscription ACTIVE, end_date >= hôm nay, plan.can_download_premium = 1
    BE-->>FE: 403 PLAN_REQUIRED (nếu không có)
    FE->>K: hộp thoại "Nâng cấp để tải LUT Premium"
  end
  BE->>S3: statObject zip/<file_key bỏ .cube>/<Tên>-LUT-DownBeat.zip
  opt chưa có zip
    BE->>S3: getObject <file_key>
    BE->>BE: nén <Tên>-LUT/Assets/<Tên>.cube
    BE->>S3: putObject zip (application/zip)
  end
  BE->>S3: ký URL GET 300 giây (+ response-content-disposition)
  BE->>DB: INSERT download_log; UPDATE lut SET download_count = download_count + 1
  BE-->>FE: { fileName, url }
  FE->>S3: <a href=url> (trình duyệt tải thẳng từ MinIO)
  FE->>K: hộp thoại "Đã tải xong" + "LUT tương tự"
```

## 4. Cơ sở dữ liệu

Migration: `V8__tai_lut.sql` (V7 là mới nhất). Không có seed. Số `download_count` của 36 LUT mẫu là số giả có sẵn từ V3_1, không có dòng `download_log` tương ứng (giữ nguyên).

**`download_log`**

| Cột | Kiểu | Ràng buộc / ghi chú |
|---|---|---|
| id | int PK AUTO_INCREMENT | (bắt buộc cho `AbsMysqlRepository`) |
| user_id | int NOT NULL | FK → `user_app(id)` |
| lut_id | int NOT NULL | FK → `lut(id)` (LUT đã có lượt tải không xoá được, chỉ ẩn — luật có sẵn ở `LutAdminService.delete`) |
| plan_code | varchar(20) NOT NULL | Gói lúc tải: `free` / `pro` / `studio` (để thống kê tỉ lệ ★ ở `dashboard-admin`) |
| ip | varchar(45) NULL | Phần tử đầu của `X-Forwarded-For` (trim), không có thì `request.getRemoteAddr()`; cắt 45 ký tự |
| created_time | datetime NOT NULL DEFAULT CURRENT_TIMESTAMP | |

Index: `idx_download_log_user (user_id, created_time)`, `idx_download_log_lut (lut_id, created_time)`. Không UNIQUE (mỗi lần bấm là một dòng). Xoá: không có thao tác xoá.

`lut.download_count` có sẵn (V3). Không thêm cột cho zip: khoá zip **suy ra** từ `file_key` + tiêu đề (§5.2), nên không phải đồng bộ cột khi quản trị sửa LUT.

## 5. Hợp đồng API (cố định — nguồn sự thật cho cả BE và FE)

Thành công: `{ "code": 200, "message": "OK", "result": … }`. Lỗi nghiệp vụ: `{ "path", "code", "errorCode", "message" }`. POJO `NON_NULL`.

### 5.1 `POST /api/lut/download` — cần đăng nhập

Request (body là POJO `DownloadLog`, chỉ đọc `lutId`; mọi khoá khác bị bỏ qua):
```json
{ "lutId": 1 }
```
Response `result` (chỉ hai khoá này, không trả `id`, `userId`, `planCode`, `ip`, `fileKey`):
```json
{
  "fileName": "Xanh-Dien-Anh-LUT-DownBeat.zip",
  "url": "http://localhost:9020/downbeat-lut/zip/lut/xanh-dien-anh/Xanh-Dien-Anh-LUT-DownBeat.zip?response-content-disposition=attachment%3B%20filename%3D%22Xanh-Dien-Anh-LUT-DownBeat.zip%22&response-content-type=application%2Fzip&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=minioadmin%2F20261110%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20261110T031530Z&X-Amz-Expires=300&X-Amz-SignedHeaders=host&X-Amz-Signature=3f1c…"
}
```

Quy tắc (theo thứ tự, gặp lỗi đầu tiên thì dừng):
1. Lấy LUT theo `lutId` với `status = 'PUBLISHED'`. Không có (kể cả `lutId` null) → 404 `DATA_NOT_FOUND` "Không tìm thấy LUT".
2. `is_premium = 1`: lấy subscription của khách bằng `SubscriptionRepository.findActiveByUserId(userId, hôm nay)` (đã lọc `ACTIVE` + `end_date >= hôm nay`), rồi gói của nó; không có, hoặc `can_download_premium != 1` → 403 `PLAN_REQUIRED` "LUT Premium cần gói Pro hoặc Studio". `planCode` để ghi log = `plan.code` của subscription đó, không có subscription thì `free` (LUT thường cũng ghi đúng gói đang dùng).
3. `file_key` NULL → 503 `LUT_FILE_UNAVAILABLE`.
4. Đảm bảo có zip (§5.2), rồi ký URL (§5.3). Lỗi MinIO ở bất kỳ bước nào → 503 `LUT_FILE_UNAVAILABLE`.
5. Ghi log + tăng lượt tải trong **một** transaction, **sau** bước 4 (MinIO lỗi thì không có dòng log nào): `INSERT download_log`, `UPDATE lut SET download_count = download_count + 1 WHERE id = ?` (một câu, không đọc rồi ghi). Không gọi `@Transactional` nội bộ cùng bean (dùng `TransactionTemplate` hoặc tách bean).
6. Trả `{ fileName, url }`.

### 5.2 Đóng gói zip

**Tên gốc** `base` từ `lut.title`:
1. `đ` → `d`, `Đ` → `D`; bỏ dấu (`StringUtils.stripAccents`).
2. Mỗi chuỗi ký tự ngoài `[A-Za-z0-9]` → một dấu `-`; bỏ `-` ở hai đầu. **Giữ nguyên chữ hoa / thường** của tiêu đề.
3. Cắt tối đa 60 ký tự rồi bỏ `-` ở cuối nếu có. Rỗng → `LUT-{id}`.

| `title` | `base` | `fileName` |
|---|---|---|
| Xanh Điện Ảnh | `Xanh-Dien-Anh` | `Xanh-Dien-Anh-LUT-DownBeat.zip` |
| Đà Lạt Sương | `Da-Lat-Suong` | `Da-Lat-Suong-LUT-DownBeat.zip` |
| Kodak 400 | `Kodak-400` | `Kodak-400-LUT-DownBeat.zip` |
| Retro 1970 | `Retro-1970` | `Retro-1970-LUT-DownBeat.zip` |
| `  !!! ` (id 37) | `LUT-37` | `LUT-37-LUT-DownBeat.zip` |

**Nội dung zip**: đúng **một** entry `{base}-LUT/Assets/{base}.cube` (không có entry thư mục, giống file mẫu), nén DEFLATE, byte của `.cube` giữ nguyên như trong bucket. Content-type object: `application/zip`.

**Khoá object** trong bucket riêng tư `downbeat-lut`: `zip/{file_key bỏ đuôi .cube}/{fileName}`.
- `lut/xanh-dien-anh.cube` → `zip/lut/xanh-dien-anh/Xanh-Dien-Anh-LUT-DownBeat.zip`
- `lut/37/9b2f…e1.cube` (file tải lên ở `/admin/luts`) → `zip/lut/37/9b2f…e1/<Tên>-LUT-DownBeat.zip`

Có object (`statObject`) thì dùng lại; chưa có thì đọc `.cube`, nén trong bộ nhớ, `putObject`. Hai lượt tải đầu tiên chạy cùng lúc có thể cùng ghi một khoá: nội dung như nhau nên chấp nhận, không khoá.

### 5.3 Ký URL

- `MinioClient.getPresignedObjectUrl`, `Method.GET`, bucket riêng tư, khoá zip, `expiry` = `lut.download.url-ttl` (mặc định `5m` → `X-Amz-Expires=300`).
- `extraQueryParams`: `response-content-disposition` = `attachment; filename="{fileName}"`, `response-content-type` = `application/zip` (trình duyệt lưu đúng tên dù link khác origin).
- Ký bằng `MinioClient` hiện có (`minio.endpoint`): local là `http://localhost:9020`, trình duyệt tải thẳng được. Deploy: §11 câu 2.
- Bucket riêng tư không có policy đọc công khai (đã kiểm ở `kho-lut` TC-23), nên URL bỏ chữ ký → MinIO trả 403.

### 5.4 Lỗi nghiệp vụ

| Tình huống | HTTP | errorCode | message (nguyên văn) |
|---|---|---|---|
| Không token / token sai | 401 | `LOGIN` / `UNAUTHORIZED` (filter có sẵn) | "Chưa đăng nhập" / "Token không hợp lệ hoặc sai chữ ký" |
| LUT không có / chưa xuất bản / đã ẩn / thiếu `lutId` | 404 | `DATA_NOT_FOUND` | Không tìm thấy LUT |
| LUT ★, không có gói trả phí còn hạn | 403 | `PLAN_REQUIRED` | LUT Premium cần gói Pro hoặc Studio |
| Thiếu `file_key` hoặc MinIO lỗi | 503 | `LUT_FILE_UNAVAILABLE` | File LUT đang không sẵn sàng, vui lòng thử lại sau |

Lệch so với thiết kế §5.7: 401 dùng phản hồi có sẵn của filter ("Chưa đăng nhập") thay cho "Vui lòng đăng nhập để tải LUT" (giao diện không đọc message 401, chỉ mở hộp thoại đăng nhập); `LUT_FILE_UNAVAILABLE` là mã mới.

## 6. Giao diện (chuỗi cố định — test E2E chọn theo đúng các chuỗi này)

### 6.1 Nút tải (sửa `use-lut-download.ts`, giữ nguyên nhãn đang có)

- Nhãn giữ nguyên: trang chi tiết "Tải miễn phí" / "Tải LUT Premium"; thẻ ở lưới giữ nút tải hiện có. Đang gọi API: spinner trên đúng nút, nút `disabled`.
- Luồng bấm (giữ thứ tự hiện có): chưa đăng nhập → hộp thoại đăng ký kèm thẻ LUT; LUT ★ + phiên ghi gói Miễn phí → hộp thoại nâng cấp (không gọi API); còn lại → `POST /lut/download`.
- Thành công: tải file bằng thẻ `<a href={url}>` tạm (không mở tab mới, không rời trang), **không** hiện toast thành công nữa (hộp thoại thay), mở hộp thoại §6.2, invalidate query `["luts", "detail", slug]` và `["luts", "list"]` để "Lượt tải" cập nhật.
- Lỗi theo `errorCode` của response:
  - `PLAN_REQUIRED` → mở hộp thoại "Nâng cấp để tải LUT Premium" (có sẵn), không toast.
  - HTTP 401 → mở hộp thoại đăng nhập kèm thẻ LUT (`{ type: "login", lut }`), không toast.
  - Còn lại (404, 503, mạng) → toast lỗi: message của server nếu có (ví dụ "File LUT đang không sẵn sàng, vui lòng thử lại sau", "Không tìm thấy LUT"), không có thì "Không tải được LUT, vui lòng thử lại".

### 6.2 Hộp thoại "Đã tải xong" (mới, loại `downloaded` trong `ShopDialogs`)

Dùng khung hộp thoại chung của cửa hàng (thẻ LUT nhỏ ở đầu, nút "Đóng" góc trên).

| Phần | Nội dung |
|---|---|
| Đầu | `LutMiniCard` của LUT vừa tải |
| Tiêu đề (`DialogTitle`) | "Đã tải xong" |
| Mô tả (`DialogDescription`) | "{fileName} đã được lưu vào thư mục Tải xuống." (tên file in đậm) |
| Khối "Cách dùng" | Tiêu đề nhỏ "Cách dùng", danh sách đánh số: "Giải nén file .zip, file LUT nằm trong thư mục Assets." · "Kéo file .cube vào Premiere Pro, DaVinci Resolve, Final Cut Pro hoặc CapCut." |
| Dòng phụ | "Không thấy file?" + nút chữ "Tải lại" (gọi lại tải như §6.1; đang gọi thì spinner, hộp thoại giữ nguyên) |
| Khối "LUT tương tự" | Tiêu đề nhỏ "LUT tương tự"; `GET /lut/public/related?slug={slug}&page=1&limit=4`; lưới 2 cột (`ul` có `aria-label="LUT tương tự"`), mỗi ô: ảnh bìa 16:9, tiêu đề, tác giả, sao ★ nếu Premium; cả ô là link tới `/luts/{slug}`, bấm thì đóng hộp thoại. Đang tải: 4 ô `Skeleton`. Lỗi hoặc rỗng: ẩn cả khối (không báo lỗi). |
| Chân | Nút phụ "Xem thêm LUT" (→ `/luts`, đóng hộp thoại) · nút chính "Đóng" |

Trên điện thoại (≤ 640 px) hộp thoại chiếm gần hết chiều rộng, lưới "LUT tương tự" vẫn 2 cột, cuộn được trong hộp thoại (khung chung đã có `max-h` + `overflow-y-auto`).

### 6.3 Không đổi

- Hộp thoại đăng ký / đăng nhập / nâng cấp: giữ nguyên chữ và luồng.
- Trang chi tiết, mục "Định dạng": giữ ".cube (3D LUT, 33×33×33)" (test `kho-lut` đang kiểm chuỗi này).

## 7. Việc backend (agy BE)

Package mới `vn.aeoc.business.download` (`controller`, `service`, `repository`). Thứ tự theo `backend/AGENTS.md`:

1. `backend/app/src/main/resources/db/migration/V8__tai_lut.sql`: bảng `download_log` §4 (FK, 2 index). Chạy jOOQ codegen để có `DownloadLog`.
2. `base/.../ErrorCode.java`: thêm `PLAN_REQUIRED(403, "LUT Premium cần gói Pro hoặc Studio")`, `LUT_FILE_UNAVAILABLE(503, "File LUT đang không sẵn sàng, vui lòng thử lại sau")`.
3. `entity`: POJO `DownloadLog` sinh ra; thêm field không thuộc bảng `fileName`, `url` cho response. Response chỉ ra `fileName`, `url` (đặt các field còn lại null trước khi trả, hoặc chọn khoá như lát `quan-ly-lut`).
4. `authenticate/.../FileStorageService.java`: thêm `existsPrivate(String key)` (`statObject`, `ErrorResponseException` mã `NoSuchKey` → false, lỗi khác ném), `presignPrivateGet(String key, Duration ttl, String downloadName, String contentType)`. Dùng lại `readPrivate`, `putPrivate` có sẵn. Lỗi MinIO trong hàm mới → `AppException(ErrorCode.LUT_FILE_UNAVAILABLE)` (không đổi hành vi hàm cũ).
5. `business/lut/repository/LutRepository.java`: `getPublishedById(Integer id)` (cột `id, title, is_premium, file_key, slug`, `status = 'PUBLISHED'`), `increaseDownloadCount(Integer id)` = `UPDATE lut SET download_count = download_count + 1 WHERE id = ?` (một câu).
6. `download/repository/DownloadLogRepository extends AbsMysqlRepository<DownloadLogRecord, DownloadLog, Integer>`: dùng `insert` có sẵn.
7. `download/service/LutPackage` (lớp tiện ích thuần, không Spring, để unit test): `baseName(String title, Integer id)`, `fileName(base)`, `zipKey(String fileKey, String fileName)`, `zip(String base, byte[] cube)` → `byte[]` (§5.2).
8. `download/service/LutDownloadService extends BaseService<DownloadLogRepository, DownloadLog, Integer>`: `download(Integer userId, Integer lutId, String ip, LocalDate today)` theo đúng thứ tự §5.1. Đọc subscription qua `SubscriptionRepository.findActiveByUserId`, gói qua `PlanRepository`. Ghi log + tăng lượt tải bằng `TransactionTemplate`.
9. `download/controller/LutDownloadController extends BaseController`: `@PostMapping("/lut/download")`, body `DownloadLog`, `SecurityUtils.userId(principal)`, IP lấy theo §4, `LocalDate.now()`.
10. `application.yml`: `lut.download.url-ttl: 5m`.

Quyết định worker không tự đổi: đóng gói zip đúng cấu trúc §5.2 (một entry, không thêm file khác); khoá zip suy ra từ `file_key` + `fileName`, **không** thêm cột; MinIO chạy **trước**, ghi DB **sau**; tăng lượt tải bằng một câu UPDATE; không giới hạn, không chống lặp lượt tải; không mở `/lut/download` trong whitelist; không trả `fileKey` hay khoá zip trong JSON.

Unit test bắt buộc: các TC loại `unit` ở §9 (mock `FileStorageService`, `SubscriptionRepository`, `PlanRepository` khi test service).

## 8. Việc frontend (agy FE)

1. `lib/types/account.ts`: `LutDownloadDTO { fileName: string; url: string }` (đã có, giữ), thêm `LutDownloadRequest { lutId: number }`.
2. `lib/axios/luts.ts` (hoặc `lib/axios/account.ts`, chọn một): `requestLutDownload(lutId)` → `POST /lut/download`.
3. `lib/tanstack/options/account.ts`: `lutDownloadMutationOptions` gọi API thật, **bỏ** `successMessage`, bỏ `errorMessage` cố định (lỗi xử lý ở hook theo §6.1). Xoá `requestLutDownload`, `buildCube` khỏi `lib/mock/account.ts`; xoá hẳn file nếu không còn gì dùng (`ApiError` thay bằng hàm đọc `errorCode` từ `AxiosError`; gom hàm đọc `errorCode` đang nằm trong `register-form.tsx` thành `lib/axios/error.ts` → `apiErrorOf(err): { status?, errorCode?, message? }` dùng chung).
4. `hooks/use-lut-download.ts`: §6.1 (thành công mở `{ type: "downloaded", lut, fileName }`, invalidate query; lỗi rẽ nhánh theo `errorCode` / status). Giữ `pendingId`.
5. `lib/stores/shop-dialog.ts`: thêm `| { type: "downloaded"; lut: LutDTO; fileName: string }`.
6. `components/shop/account/download-done-panel.tsx` (mới): nội dung §6.2. Dùng `createInfiniteRelatedLutsQueryOptions` có sẵn hoặc thêm `createRelatedLutsQueryOptions(slug, 4)` (`queryKey: ["luts", "related", slug, 4]`).
7. `components/shop/account/shop-dialogs.tsx`: `headingOf` thêm `downloaded` (tiêu đề / mô tả §6.2), render `DownloadDonePanel`.

Component shadcn dùng: có sẵn trong `components/ui/`: `dialog`, `skeleton`, `button`, `sonner`; dùng `ShopButton`, `LutMiniCard` của cửa hàng. Không cần `shadcn add`.

## 9. Test case

`api` / `e2e` do Claude viết ở `frontend/tests/e2e/tai-lut.spec.ts`.

**Dữ liệu test không đụng 36 LUT mẫu**: tải làm tăng `download_count`, mà `kho-lut.spec.ts` kiểm số lượt tải cố định của LUT mẫu (ví dụ `kodak-400` = 14980). Vì vậy spec tạo LUT riêng bằng API quản trị (chép helper `createPublished` của `quan-ly-lut.spec.ts`: tạo nháp, upload .cube 17³ + ảnh, 3 thẻ, 1 danh mục, xuất bản), mỗi lần chạy:
- **LUT T** (thường): tiêu đề "Đà Lạt Tải Thử", `isPremium` 0 → `fileName` "Da-Lat-Tai-Thu-LUT-DownBeat.zip".
- **LUT P** (★): tiêu đề "Băng Đêm Tải Thử", `isPremium` 1 → "Bang-Dem-Tai-Thu-LUT-DownBeat.zip".

Cuối spec ẩn hai LUT (`lut/hide/{id}`; không xoá được vì đã có lượt tải) để cửa hàng vẫn đủ 36 LUT. Khách Miễn phí: đăng ký mới (`newEmail()`). Khách Pro: đăng ký mới → `order/create` pro MONTH → `order/mock-pay` (như `goi-thanh-toan.spec.ts`). Đọc zip trong test: Node tự đọc local file header + `zlib.inflateRawSync` (không thêm thư viện).

| ID | Loại | Mô tả | Tiền điều kiện | Bước | Kết quả mong đợi |
|---|---|---|---|---|---|
| TC-01 | unit | Tên gốc từ tiêu đề | | `LutPackage.baseName` với 5 dòng bảng §5.2; thêm tiêu đề 80 ký tự "Phim Nhựa " lặp lại | đúng 5 giá trị bảng §5.2; bản dài ≤ 60 ký tự, không kết thúc bằng `-` |
| TC-02 | unit | Khoá zip | | `zipKey("lut/xanh-dien-anh.cube", "Xanh-Dien-Anh-LUT-DownBeat.zip")`; `zipKey("lut/37/9b2f.cube", "A-LUT-DownBeat.zip")` | `zip/lut/xanh-dien-anh/Xanh-Dien-Anh-LUT-DownBeat.zip`; `zip/lut/37/9b2f/A-LUT-DownBeat.zip` |
| TC-03 | unit | Nội dung zip | `cube` = 3 dòng mẫu | `zip("Kodak-400", cube)` rồi đọc bằng `ZipInputStream` | đúng 1 entry `Kodak-400-LUT/Assets/Kodak-400.cube`, byte bằng `cube`, method DEFLATED |
| TC-04 | unit | 404 trước mọi bước khác | `getPublishedById` trả null | `download(u, 999999, …)` và `download(u, null, …)` | `DATA_NOT_FOUND` "Không tìm thấy LUT"; không gọi `FileStorageService`, không insert |
| TC-05 | unit | Luật gói với LUT ★ | hôm nay 2026-11-10 | (a) không subscription; (b) Pro `end_date` 2026-11-10; (c) Studio end 2026-12-01; (d) `findActiveByUserId` trả null vì end 2026-11-09 | (a) `PLAN_REQUIRED`; (b) cho tải, log `plan_code` "pro"; (c) cho tải, "studio"; (d) `PLAN_REQUIRED`; (a), (d) không gọi MinIO, không insert |
| TC-06 | unit | LUT thường ghi đúng gói đang dùng | khách Pro còn hạn | tải LUT thường | thành công, log `plan_code` "pro"; khách không có gói → "free" |
| TC-07 | unit | Zip đã có thì không đóng gói lại | `existsPrivate` = true | `download` | không gọi `readPrivate` / `putPrivate`; gọi `presignPrivateGet(zipKey, 5 phút, fileName, "application/zip")` |
| TC-08 | unit | Zip chưa có thì đóng gói | `existsPrivate` = false | `download` | `readPrivate(file_key)` 1 lần, `putPrivate(zipKey, <zip>, "application/zip")` 1 lần, rồi ký |
| TC-09 | unit | MinIO lỗi thì không ghi DB | (a) `file_key` null; (b) `readPrivate` ném; (c) `presignPrivateGet` ném | `download` | cả 3: `LUT_FILE_UNAVAILABLE`; không insert `download_log`, không gọi `increaseDownloadCount` |
| TC-10 | api | Không token | | `POST lut/download { lutId: T }` không header | 401 |
| TC-11 | api | LUT không có / chưa xuất bản / đã ẩn | khách Miễn phí | `lutId` 999999; `lutId` thiếu (`{}`); id LUT `thu-nghiem-nhap` (DRAFT); id `hoang-hon-cu` (HIDDEN) | cả 4: 404 `DATA_NOT_FOUND` "Không tìm thấy LUT" |
| TC-12 | api | Khách Miễn phí tải LUT thường | khách Miễn phí; đọc `downloadCount` của T qua `lut/public/get` = n | `POST lut/download { lutId: T }` | 200; `result` chỉ có 2 khoá `fileName`, `url`; `fileName` "Da-Lat-Tai-Thu-LUT-DownBeat.zip"; `url` bắt đầu `http://localhost:9020/downbeat-lut/zip/lut/`, có `X-Amz-Expires=300`, có `response-content-disposition`; `lut/public/get` → `downloadCount` = n + 1 |
| TC-13 | api | Link tải được đúng file | sau TC-12 | `GET url` (request không token) | 200; header `content-type` `application/zip`; `content-disposition` chứa `filename="Da-Lat-Tai-Thu-LUT-DownBeat.zip"`; body bắt đầu `PK\x03\x04`; đúng 1 entry `Da-Lat-Tai-Thu-LUT/Assets/Da-Lat-Tai-Thu.cube`; giải nén ra đúng byte file .cube spec đã upload |
| TC-14 | api | Bỏ chữ ký thì không tải được | sau TC-12 | `GET` phần `url` trước dấu `?` | 403 (bucket riêng tư) |
| TC-15 | api | Không giới hạn, mỗi lần một lượt, zip dùng lại | khách Miễn phí; `downloadCount` T = n | tải T 2 lần liên tiếp | cả 2: 200; phần đường dẫn (trước `?`) của 2 `url` giống nhau; `downloadCount` = n + 2 |
| TC-16 | api | Khách Miễn phí tải LUT ★ | khách Miễn phí; `downloadCount` P = m | `POST lut/download { lutId: P }` | 403 `PLAN_REQUIRED` "LUT Premium cần gói Pro hoặc Studio"; `downloadCount` P vẫn = m |
| TC-17 | api | Khách Pro tải LUT ★ | khách Pro (mock-pay) | `POST lut/download { lutId: P }`; `GET url` | 200, `fileName` "Bang-Dem-Tai-Thu-LUT-DownBeat.zip"; file tải về có entry `Bang-Dem-Tai-Thu-LUT/Assets/Bang-Dem-Tai-Thu.cube`; `downloadCount` P = m + 1 |
| TC-18 | api | Sửa tiêu đề thì đóng gói lại | admin sửa tiêu đề T thành "Đà Lạt Tải Thử Mới" (`lut/update`) | khách tải T | `fileName` "Da-Lat-Tai-Thu-Moi-LUT-DownBeat.zip"; đường dẫn `url` khác TC-12; entry trong zip là `Da-Lat-Tai-Thu-Moi-LUT/Assets/Da-Lat-Tai-Thu-Moi.cube` |
| TC-19 | api | Đổi file .cube thì đóng gói lại | admin upload .cube khác (17³, khác byte) cho T | khách tải T | đường dẫn `url` khác lần trước; byte giải nén = file .cube mới |
| TC-20 | e2e | Tải LUT thường ở trang chi tiết | khách Miễn phí đăng nhập, mở `/luts/{slug T}`, đọc "Lượt tải" | bấm "Tải miễn phí" | sự kiện download, `suggestedFilename()` = "Da-Lat-Tai-Thu-LUT-DownBeat.zip"; hộp thoại "Đã tải xong" có "Da-Lat-Tai-Thu-LUT-DownBeat.zip đã được lưu vào thư mục Tải xuống.", "Cách dùng", "Giải nén file .zip, file LUT nằm trong thư mục Assets."; "Lượt tải" tăng 1 sau khi đóng hộp thoại (không tải lại trang); không có toast "Đã tải" |
| TC-21 | e2e | "LUT tương tự" trong hộp thoại | như TC-20, hộp thoại đang mở | xem khối "LUT tương tự" rồi bấm ô đầu tiên | `ul[aria-label="LUT tương tự"]` có 1–4 ô, không có ô nào là T; bấm → URL `/luts/{slug ô đó}`, hộp thoại đóng |
| TC-22 | e2e | "Tải lại", "Xem thêm LUT", "Đóng" | hộp thoại "Đã tải xong" đang mở | bấm "Tải lại"; rồi "Xem thêm LUT"; mở lại (tải lần nữa) rồi "Đóng" | "Tải lại" → thêm một sự kiện download cùng tên file; "Xem thêm LUT" → URL `/luts`, hộp thoại đóng; "Đóng" → hộp thoại đóng, URL không đổi |
| TC-23 | e2e | Tải từ thẻ ở lưới | khách Miễn phí, `/luts?q=Đà Lạt Tải Thử` | rê chuột vào thẻ T, bấm nút tải trên thẻ | sự kiện download "Da-Lat-Tai-Thu-LUT-DownBeat.zip"; hộp thoại "Đã tải xong" |
| TC-24 | e2e | Chưa đăng nhập: đăng ký xong tự tải | chưa đăng nhập, `/luts/{slug T}` | "Tải miễn phí" → hộp thoại đăng ký (có thẻ "Đà Lạt Tải Thử") → điền email mới, đăng ký | sau đăng ký: sự kiện download "Da-Lat-Tai-Thu-LUT-DownBeat.zip", hộp thoại "Đã tải xong" |
| TC-25 | e2e | Khách Miễn phí bấm LUT ★ | khách Miễn phí, `/luts/{slug P}` | đếm request `lut/download`; bấm "Tải LUT Premium" | hộp thoại "Nâng cấp để tải LUT Premium"; 0 request `lut/download`; không có sự kiện download |
| TC-26 | e2e | Phiên cũ ghi gói Pro, server từ chối | khách Miễn phí; `page.route` sửa `account/me` trả `plan: "pro"`, `planExpiresAt` hôm nay + 10 ngày | mở `/luts/{slug P}`, bấm "Tải LUT Premium" | có 1 request `lut/download` trả 403; hộp thoại "Nâng cấp để tải LUT Premium"; không toast lỗi; không có sự kiện download |
| TC-27 | e2e | Khách Pro tải LUT ★ | khách Pro đăng nhập, `/luts/{slug P}` | bấm "Tải LUT Premium" | sự kiện download "Bang-Dem-Tai-Thu-LUT-DownBeat.zip"; hộp thoại "Đã tải xong" |
| TC-28 | e2e | MinIO lỗi | khách Miễn phí; `page.route` cho `lut/download` trả 503 `{ errorCode: "LUT_FILE_UNAVAILABLE", message: "File LUT đang không sẵn sàng, vui lòng thử lại sau" }` | bấm "Tải miễn phí" | toast "File LUT đang không sẵn sàng, vui lòng thử lại sau"; không hộp thoại; nút hết spinner, bấm lại được |
| TC-29 | e2e | Hết phiên giữa chừng | khách Miễn phí đăng nhập; `page.route` cho `lut/download` và `auth/refresh` cùng trả 401 | bấm "Tải miễn phí" | hộp thoại đăng nhập (tiêu đề như hộp thoại đăng nhập hiện có) kèm thẻ "Đà Lạt Tải Thử"; header về trạng thái chưa đăng nhập |
| TC-30 | e2e | Hộp thoại trên điện thoại | viewport 390×844, như TC-20 | tải T | hộp thoại không tràn ngang (`findHorizontalOverflow` rỗng), khối "LUT tương tự" 2 cột, nút "Đóng" thấy được sau khi cuộn |

### 9.1 Đối chiếu

- Endpoint §5 → TC `api`: `POST lut/download` TC-10 → TC-19.
- Lỗi §5.4 → TC `api`: 401 TC-10 · 404 `DATA_NOT_FOUND` TC-11 · 403 `PLAN_REQUIRED` TC-16 · 503 `LUT_FILE_UNAVAILABLE` TC-09 (unit; API không làm MinIO hỏng được khi backend đang chạy) + TC-28 (giao diện).
- Luồng §3: chính TC-12, 13, 20 · A1 TC-17, 27 · A2 TC-15 · A3 TC-18, 19 · A4 TC-24 · A5 TC-23 · A6 TC-22 · E1 TC-10, 29 · E2 TC-11 · E3 TC-16, 25, 26 · E4 TC-09, 28.
- Ghi `download_log` (cột `plan_code`, `ip`): unit TC-05, 06 + Claude kiểm bằng SQL khi review (§10).

### 9.2 Sửa test cũ (Claude làm ở phiên A cùng lúc viết spec)

`shop-flows.spec.ts` (dòng ~236–310) và `tai-khoan-khach.spec.ts` (dòng ~396–418) đang dựa vào bản giả: chờ `suggestedFilename()` = "noir.cube" và toast "Đã tải …". Đổi sang "Noir-LUT-DownBeat.zip" và hộp thoại "Đã tải xong". Hai test này tải LUT mẫu `noir` thật nên `download_count` của `noir` tăng mỗi lần chạy; kiểm `kho-lut.spec.ts` không khẳng định số lượt tải của `noir` (hiện chỉ khẳng định `kodak-400`).

## 10. Tiêu chí hoàn thành

- [x] Mọi TC ở §9 pass; test cũ ở §9.2 pass sau khi sửa
- [x] `mvn test`, `pnpm build`, `pnpm lint` xanh
- [x] Sau E2E: `SELECT plan_code, ip, COUNT(*) FROM download_log GROUP BY plan_code, ip` có dòng `free` và `pro`, `ip` không rỗng
- [x] `grep -rn "requestLutDownload\|buildCube" frontend/src/lib/mock` rỗng
- [ ] File zip tải từ trình duyệt mở được bằng trình giải nén của Windows, kéo file .cube vào DaVinci Resolve / Premiere áp được (người dùng thử một lần, ảnh cho tài liệu)
- [x] Có `docs/chuc-nang/tai-lut.md`

## 11. Rủi ro / câu hỏi mở

**Người dùng duyệt 10/11/2026, giữ mọi phương án mặc định của plan:** (1) không thêm file vào zip · (2) link ký sẵn cho deploy để sang giai đoạn 6 · (3) không dọn zip cũ · (4) hộp thoại "Đã tải xong" sau mỗi lần tải · (5) "Tải lại" gọi lại API · (6) ghi lệch 401 vào tài liệu khi đóng lát.

1. **Tên file và cấu trúc zip**: plan chép đúng file mẫu (`{Tên}-LUT/Assets/{Tên}.cube`, đuôi tên zip là thương hiệu: `-LUT-DownBeat.zip` thay cho `-LUT-Studio-Orange.zip`). Tên lấy từ tiêu đề bỏ dấu, giữ hoa thường (`Xanh-Dien-Anh`). Có muốn thêm file khác vào zip (ví dụ `Huong-dan.txt` ghi cách cài và giấy phép theo gói) không? Plan hiện chọn **không**, giống file mẫu.
2. **Link ký sẵn ở môi trường deploy**: `minio.endpoint` của profile `dev` là `http://minio:9000` (tên trong mạng Docker), trình duyệt không mở được; file công khai đang đi qua nginx `/s3/`. Lát này chỉ bảo đảm chạy local (`localhost:9020`). Khi deploy cần thêm `minio.public-endpoint` + cấu hình nginx giữ `Host` cho `/s3/`, hoặc đổi sang backend tự phát file theo token. Đồng ý để sang lúc deploy (ghi vào giai đoạn 6)?
3. **Zip cũ không dọn**: sửa tiêu đề / đổi .cube để lại zip cũ trong bucket riêng tư (~0,3–1 MB mỗi bản). Với đồ án chấp nhận được; dọn khi cần bằng `mc rm --recursive downbeat-lut/zip/`. Chấp nhận?
4. **Hộp thoại "Đã tải xong" mở sau mỗi lần tải** (theo thiết kế §6.3). Khách tải nhiều LUT liên tiếp từ lưới sẽ phải đóng hộp thoại mỗi lần. Giữ như thiết kế, hay chỉ hiện ở trang chi tiết còn ở lưới thì dùng toast "Đã tải {fileName}"?
5. **"Tải lại" tính thêm một lượt** (không chống lặp, đúng luật "mỗi lần bấm là một lượt"). Nếu muốn lượt tải sạch hơn cho thống kê / gợi ý, có thể cho "Tải lại" dùng lại `url` cũ khi còn hạn 5 phút (không gọi API). Plan hiện chọn gọi lại API cho đơn giản; bạn muốn cách nào?
6. **401 không dùng message của thiết kế** ("Vui lòng đăng nhập để tải LUT"): filter JWT trả chung "Chưa đăng nhập" cho mọi API, giao diện không hiện message này (chỉ mở hộp thoại đăng nhập). Ghi lệch vào tài liệu thiết kế khi đóng lát.

## 12. Nhật ký thực hiện (do /cook và /doc-chuc-nang ghi — nối các phiên A/B/C)

| Thời điểm | Sự kiện |
|---|---|
| 2026-11-10 | Lập plan (draft) |
| 2026-11-10 | Người dùng duyệt (approved), giữ phương án mặc định §11 |
| 2026-11-10 | Phiên A: status → in-progress. Preflight xanh (Orca ready, MySQL/MinIO healthy, backend :9500 = 200). File bẩn có sẵn trước khi giao: `AGENTS.md`, `CLAUDE.md`, `backend/CLAUDE.md`, `docs/plan/README.md`, `docs/tai-lieu-thiet-ke.md`, `plan/README.md`, `plan/_template.md`, `plan/thiet-ke-tong-quat.md`, `plan/tai-lut.md` (mới) |
| 2026-11-10 | Claude viết `frontend/tests/e2e/tai-lut.spec.ts` (21 test: API TC-10 → TC-19, giao diện TC-20 → TC-30; `--list` + eslint sạch). Lệch nhỏ so với §9 để test độc lập: TC-13/14/18/19 tự tải lại trong test thay vì dùng kết quả TC-12; TC-18 trả tiêu đề cũ ở `finally` (slug có thể đổi, đọc lại T) để các test giao diện vẫn tìm "Đà Lạt Tải Thử"; beforeAll ẩn LUT "… Tải Thử" còn xuất bản của lần chạy trước. Sửa §9.2: `shop-flows.spec.ts` (3 test: `Noir-LUT-DownBeat.zip`, `Xanh-Dien-Anh-LUT-DownBeat.zip`, đóng hộp thoại "Đã tải xong" trước khi thao tác tiếp) + `tai-khoan-khach.spec.ts` TC-25. Lưu ý: shop-flows tải thật `xanh-dien-anh` (ngoài `noir`) → `download_count` của 2 LUT mẫu này tăng mỗi lần chạy; kho-lut TC-03 (popular top 3 bắt đầu bằng Xanh Điện Ảnh) chỉ càng chắc |
| 2026-11-10 | Task spec: `plan/tasks/tai-lut-be.md`, `plan/tasks/tai-lut-fe.md`. Orca run `run_9c595808357e`, coordinator `term_9684e52e-0cf0-4f36-be3c-feb0b35e5d90` (mọi lệnh kèm `--from`, `check` kèm `--terminal`; worktree `path:C:/Users/JulytusChu/Desktop/Code/DownBeat`) |
| 2026-11-10 | agy BE (gemini-3.8-flash-high): dispatch `ctx_1fe482e5a012`, task `task_95ffa37f0626`, terminal `term_fccc87dd-c37a-46eb-84d2-4785a1f6573d`. agy FE (gemini-3.8-flash-high): dispatch `ctx_6bd28e3a44b9`, task `task_ef343bac1828`, terminal `term_4f63e2b1-f45f-46bc-b910-d0056e624432`. Cả hai `turnStart: observed` |
| 2026-11-10 | **phiên A xong** — phiên B bắt đầu ở bước 4 (check `--run run_9c595808357e --terminal term_9684e52e-…`) |
| 2026-11-10 | Phiên B: agy FE `worker_done` (`ctx_6bd28e3a44b9`, outcome succeeded) — hook gọi API thật, hộp thoại `downloaded` + `DownloadDonePanel`, `apiErrorOf` ở `lib/axios/error.ts`, xoá `lib/mock/account.ts`. Review FE (bước 6) sạch: chỉ `frontend/src`, build xanh, lint 0 error (2 warning có sẵn), chuỗi §6.2 khớp. Chưa chạy `api:types` (chờ BE) |
| 2026-11-10 | agy BE `worker_done` (`ctx_1fe482e5a012`, succeeded) — V8 `download_log`, module `business.download` (controller/service/`LutPackage`/repo), `FileStorageService.existsPrivate/presignPrivateGet`, `LutRepository.getPublishedById/increaseDownloadCount`, ErrorCode `PLAN_REQUIRED`/`LUT_FILE_UNAVAILABLE`, `lut.download.url-ttl`. Review BE (bước 5) sạch: thứ tự §5.1 đúng, MinIO trước rồi INSERT + UPDATE trong `TransactionTemplate`, POJO `NON_NULL` nên response chỉ `fileName`/`url`; mvn business không FAIL; restart OK (Flyway v8); E2E `-g "API"` 11/11 pass; `api:types` có `/lut/download`. `RestService.java` (9100→9500) là thay đổi của người dùng, không phải worker — giữ nguyên |
| 2026-11-10 | Bước 7: E2E headed `tai-lut.spec.ts` **21/21 pass** (49.9s, API 10 + giao diện 11), 7 ảnh ở `docs/chuc-nang/img/tai-lut/`. Hồi quy §9.2 `shop-flows.spec.ts` + `tai-khoan-khach.spec.ts` 47/47 pass. Vòng sửa: BE 0, FE 0. Lệch plan: không (FE thêm nhánh `errorCode` LOGIN/UNAUTHORIZED cạnh HTTP 401 khi mở hộp thoại đăng nhập — vô hại). Đã release `ctx_1fe482e5a012`, `ctx_6bd28e3a44b9` (reclaimable rỗng). Ghi chú: người dùng chốt cổng local mới BE 9500 / FE 4500 — lát này chạy trên 9500, việc chuyển cổng làm riêng |
| 2026-11-10 | **phiên B xong** |
| 2026-11-10 | **Phiên C xong**: `docs/chuc-nang/tai-lut.md`, 30/30 TC pass (JUnit 9 + Playwright 21), status → done; commit + push + PR vào `main` (`frontend/tests/` bị `.gitignore` nên spec E2E không vào commit) |
