---
title: Bộ sưu tập — lưu LUT thành từng bộ, giới hạn 3 bộ cho gói Miễn phí, trang "Bộ sưu tập của tôi"
slug: bo-suu-tap
status: done   # draft → approved → in-progress → done | blocked
dot: docs/plan/README.md §1.6 (thiết kế §2.2, §4.6, §5.4, §6.7; thiet-ke-tong-quat §4.3, §5.3)
module_be: business.collection   # + base (ErrorCode), entity (POJO LutCollection, CollectionItem), business.lut (LutService), business.billing (SubscriptionService)
resource_code: —      # API khách, chỉ cần token; không tạo resource
created: 2026-11-10
approved: 2026-11-10
---

# Bộ sưu tập

## 1. Mục tiêu và phạm vi

Sau plan này, **khách đã đăng nhập lưu được LUT vào các bộ sưu tập có tên** (ví dụ "Phim cưới mùa thu"): bấm nút + trên thẻ LUT hoặc "Lưu vào bộ sưu tập" ở trang chi tiết thì mở hộp thoại chọn bộ (bật / tắt từng bộ, tạo bộ mới ngay trong hộp thoại). Trang `/bo-suu-tap` liệt kê các bộ (ảnh ghép 4 LUT, số LUT), trang `/bo-suu-tap/{id}` hiện lưới LUT của một bộ, đổi tên, xoá bộ, bỏ từng LUT (có hoàn tác). Gói Miễn phí tạo tối đa 3 bộ; Pro / Studio không giới hạn. Bảng `collection_item` là nguồn tín hiệu "yêu thích" mà lát `ho-so-nguoi-dung` (2.2) sẽ đọc thẳng.

| Có làm (lát này) | Không làm (để plan khác) |
|---|---|
| Migration `V9__bo_suu_tap.sql`: `collection`, `collection_item` | Đọc `collection_item` làm tín hiệu "yêu thích" + xoá cache hồ sơ khi lưu → lát `ho-so-nguoi-dung` (2.2) |
| 6 API: `my-list`, `get`, `update` (tạo / đổi tên, tạo kèm 1 LUT), `delete/{id}`, `item/add`, `item/remove` | Chia sẻ bộ sưu tập công khai, bộ sưu tập của người khác |
| Giới hạn 3 bộ cho gói Miễn phí (`COLLECTION_LIMIT`), tên trùng trong cùng khách (`COLLECTION_NAME_EXISTS`) | Sắp xếp tay thứ tự LUT trong bộ, ảnh bìa tuỳ chọn, mô tả bộ |
| Hộp thoại "Lưu vào bộ sưu tập" dùng ở thẻ LUT (lưới `/luts`, danh mục, "Có thể bạn cũng thích") và trang chi tiết | Hiện trạng thái "đã lưu" trên từng thẻ ở lưới (cần thêm API, xem §11 câu 4) |
| Trang `/bo-suu-tap`, `/bo-suu-tap/$id`; mục "Bộ sưu tập" ở menu trái và menu tài khoản | Tải cả bộ thành một file .zip |
| Chưa đăng nhập bấm lưu → đăng ký / đăng nhập xong mở tiếp hộp thoại lưu (không tải LUT như hiện nay) | Quản trị xem bộ sưu tập của khách → lát `quan-tri-don-hang` |

## 2. Tác nhân và phân quyền

| Tác nhân | Được làm | Ghi chú |
|---|---|---|
| Khách vãng lai | — | Bấm lưu → hộp thoại đăng ký; mở `/bo-suu-tap` → lời mời đăng nhập; gọi thẳng API → 401 |
| Người đã đăng nhập không có subscription `ACTIVE` còn hạn (gói Miễn phí; kể cả admin chưa mua gói) | Mọi thao tác trên bộ **của chính mình**; tạo tối đa 3 bộ | Không kiểm resource, chỉ cần token |
| Người đã đăng nhập có subscription `ACTIVE`, `end_date >= hôm nay` (Pro, Studio) | Như trên, không giới hạn số bộ | Hết hạn về Miễn phí: giữ mọi bộ đang có, vẫn thêm / bỏ LUT, đổi tên, xoá được; chỉ không tạo thêm khi còn ≥ 3 bộ |

Không tạo resource, không có migration phân quyền. Các đường dẫn `/collection/**` không khớp mẫu công khai `^/[a-z0-9-]+/public/.*` nên tự cần token; **không** thêm vào whitelist, controller **không** gọi `checkPermission` (giống `lut/download`). Bộ của người khác luôn trả **404** (không phải 403) để không lộ id nào có tồn tại.

## 3. Luồng nghiệp vụ

**Luồng chính — lưu LUT từ thẻ ở lưới `/luts`, tạo bộ đầu tiên:**
1. Khách Miễn phí đã đăng nhập rê chuột vào thẻ "Xanh Điện Ảnh", bấm nút + ("Thêm Xanh Điện Ảnh vào bộ sưu tập").
2. Hộp thoại "Lưu vào bộ sưu tập" mở, gọi `GET /api/collection/my-list?lutId=1` → `[]`. Hộp thoại hiện ô "Tên bộ sưu tập mới".
3. Khách gõ "Phim cưới mùa thu", bấm "Tạo và lưu" → `POST /api/collection/update { name: "Phim cưới mùa thu", lutId: 1 }`.
4. Backend: LUT 1 `PUBLISHED` → khách chưa có gói trả phí và đang có 0 bộ (< 3) → tên chưa trùng → trong một transaction INSERT `collection` + INSERT `collection_item (collection_id, 1)`.
5. Trả `{ id: 12, name: "Phim cưới mùa thu", itemCount: 1, coverUrls: [ ... ], containsLut: true, ... }`. Toast "Đã tạo “Phim cưới mùa thu” và lưu LUT". Danh sách trong hộp thoại có dòng "Phim cưới mùa thu" đã tích, "1 LUT".
6. Khách bấm "Xong".

**Luồng thay thế:**
- A1. Đã có bộ: hộp thoại liệt kê các bộ (mới sửa gần nhất lên đầu), bộ đang chứa LUT thì đã tích. Tích một bộ → `item/add`, toast "Đã lưu vào “{tên}”"; bỏ tích → `item/remove`, toast "Đã bỏ khỏi “{tên}”". Lưu vào nhiều bộ cùng lúc được.
- A2. Lưu từ trang chi tiết `/luts/{slug}`: nút "Lưu vào bộ sưu tập" mở cùng hộp thoại. LUT đã nằm trong ít nhất một bộ thì nút đổi thành "Đã lưu".
- A3. Chưa đăng nhập bấm lưu (thẻ hoặc trang chi tiết) → hộp thoại đăng ký "Tạo tài khoản để lưu bộ sưu tập" kèm thẻ LUT; đăng ký / đăng nhập xong → mở tiếp hộp thoại "Lưu vào bộ sưu tập" của LUT đó (**không** tải LUT).
- A4. Trang `/bo-suu-tap`: "Tạo bộ sưu tập" → hộp thoại nhập tên → `update { name }` (không kèm LUT). Menu "⋯" trên thẻ bộ: "Đổi tên" (`update { id, name }`), "Xoá" (xác nhận → `delete/{id}`).
- A5. Trang `/bo-suu-tap/{id}`: `GET /collection/get?id=` → lưới LUT. Nút "Bỏ {tên LUT} khỏi bộ sưu tập" trên thẻ → `item/remove`, thẻ biến mất, toast có nút "Hoàn tác" (→ `item/add` lại).
- A6. Khách Pro / Studio: không bao giờ gặp giới hạn số bộ.
- A7. LUT trong bộ bị quản trị ẩn (`HIDDEN`): biến khỏi lưới, không tính vào `itemCount`, không làm ảnh ghép; dòng `collection_item` vẫn giữ, xuất bản lại thì hiện lại. LUT bị xoá hẳn (chỉ xoá được khi chưa xuất bản và chưa có lượt tải): dòng `collection_item` tự xoá theo (CASCADE).
- A8. Gói trả phí hết hạn khi khách đang có 5 bộ: giữ cả 5; trang hiện băng "Bạn đã dùng hết 3 bộ sưu tập của gói Miễn phí."; xoá bớt còn 2 thì tạo lại được.

**Ngoại lệ:**
- E1. Không token / token hết hạn mà refresh hỏng → 401 (filter có sẵn). Interceptor xoá phiên; hộp thoại / trang về trạng thái chưa đăng nhập.
- E2. Gói Miễn phí đang có ≥ 3 bộ mà tạo thêm → 403 `COLLECTION_LIMIT` "Gói Miễn phí lưu được tối đa 3 bộ sưu tập". Không tạo gì (kể cả LUT kèm theo). Giao diện bình thường đã ẩn ô tạo trước khi tới bước này (§6); lỗi này chỉ gặp khi dữ liệu trên trình duyệt cũ.
- E3. Tên trùng một bộ khác của chính khách (không phân biệt hoa thường, **có** phân biệt dấu: "phim CƯỚI" trùng "Phim cưới", "Phim cuoi" không trùng) → 400 `COLLECTION_NAME_EXISTS` "Bạn đã có bộ sưu tập tên này". Hai khách khác nhau đặt cùng tên được.
- E4. Bộ không có / của khách khác / thiếu id → 404 `DATA_NOT_FOUND` "Không tìm thấy bộ sưu tập".
- E5. LUT không có / chưa xuất bản / đã ẩn khi **thêm** (`item/add`, hoặc `update` tạo kèm `lutId`) → 404 `DATA_NOT_FOUND` "Không tìm thấy LUT". `item/remove` không kiểm LUT (bỏ LUT đã ẩn vẫn được).

```mermaid
sequenceDiagram
  actor K as Khách
  participant FE as Frontend
  participant BE as Backend
  participant DB as MySQL
  K->>FE: nút + trên thẻ / "Lưu vào bộ sưu tập"
  alt chưa đăng nhập
    FE->>K: hộp thoại đăng ký (then = collection) → đăng ký xong mở tiếp
  end
  FE->>BE: GET /collection/my-list?lutId=1
  BE->>DB: collection WHERE user_id = ? + đếm / ảnh bìa LUT PUBLISHED + bộ nào chứa lut 1
  BE-->>FE: [ { id, name, itemCount, coverUrls, containsLut } ]
  alt tạo bộ mới
    K->>FE: "Tạo và lưu"
    FE->>BE: POST /collection/update { name, lutId }
    BE->>DB: lut 1 PUBLISHED? subscription ACTIVE còn hạn? COUNT(collection) < 3? tên trùng?
    BE->>DB: INSERT collection; INSERT collection_item (một transaction)
    BE-->>FE: 403 COLLECTION_LIMIT / 400 COLLECTION_NAME_EXISTS / 200
  else tích / bỏ tích một bộ
    FE->>BE: POST /collection/item/add | item/remove { collectionId, lutId }
    BE->>DB: INSERT IGNORE | DELETE collection_item; UPDATE collection.updated_time
    BE-->>FE: { id, name, itemCount, containsLut }
  end
  FE->>K: toast + dòng trong hộp thoại cập nhật
```

## 4. Cơ sở dữ liệu

Migration: `V9__bo_suu_tap.sql` (V8 là mới nhất; thiết kế §4.8 dự kiến V10 nhưng số thực tế theo thứ tự làm). Không có seed.

**`collection`**

| Cột | Kiểu | Ràng buộc / ghi chú |
|---|---|---|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT NOT NULL | FK → `user_app(id)` ON DELETE CASCADE |
| name | VARCHAR(100) NOT NULL **COLLATE utf8mb4_0900_as_ci** | Đã trim. Collation riêng cột: không phân biệt hoa thường nhưng **phân biệt dấu** (bảng mặc định `ai_ci` coi "Âm" = "Ấm" = "am", sai với tiếng Việt) |
| created_time | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | |
| updated_time | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP | Đổi tên tự cập nhật; thêm / bỏ LUT thì service **tự** `UPDATE collection SET updated_time = NOW()` (vì không đụng dòng `collection`) |

Unique: `uq_collection_user_name (user_id, name)`. Index: `idx_collection_user (user_id, updated_time)`. Xoá: **cứng**, kéo theo `collection_item`.

**`collection_item`** (bảng nối, không có cột `id` → không có repository riêng, truy vấn tay trong `CollectionRepository`)

| Cột | Kiểu | Ràng buộc / ghi chú |
|---|---|---|
| collection_id | INT NOT NULL | FK → `collection(id)` ON DELETE CASCADE |
| lut_id | INT NOT NULL | FK → `lut(id)` ON DELETE CASCADE |
| created_time | DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP | Thứ tự hiện trong bộ (mới lưu lên đầu); lát 2.2 dùng làm thời điểm tín hiệu "yêu thích" |

PK `(collection_id, lut_id)` (lưu trùng không sinh dòng thứ hai). Index `idx_collection_item_lut (lut_id)`.

Cả hai bảng `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`, `CREATE TABLE IF NOT EXISTS`.

## 5. Hợp đồng API (cố định — nguồn sự thật cho cả BE và FE)

Thành công: `{ "code": 200, "message": "OK", "result": … }`. Lỗi nghiệp vụ: `{ "path", "code", "errorCode", "message" }`. POJO `NON_NULL`. Mọi endpoint cần token; `userId` luôn lấy từ token, không bao giờ từ body.

**Đối tượng `Collection` trong response** (POJO `LutCollection`, bảng `collection` + field tính thêm). Không bao giờ trả `userId`:

| Khoá | Kiểu | Ý nghĩa |
|---|---|---|
| id | number | |
| name | string | |
| itemCount | number | Số LUT `PUBLISHED` trong bộ |
| coverUrls | string[] | `cover_url` của tối đa 4 LUT `PUBLISHED` lưu gần nhất (mới nhất trước); bộ trống → `[]` |
| containsLut | boolean | **Chỉ có** khi request có `lutId` (my-list) hoặc ở response `item/add` / `item/remove` / `update` tạo kèm LUT |
| luts | Lut[] | **Chỉ có** ở `get` |
| createdTime, updatedTime | string `yyyy-MM-ddTHH:mm:ss` | |

### 5.1 `GET /api/collection/my-list?lutId=` — các bộ của tôi

`lutId` không bắt buộc. Không phân trang (mỗi khách vài bộ). Sắp xếp `updated_time DESC, id DESC`.

Response `result`:
```json
[
  {
    "id": 12, "name": "Phim cưới mùa thu", "itemCount": 2,
    "coverUrls": [
      "http://localhost:9020/downbeat-public/lut/mua-thu-ha-noi/cover.webp",
      "http://localhost:9020/downbeat-public/lut/xanh-dien-anh/cover.webp"
    ],
    "containsLut": true,
    "createdTime": "2026-11-10T09:12:03", "updatedTime": "2026-11-10T09:20:41"
  },
  {
    "id": 9, "name": "Du lịch biển", "itemCount": 0, "coverUrls": [],
    "containsLut": false,
    "createdTime": "2026-11-09T21:05:00", "updatedTime": "2026-11-09T21:05:00"
  }
]
```
Không có `lutId` → không có khoá `containsLut`. Khách chưa có bộ → `[]`. `lutId` trỏ LUT không tồn tại → mọi `containsLut` = `false` (không lỗi).

Truy vấn: 1 câu lấy các bộ của khách; 1 câu `collection_item JOIN lut (status = 'PUBLISHED') WHERE collection_id IN (…)` sắp `collection_item.created_time DESC, lut.id DESC` để đếm và lấy 4 ảnh mỗi bộ trong Java; 1 câu `SELECT collection_id FROM collection_item WHERE collection_id IN (…) AND lut_id = ?` khi có `lutId`. Không truy vấn theo từng bộ (N+1).

### 5.2 `GET /api/collection/get?id=` — một bộ kèm LUT

Response `result`: như một phần tử của 5.1 (không có `containsLut`) + `luts`: mọi LUT `PUBLISHED` trong bộ, sắp `collection_item.created_time DESC, lut.id DESC`, **cùng shape với item của `POST /lut/public/list`** (có `creatorName`, `categories`, `tags`; không có `fileKey`, `status`). Không phân trang.
```json
{
  "id": 12, "name": "Phim cưới mùa thu", "itemCount": 2,
  "coverUrls": ["http://localhost:9020/downbeat-public/lut/mua-thu-ha-noi/cover.webp", "http://localhost:9020/downbeat-public/lut/xanh-dien-anh/cover.webp"],
  "createdTime": "2026-11-10T09:12:03", "updatedTime": "2026-11-10T09:20:41",
  "luts": [
    {
      "id": 17, "slug": "mua-thu-ha-noi", "title": "Mùa Thu Hà Nội", "description": "…",
      "creatorId": 2, "creatorName": "Minh Color", "style": "am-ap", "isPremium": 0,
      "coverUrl": "http://localhost:9020/downbeat-public/lut/mua-thu-ha-noi/cover.webp",
      "previewType": "BEFORE_AFTER", "beforeUrl": "…", "afterUrl": "…",
      "fileSizeKb": 812, "lutSize": 33, "downloadCount": 9120, "publishedTime": "2026-10-02T08:00:00",
      "categories": ["am-ap", "dam-cuoi"], "tags": ["hoàng hôn", "ấm", "film"]
    }
  ]
}
```
`id` thiếu, không có, hoặc của khách khác → 404 "Không tìm thấy bộ sưu tập".

### 5.3 `POST /api/collection/update` — tạo / đổi tên

Body là POJO `LutCollection`, chỉ đọc `id`, `name`, `lutId` (field tạm, không thuộc bảng); mọi khoá khác (`userId`, `itemCount`, `createdTime`…) bị bỏ qua.

Tạo (không có `id` hoặc `id <= 0`):
```json
{ "name": "  Phim cưới mùa thu ", "lutId": 1 }
```
Quy tắc (theo thứ tự, gặp lỗi đầu tiên thì dừng, chưa ghi gì):
1. `name` = trim.
2. Có `lutId` → LUT phải `PUBLISHED`, không thì 404 "Không tìm thấy LUT".
3. Khách **không** có subscription `ACTIVE` còn hạn (`SubscriptionService.findActiveByUserId(userId, hôm nay)` trả null) và số bộ hiện có ≥ `collection.free-limit` (mặc định 3) → 403 `COLLECTION_LIMIT`.
4. Đã có bộ cùng `user_id` + `name` (so bằng collation cột) → 400 `COLLECTION_NAME_EXISTS`.
5. Trong một transaction: INSERT `collection` (`id`, `userId`, thời gian do server đặt); có `lutId` thì INSERT `collection_item`. INSERT dính UNIQUE (hai request cùng lúc) → bắt `DuplicateKeyException` → 400 `COLLECTION_NAME_EXISTS`.

Response `result` (đối tượng `Collection`; có `lutId` thì kèm `containsLut: true`):
```json
{
  "id": 12, "name": "Phim cưới mùa thu", "itemCount": 1,
  "coverUrls": ["http://localhost:9020/downbeat-public/lut/xanh-dien-anh/cover.webp"],
  "containsLut": true,
  "createdTime": "2026-11-10T09:12:03", "updatedTime": "2026-11-10T09:12:03"
}
```

Đổi tên (có `id > 0`):
```json
{ "id": 12, "name": "Cưới Đà Lạt" }
```
1. Bộ phải của khách, không thì 404 "Không tìm thấy bộ sưu tập".
2. Trùng tên **bộ khác** của khách (`id <> ?`) → 400 `COLLECTION_NAME_EXISTS`. Đổi sang đúng tên đang có (kể cả khác hoa thường) → 200.
3. Chỉ UPDATE cột `name`. Không kiểm giới hạn số bộ, bỏ qua `lutId`.

Response: đối tượng `Collection` sau khi đổi (không có `containsLut`).

Backend **không** kiểm `name` rỗng / quá 100 ký tự (frontend kiểm, theo `backend/AGENTS.md`).

### 5.4 `POST /api/collection/delete/{id}` — xoá bộ

Bộ phải của khách, không thì 404 "Không tìm thấy bộ sưu tập". DELETE cứng (CASCADE xoá `collection_item`). Response `result`: id đã xoá.
```json
{ "code": 200, "message": "OK", "result": 12 }
```

### 5.5 `POST /api/collection/item/add` — lưu LUT vào bộ

Body là POJO `CollectionItem`, chỉ đọc `collectionId`, `lutId`:
```json
{ "collectionId": 12, "lutId": 17 }
```
1. Bộ phải của khách → không thì 404 "Không tìm thấy bộ sưu tập".
2. LUT phải `PUBLISHED` → không thì 404 "Không tìm thấy LUT".
3. `INSERT IGNORE` (đã có thì không lỗi). Có dòng mới thì `UPDATE collection SET updated_time = NOW() WHERE id = ?`.

Response `result`: đối tượng `Collection` của bộ đó, `containsLut: true`:
```json
{
  "id": 12, "name": "Phim cưới mùa thu", "itemCount": 2,
  "coverUrls": ["http://localhost:9020/downbeat-public/lut/mua-thu-ha-noi/cover.webp", "http://localhost:9020/downbeat-public/lut/xanh-dien-anh/cover.webp"],
  "containsLut": true,
  "createdTime": "2026-11-10T09:12:03", "updatedTime": "2026-11-10T09:20:41"
}
```
Không giới hạn số LUT trong một bộ, ở mọi gói.

### 5.6 `POST /api/collection/item/remove` — bỏ LUT khỏi bộ

Body như 5.5. Bộ phải của khách → không thì 404 "Không tìm thấy bộ sưu tập". DELETE `collection_item`; xoá được dòng thì cập nhật `updated_time`. LUT không nằm trong bộ / không tồn tại → vẫn 200 (không đổi gì). Response: đối tượng `Collection`, `containsLut: false`.

### 5.7 Lỗi nghiệp vụ

| Tình huống | HTTP | errorCode | message (nguyên văn) |
|---|---|---|---|
| Không token / token sai | 401 | `LOGIN` / `UNAUTHORIZED` (filter có sẵn) | "Chưa đăng nhập" / "Token không hợp lệ hoặc sai chữ ký" |
| Bộ không có / của khách khác / thiếu id | 404 | `DATA_NOT_FOUND` | Không tìm thấy bộ sưu tập |
| LUT không có / chưa xuất bản / đã ẩn (khi thêm) | 404 | `DATA_NOT_FOUND` | Không tìm thấy LUT |
| Gói Miễn phí đã có ≥ 3 bộ mà tạo thêm | 403 | `COLLECTION_LIMIT` | Gói Miễn phí lưu được tối đa 3 bộ sưu tập |
| Trùng tên bộ khác của chính khách | 400 | `COLLECTION_NAME_EXISTS` | Bạn đã có bộ sưu tập tên này |

Thêm vào thiết kế §5.7 khi đóng lát: `COLLECTION_LIMIT`, `COLLECTION_NAME_EXISTS` (mã mới).

## 6. Giao diện (chuỗi cố định — test E2E chọn theo đúng các chuỗi này)

Dấu ngoặc trong chuỗi là ngoặc kép cong `“ ”` (U+201C, U+201D), đúng như viết dưới đây. `{tên}` là tên bộ, `{LUT}` là tiêu đề LUT, `{n}` là số.

### 6.1 Nút lưu (điểm vào)

- **Thẻ LUT** (`lut-card.tsx`, nút + đã có, giữ nhãn `aria-label` "Thêm {LUT} vào bộ sưu tập", tooltip "Thêm vào bộ sưu tập"): gọi hook `useSaveToCollection` thay cho toast "Bộ sưu tập sẽ có ở bản sau". Áp cho mọi nơi dùng `LutGrid` / `LutCard` (`/luts`, danh mục, "Có thể bạn cũng thích").
- **Trang chi tiết**: nút phụ "Lưu vào bộ sưu tập" (icon `CirclePlus`). Đã đăng nhập và LUT nằm trong ≥ 1 bộ (`my-list?lutId=` có `containsLut: true`) thì nhãn là "Đã lưu" (icon `BookmarkCheck`); bấm vẫn mở hộp thoại. Đang tải `my-list` thì giữ nhãn "Lưu vào bộ sưu tập".
- Hook `useSaveToCollection().open(lut)`: chưa đăng nhập → `{ type: "register", lut, then: "collection" }`; đã đăng nhập → `{ type: "collection", lut }`.
- Xoá hẳn hai chỗ toast "Bộ sưu tập sẽ có ở bản sau".

### 6.2 Hộp thoại đăng ký / đăng nhập khi mở từ nút lưu (`then: "collection"`)

| Loại | Tiêu đề | Mô tả |
|---|---|---|
| register | "Tạo tài khoản để lưu bộ sưu tập" | "Miễn phí, lưu được 3 bộ sưu tập. Nâng cấp Pro để lưu không giới hạn." |
| login | "Đăng nhập" | "Đăng nhập để lưu LUT vào bộ sưu tập." |

Có `LutMiniCard` ở đầu như hiện nay. Đăng ký / đăng nhập xong → mở `{ type: "collection", lut }`. Không có `then` (hoặc `then: "download"`) → giữ nguyên hành vi hiện tại (tải LUT). Chuyển qua lại "Đăng nhập" ↔ "Đăng ký" giữ `then`.

### 6.3 Hộp thoại "Lưu vào bộ sưu tập" (loại `collection` trong `ShopDialogs`)

Dùng khung chung (thẻ LUT nhỏ ở đầu, nút "Đóng" góc trên). Mở là gọi `GET /collection/my-list?lutId={lut.id}`.

| Phần | Nội dung |
|---|---|
| Tiêu đề | "Lưu vào bộ sưu tập" |
| Mô tả | "Chọn một hoặc nhiều bộ. Bấm lần nữa để bỏ lưu." (chưa có bộ nào: "Đặt tên cho bộ sưu tập đầu tiên của bạn.") |
| Danh sách | `ul aria-label="Bộ sưu tập của bạn"`; mỗi dòng là một checkbox có nhãn = `{tên}` (bấm cả dòng được), bên phải chữ nhỏ "{n} LUT" (0 thì "Trống"). Tích = `containsLut`. Bấm → `item/add` / `item/remove`; dòng đó `disabled` + spinner tới khi xong; xong thì cập nhật tích và số. Danh sách cao tối đa ~5 dòng rồi cuộn trong hộp thoại. |
| Đang tải | 3 dòng `Skeleton` |
| Lỗi tải | "Không tải được bộ sưu tập" + nút "Thử lại" |
| Tạo mới (khi được tạo) | Label "Tên bộ sưu tập mới", placeholder "Ví dụ: Phim cưới mùa thu", nút "Tạo và lưu" (Enter cũng gửi). Đang gửi: spinner trên nút. Thành công: ô xoá trắng, bộ mới lên đầu danh sách, đã tích. |
| Hết lượt tạo (gói Miễn phí và đang có ≥ 3 bộ, hoặc vừa nhận `COLLECTION_LIMIT`) | Thay khối tạo mới bằng khung chữ "Gói Miễn phí lưu được tối đa 3 bộ sưu tập." + link "Nâng cấp Pro" (→ `/pricing`, đóng hộp thoại) |
| Chân | Link chữ "Xem bộ sưu tập của tôi" (→ `/bo-suu-tap`, đóng hộp thoại) · nút chính "Xong" (đóng) |

Validate ô tên (client, lúc bấm "Tạo và lưu"): rỗng sau trim → "Nhập tên bộ sưu tập"; > 100 ký tự → "Tên tối đa 100 ký tự". Lỗi hiện dưới ô (`aria-invalid`). Server trả `COLLECTION_NAME_EXISTS` → hiện "Bạn đã có bộ sưu tập tên này" dưới ô, **không** toast.

Toast: tích → "Đã lưu vào “{tên}”"; bỏ tích → "Đã bỏ khỏi “{tên}”"; tạo → "Đã tạo “{tên}” và lưu LUT". Lỗi khác (404, mạng) → toast message server nếu có, không có thì "Không lưu được, vui lòng thử lại"; trạng thái tích trả về như trước.

Sau mọi thao tác: invalidate query `["collections"]` (cả `my-list` các `lutId` khác và trang `/bo-suu-tap`).

### 6.4 Trang `/bo-suu-tap` — "Bộ sưu tập của tôi"

- Route `/_shop/bo-suu-tap/` (layout cửa hàng). `document.title` = "Bộ sưu tập của tôi | DownBeat".
- Menu trái (`nav-config.ts`): thêm `{ id: "collections", label: "Bộ sưu tập", icon: FolderHeart, to: "/bo-suu-tap" }` vào nhóm thứ hai, **trước** "Bảng giá". Menu tài khoản ở header: thêm mục "Bộ sưu tập của tôi" (icon `FolderHeart`, → `/bo-suu-tap`) ngay trên "Đăng xuất".
- **Chưa đăng nhập** (sau khi phiên đã nạp xong): khối giữa trang tiêu đề "Đăng nhập để xem bộ sưu tập", mô tả "Lưu các LUT cùng gu thành từng bộ để dùng cho cả dự án.", nút "Đăng nhập" (→ hộp thoại login) và "Tạo tài khoản" (→ hộp thoại register). Đăng nhập xong trang tự hiện danh sách. Đang nạp phiên → skeleton.
- **Đầu trang**: `h1` "Bộ sưu tập của tôi"; dòng phụ "{n} bộ sưu tập", gói Miễn phí thêm " · Gói Miễn phí: tối đa 3 bộ". Nút chính "Tạo bộ sưu tập" bên phải (điện thoại: xuống dòng dưới tiêu đề, rộng hết hàng).
- **Hết lượt** (Miễn phí, ≥ 3 bộ): nút "Tạo bộ sưu tập" `disabled`; ngay dưới đầu trang có băng thông báo "Bạn đã dùng hết 3 bộ sưu tập của gói Miễn phí." + link "Nâng cấp Pro" (→ `/pricing`).
- **Lưới**: `ul aria-label="Bộ sưu tập của tôi"`, 1 cột (< 640 px), 2 cột (sm), 3 cột (lg), 4 cột (xl). Mỗi thẻ:
  - Ảnh ghép tỉ lệ 16:9: 1 ảnh → đầy khung; 2 → chia đôi dọc; 3–4 → lưới 2×2 (ô thiếu tô nền). Bộ trống: nền nhạt + icon `FolderHeart` + chữ "Chưa có LUT".
  - Tên (`h3`, cắt 1 dòng), dưới là "{n} LUT".
  - Cả thẻ là link tới `/bo-suu-tap/{id}` (`aria-label` = "Mở bộ sưu tập {tên}").
  - Nút "⋯" góc trên phải (`aria-label` "Tuỳ chọn cho {tên}", luôn hiện trên điện thoại, rê chuột mới hiện trên máy tính) → menu "Đổi tên", "Xoá".
- **Trống** (0 bộ): tiêu đề "Chưa có bộ sưu tập nào", mô tả "Lưu các LUT cùng gu vào một bộ để dùng lại cho cả dự án.", nút "Tạo bộ sưu tập" và "Khám phá kho LUT" (→ `/luts`).
- **Lỗi tải**: "Không tải được bộ sưu tập" + "Thử lại".

### 6.5 Hộp thoại tên bộ (dùng cho tạo và đổi tên ở 6.4, 6.6)

| | Tạo | Đổi tên |
|---|---|---|
| Tiêu đề | "Tạo bộ sưu tập" | "Đổi tên bộ sưu tập" |
| Ô | Label "Tên bộ sưu tập", placeholder "Ví dụ: Phim cưới mùa thu" | như bên trái, điền sẵn tên cũ, chọn sẵn toàn bộ chữ |
| Nút | "Tạo" · "Huỷ" | "Lưu" · "Huỷ" |
| Toast thành công | "Đã tạo bộ sưu tập “{tên}”" | "Đã đổi tên bộ sưu tập" |

Validate như 6.3 ("Nhập tên bộ sưu tập", "Tên tối đa 100 ký tự"). `COLLECTION_NAME_EXISTS` hiện dưới ô, hộp thoại giữ nguyên. `COLLECTION_LIMIT` (dữ liệu cũ) → toast "Gói Miễn phí lưu được tối đa 3 bộ sưu tập", đóng hộp thoại, trang nạp lại (băng hết lượt hiện ra). Tạo xong ở trang danh sách: đóng hộp thoại, thẻ mới ở đầu lưới (không chuyển trang).

### 6.6 Hộp thoại xoá (AlertDialog)

- Tiêu đề "Xoá bộ sưu tập “{tên}”?"
- Mô tả "{n} LUT trong bộ sẽ được bỏ lưu, LUT vẫn còn trong kho. Không hoàn tác được." (bộ trống: "Không hoàn tác được.")
- Nút "Xoá bộ sưu tập" (màu nguy hiểm) · "Huỷ". Toast "Đã xoá bộ sưu tập “{tên}”". Xoá từ trang chi tiết → chuyển về `/bo-suu-tap`.

### 6.7 Trang `/bo-suu-tap/$id` — một bộ

- Route `/_shop/bo-suu-tap/$id`. `document.title` = "{tên} – Bộ sưu tập | DownBeat".
- Đường dẫn (`nav aria-label="Đường dẫn"`): "Bộ sưu tập của tôi" (link) › `{tên}`.
- `h1` `{tên}`; dòng phụ "{n} LUT". Nút: "Đổi tên" (6.5), "Xoá" (6.6), "Thêm LUT từ kho" (→ `/luts`).
- Lưới LUT: dùng `LutCard` như kho (rê chuột xem trước, nút tải, nút +). Thêm nút "Bỏ khỏi bộ sưu tập" trên thẻ (`aria-label` "Bỏ {LUT} khỏi bộ sưu tập", icon `X`, tooltip "Bỏ khỏi bộ sưu tập"; prop mới `onRemove` của `LutCard`, chỉ hiện khi có prop). Bấm → `item/remove`, thẻ biến mất ngay; toast "Đã bỏ “{LUT}” khỏi bộ sưu tập" có nút "Hoàn tác" (→ `item/add` lại, thẻ quay về). Toast tự tắt sau 5 giây.
- Bộ trống: "Bộ sưu tập này chưa có LUT", mô tả "Bấm nút + trên thẻ LUT trong kho để lưu vào đây.", nút "Khám phá kho LUT".
- 404 (id không có, của người khác, không phải số): `ShopNotFound` tiêu đề "Không tìm thấy bộ sưu tập", mô tả "Bộ sưu tập này không tồn tại hoặc đã bị xoá." (có link về kho như các trang 404 khác).
- Chưa đăng nhập: cùng khối "Đăng nhập để xem bộ sưu tập" như 6.4.
- Đang tải: skeleton tiêu đề + 4 thẻ.

### 6.8 Điện thoại (≤ 640 px)

Không tràn ngang ở `/bo-suu-tap`, `/bo-suu-tap/$id` và hộp thoại 6.3. Nút "⋯" trên thẻ bộ và nút "Bỏ khỏi bộ sưu tập" trên thẻ LUT luôn hiện (không có rê chuột). Hộp thoại 6.3 cuộn được trong khung, nút "Xong" thấy được sau khi cuộn.

## 7. Việc backend (agy BE)

Package mới `vn.aeoc.business.collection` (`controller`, `service`, `repository`). Thứ tự theo `backend/AGENTS.md`:

1. `app/src/main/resources/db/migration/V9__bo_suu_tap.sql`: 2 bảng §4 (FK CASCADE, UNIQUE, index, collation cột `name`). Restart → build để jOOQ sinh `COLLECTION`, `COLLECTION_ITEM`.
2. `base/.../ErrorCode.java`: `COLLECTION_LIMIT(403, "Gói Miễn phí lưu được tối đa 3 bộ sưu tập")`, `COLLECTION_NAME_EXISTS(400, "Bạn đã có bộ sưu tập tên này")`. 404 dùng `DATA_NOT_FOUND` với message riêng ("Không tìm thấy bộ sưu tập" / "Không tìm thấy LUT").
3. `entity/.../data/mysql/collection/LutCollection.java` (tên lớp `LutCollection` để không đụng `java.util.Collection`; ánh xạ bảng `collection`): `id, userId, name, createdTime, updatedTime` + field không thuộc bảng `lutId` (request), `itemCount`, `coverUrls` (`List<String>`), `containsLut` (`Boolean`), `luts` (`List<Lut>`). `@JsonInclude(NON_NULL)`. `CollectionItem.java`: `collectionId, lutId, createdTime`.
4. `collection/repository/CollectionRepository extends AbsMysqlRepository<CollectionRecord, LutCollection, Integer>`: `listByUser(userId)`, `getOwned(id, userId)` (`getOne(COLLECTION.ID.eq(id).and(COLLECTION.USER_ID.eq(userId)))`), `countByUser`, `existsName(userId, name, excludeId)`, `updateName`, `touch(id)`; bảng nối viết tay: `addItem` (`insertInto … onDuplicateKeyIgnore()`, trả số dòng), `removeItem`, `publishedItems(collectionIds)` → `(collectionId, lutId, coverUrl)` JOIN `lut` `status = 'PUBLISHED'` sắp §5.1, `collectionIdsContaining(collectionIds, lutId)`.
5. `business/lut/service/LutService.java`: thêm `listPublishedByIds(List<Integer> ids)` → LUT `PUBLISHED` theo **đúng thứ tự `ids`**, shape công khai, đã `enrich` (thẻ, danh mục); và `isPublished(Integer id)`. (`business.collection` không gọi thẳng `LutRepository`.)
6. `collection/service/CollectionService extends BaseService<CollectionRepository, LutCollection, Integer>`: `myList(userId, lutId)`, `get(userId, id)`, `upsert(userId, body, today)`, `delete(userId, id)`, `addItem(userId, item)`, `removeItem(userId, item)` theo đúng thứ tự quy tắc §5.1–5.6. Ghi nhiều bảng bằng `@Transactional` (gọi từ controller, không gọi nội bộ cùng bean) hoặc `TransactionTemplate`. Gói trả phí: `SubscriptionService.findActiveByUserId(userId, today) != null`. Giới hạn đọc `@Value("${collection.free-limit:3}")`. Response luôn `userId = null`.
7. `collection/controller/CollectionController extends BaseController`: 6 endpoint §5, `SecurityUtils.userId(principal)`, `LocalDate.now()`. `get?id=` dùng `@RequestParam(required = false)`; thiếu → 404.
8. `application.yml`: `collection.free-limit: 3`.

Quyết định worker không tự đổi: tên lớp `LutCollection`; bộ của người khác trả **404** không phải 403; xoá **cứng**; tên so theo collation `utf8mb4_0900_as_ci` của cột (không tự `LOWER()` trong Java); thêm trùng là no-op 200 (`onDuplicateKeyIgnore`), bỏ không có là no-op 200; `itemCount` / `coverUrls` / `luts` chỉ tính LUT `PUBLISHED` nhưng **không** xoá dòng `collection_item` của LUT bị ẩn; giới hạn chỉ áp lúc **tạo**; không mở `/collection/**` trong whitelist; không trả `userId`; không truy vấn N+1 ở `my-list`.

Unit test bắt buộc: các TC loại `unit` ở §9 (`CollectionServiceTest`, mock `CollectionRepository`, `LutService`, `SubscriptionService`, `new QueryExecutor(Runnable::run)`).

## 8. Việc frontend (agy FE)

1. `lib/types/collection.ts`: `CollectionApiDTO` (§5 bảng đối tượng, `luts?: LutApiDTO[]`), `CollectionDTO` (`luts?: LutDTO[]`, đổi qua `toLutDTO`), `SaveCollectionRequest { id?: number; name: string; lutId?: number }`, `CollectionItemRequest { collectionId: number; lutId: number }`; hằng `FREE_COLLECTION_LIMIT = 3`.
2. `lib/axios/collection.ts`: `getMyCollections(lutId?)`, `getCollection(id)`, `saveCollection(req)`, `deleteCollection(id)`, `addCollectionItem(req)`, `removeCollectionItem(req)`.
3. `lib/tanstack/options/collection.ts`: `myCollectionsQueryOptions(lutId?)` (`["collections", "my", lutId ?? null]`), `collectionQueryOptions(id)` (`["collections", "detail", id]`, không retry khi 404); mutation options cho 4 thao tác ghi, `meta.invalidatesQuery: ["collections"]`. Toast thành công đặt ở `meta` theo §6 (chuỗi có tên bộ thì dùng hàm `successMessage` nếu `MutationCache` hỗ trợ, không thì gọi `toast` trong hook, ghi rõ chỗ nào).
4. `lib/stores/shop-dialog.ts`: thêm `| { type: "collection"; lut: LutDTO }`; `login` / `register` thêm `then?: "download" | "collection"`.
5. `hooks/use-save-to-collection.ts`: §6.1.
6. `components/shop/account/shop-dialogs.tsx`: `headingOf` cho `collection` và `then: "collection"` (§6.2, §6.3); `afterAuth` rẽ theo `then`; nút chuyển login ↔ register giữ `then`; render `SaveToCollectionPanel`.
7. `components/shop/collection/save-to-collection-panel.tsx` (mới): nội dung §6.3.
8. `components/shop/collection/collection-card.tsx`, `collection-name-dialog.tsx`, `delete-collection-dialog.tsx`, `collections-page.tsx`, `collection-detail-page.tsx`, `collection-login-prompt.tsx` (mới): §6.4–6.7.
9. `routes/_shop/bo-suu-tap/index.tsx`, `routes/_shop/bo-suu-tap/$id.tsx` (mới): query `enabled` khi đã có `user` (không `ensureQueryData` trong loader vì phiên nạp sau); 404 → `ShopNotFound` §6.7.
10. `components/shop/luts/lut-card.tsx`: prop `onRemove?: (lut) => void` (§6.7). `lut-grid.tsx`, `lut-detail.tsx`: dùng `useSaveToCollection`, bỏ toast giữ chỗ; trang chi tiết đọc `myCollectionsQueryOptions(lut.id)` khi có `user` để hiện "Đã lưu".
11. `components/shop/layout/sidebar/nav-config.ts`, `components/shop/layout/header/header-actions.tsx`: mục menu §6.4.
12. `pnpm api:types` sau khi backend lên để `api.gen.ts` có `/collection/*`.

Component shadcn dùng: có sẵn trong `components/ui/`: `dialog`, `alert-dialog`, `checkbox`, `dropdown-menu`, `input`, `label`, `field`, `skeleton`, `tooltip`, `sonner`, `button`; của cửa hàng: `ShopButton`, `ShopField`, `LutMiniCard`, `LutCard`, `ShopNotFound`, `ShopError`. Không cần `shadcn add`.

## 9. Test case

`api` / `e2e` do Claude viết ở `frontend/tests/e2e/bo-suu-tap.spec.ts`. Mỗi test tự đăng ký khách mới (`newEmail()`), nên không phụ thuộc thứ tự và không đụng dữ liệu của spec khác. Lưu LUT vào bộ **không** đổi `download_count`, nên dùng thẳng LUT mẫu: `xanh-dien-anh`, `mua-thu-ha-noi`, `kodak-400` (★), `noir`; LUT không xuất bản có sẵn: `thu-nghiem-nhap` (DRAFT), `hoang-hon-cu` (HIDDEN). Khách Pro: đăng ký → `order/create` pro MONTH → `order/mock-pay` (như `goi-thanh-toan.spec.ts`). LUT riêng cho TC-17: tạo bằng API quản trị như helper `createPublished` của `quan-ly-lut.spec.ts`, tiêu đề "Bộ Sưu Tập Thử".

| ID | Loại | Mô tả | Tiền điều kiện | Bước | Kết quả mong đợi |
|---|---|---|---|---|---|
| TC-01 | unit | Giới hạn gói Miễn phí | `findActiveByUserId` → null | `upsert` tạo khi `countByUser` = 3; = 2; khi có subscription và count = 5 | 3: `COLLECTION_LIMIT`, không insert; 2: insert 1 lần; có gói (count = 5): insert 1 lần, không ném lỗi |
| TC-02 | unit | Tên trùng khi tạo | `existsName` = true; lần 2 `existsName` = false nhưng `insertReturning` ném `DuplicateKeyException` | `upsert` tạo | cả 2: `COLLECTION_NAME_EXISTS` |
| TC-03 | unit | Field server quản ghi đè | body `{ id: 0, userId: 999, name: "  Cưới  ", createdTime: 2000-01-01 }`, userId token = 5 | `upsert` | POJO insert có `id` null, `userId` 5, `name` "Cưới", `createdTime` null; response `userId` null |
| TC-04 | unit | Tạo kèm LUT | (a) `isPublished(7)` = false; (b) = true | `upsert { name, lutId: 7 }` | (a) `DATA_NOT_FOUND` "Không tìm thấy LUT", không gọi `countByUser`, không insert; (b) insert collection rồi `addItem(id, 7)`, response `containsLut` true |
| TC-05 | unit | Đổi tên | (a) `getOwned` = null; (b) own, `existsName(…, excludeId = 12)` = false; (c) khách Miễn phí có 3 bộ đổi tên | `upsert { id: 12, name }` | (a) `DATA_NOT_FOUND` "Không tìm thấy bộ sưu tập", không `updateName`; (b) `updateName` 1 lần với `excludeId` 12; (c) thành công, không ném `COLLECTION_LIMIT` |
| TC-06 | unit | Thêm LUT | (a) bộ không phải của khách; (b) LUT chưa xuất bản; (c) `addItem` trả 0 (đã có); (d) trả 1 | `addItem` | (a) "Không tìm thấy bộ sưu tập", không kiểm LUT; (b) "Không tìm thấy LUT", không `addItem`; (c) không `touch`, response `containsLut` true; (d) `touch(id)` 1 lần |
| TC-07 | unit | Bỏ LUT, xoá bộ của người khác | `getOwned` = null | `removeItem`, `delete` | cả 2: "Không tìm thấy bộ sưu tập"; không gọi `removeItem` / `delete` của repository |
| TC-08 | unit | Gom số LUT và ảnh ghép (không N+1) | 2 bộ; `publishedItems` trả 5 dòng cho bộ A (mới → cũ), 0 cho bộ B | `myList(userId, null)` | A: `itemCount` 5, `coverUrls` 4 ảnh đầu đúng thứ tự; B: 0, `[]`; `containsLut` null; `publishedItems` gọi đúng 1 lần |
| TC-09 | api | Không token | | 6 endpoint §5 không header | cả 6: 401 |
| TC-10 | api | Danh sách trống, tạo bộ | khách Miễn phí mới | `my-list`; `update { name: "  Phim cưới mùa thu " }`; `my-list` | `[]`; 200, `name` "Phim cưới mùa thu", `itemCount` 0, `coverUrls` `[]`, không có khoá `userId`, `containsLut`; `my-list` có 1 phần tử cùng `id` |
| TC-11 | api | Trùng tên: hoa thường trùng, dấu không trùng | sau TC-10 (cùng khách) | `update { name: "phim CƯỚI mùa thu" }`; `update { name: "Phim cuoi mua thu" }`; khách khác `update { name: "Phim cưới mùa thu" }` | 400 `COLLECTION_NAME_EXISTS` "Bạn đã có bộ sưu tập tên này"; 200; 200 |
| TC-12 | api | Giới hạn 3 bộ gói Miễn phí | khách Miễn phí có 3 bộ | `update { name: "Bộ 4", lutId: <xanh-dien-anh> }`; `my-list` | 403 `COLLECTION_LIMIT` "Gói Miễn phí lưu được tối đa 3 bộ sưu tập"; vẫn 3 bộ, không bộ nào chứa LUT đó |
| TC-13 | api | Pro không giới hạn | khách Pro (mock-pay) | tạo 5 bộ | cả 5: 200 |
| TC-14 | api | Tạo kèm LUT | khách Miễn phí | `update { name: "Ấm", lutId: <xanh-dien-anh> }`; `update { name: "Lạnh", lutId: <thu-nghiem-nhap> }`; `my-list` | 200, `itemCount` 1, `coverUrls[0]` = `coverUrl` của xanh-dien-anh (`lut/public/get`), `containsLut` true; 404 "Không tìm thấy LUT"; `my-list` chỉ có "Ấm" |
| TC-15 | api | Thêm LUT, thêm lặp, thứ tự | bộ A, B (B tạo sau) | `item/add { A, mua-thu-ha-noi }`, `item/add { A, kodak-400 }`, lặp lại lần 2; `my-list` | 200, `itemCount` 1 → 2 → 2 (lặp không tăng), `containsLut` true; `my-list[0].id` = A (vừa sửa); `coverUrls` = [kodak-400, mua-thu-ha-noi] |
| TC-16 | api | Lỗi khi thêm | bộ A của khách 1; bộ C của khách 2 | khách 1 `item/add { C, noir }`; `item/add { A, <thu-nghiem-nhap> }`, `{ A, <hoang-hon-cu> }`, `{ A, 999999 }`; `{ 999999, noir }` | 404 "Không tìm thấy bộ sưu tập"; 3 lần 404 "Không tìm thấy LUT"; 404 "Không tìm thấy bộ sưu tập" |
| TC-17 | api | LUT bị ẩn, xuất bản lại, bị xoá | admin tạo + xuất bản LUT H "Bộ Sưu Tập Thử"; khách thêm H và noir vào A | admin `lut/hide/{H}` → `get A`; admin `lut/publish/{H}` → `get A`; admin hide rồi `lut/delete/{H}` → `get A` | ẩn: `luts` chỉ có noir, `itemCount` 1, `coverUrls` không có ảnh H; xuất bản lại: H quay lại, `itemCount` 2; xoá: 200 (không lỗi FK), `luts` chỉ noir |
| TC-18 | api | `containsLut` theo `lutId` | A chứa noir, B không | `my-list?lutId=<noir>`; `my-list?lutId=999999`; `my-list` | A true, B false; cả hai false; không phần tử nào có khoá `containsLut` |
| TC-19 | api | Xem một bộ | A có noir (lưu trước) rồi xanh-dien-anh | `get?id=A`; khách khác `get?id=A`; `get?id=999999`; `get` không `id` | 200, `luts` = [xanh-dien-anh, noir], mỗi LUT có `slug`, `creatorName`, `coverUrl`, `categories`, không có `fileKey`, `status`; 3 lần 404 "Không tìm thấy bộ sưu tập" |
| TC-20 | api | Đổi tên | A "Ấm", B "Lạnh" | `update { id: A, name: "Ấm áp" }`; `{ id: A, name: "ấm ÁP" }`; `{ id: A, name: "Lạnh" }`; khách khác `{ id: A, name: "X" }`; `{ id: 999999, name: "X" }` | 200 "Ấm áp"; 200 (chính nó); 400 `COLLECTION_NAME_EXISTS`; 404 bộ sưu tập; 404 bộ sưu tập |
| TC-21 | api | Bỏ LUT | A chứa noir | `item/remove { A, noir }` 2 lần; khách khác `item/remove { A, noir }` | 200 `itemCount` 0, `containsLut` false; lần 2 vẫn 200; 404 "Không tìm thấy bộ sưu tập" |
| TC-22 | api | Xoá bộ, xoá xong tạo lại được | khách Miễn phí có 3 bộ, A chứa noir | khách khác `delete/A`; `delete/A`; `get?id=A`; `update { name: <tên A> }`; `update { name: "Bộ mới" }` | 404; 200 `result` = A; 404; 200 (tên cũ dùng lại được, `itemCount` 0); 403 `COLLECTION_LIMIT` (đã đủ 3 lại) |
| TC-23 | e2e | Chưa đăng nhập: lưu từ thẻ → đăng ký → mở tiếp hộp thoại lưu | chưa đăng nhập, `/luts` | rê chuột thẻ "Xanh Điện Ảnh", bấm "Thêm Xanh Điện Ảnh vào bộ sưu tập" → điền đăng ký email mới | hộp thoại "Tạo tài khoản để lưu bộ sưu tập" có thẻ "Xanh Điện Ảnh"; sau đăng ký: hộp thoại "Lưu vào bộ sưu tập", mô tả "Đặt tên cho bộ sưu tập đầu tiên của bạn."; **không** có sự kiện download |
| TC-24 | e2e | Tạo bộ đầu tiên trong hộp thoại | như TC-23 | gõ "Phim cưới mùa thu" vào "Tên bộ sưu tập mới", bấm "Tạo và lưu" | toast "Đã tạo “Phim cưới mùa thu” và lưu LUT"; `ul[aria-label="Bộ sưu tập của bạn"]` có checkbox "Phim cưới mùa thu" đã tích, chữ "1 LUT"; ô tên trống |
| TC-25 | e2e | Tích / bỏ tích, mở lại thấy đúng | khách có bộ "Ấm", "Lạnh" (API), `/luts` | mở hộp thoại cho "Noir", tích "Ấm" → bỏ tích "Ấm" → tích "Lạnh" → "Xong" → mở lại | toast "Đã lưu vào “Ấm”", "Đã bỏ khỏi “Ấm”", "Đã lưu vào “Lạnh”"; mở lại: "Lạnh" tích, "Ấm" không |
| TC-26 | e2e | Validate tên trong hộp thoại | khách có bộ "Ấm" | bấm "Tạo và lưu" khi trống; gõ 101 ký tự; gõ "ấm" | "Nhập tên bộ sưu tập"; "Tên tối đa 100 ký tự"; "Bạn đã có bộ sưu tập tên này" dưới ô, không có toast lỗi, không request khi lỗi client |
| TC-27 | e2e | Hết lượt trong hộp thoại | khách Miễn phí có 3 bộ | mở hộp thoại lưu cho "Noir" | không có ô "Tên bộ sưu tập mới"; có "Gói Miễn phí lưu được tối đa 3 bộ sưu tập." và link "Nâng cấp Pro" → bấm → URL `/pricing`, hộp thoại đóng |
| TC-28 | e2e | Trang chi tiết: "Lưu vào bộ sưu tập" → "Đã lưu" | khách có bộ "Ấm" trống, `/luts/noir` | thấy nút "Lưu vào bộ sưu tập"; bấm, tích "Ấm", "Xong" | nút đổi thành "Đã lưu" (không tải lại trang) |
| TC-29 | e2e | Trang `/bo-suu-tap` có dữ liệu | khách có "Ấm" (2 LUT), "Lạnh" (trống) | mở bằng mục "Bộ sưu tập" ở menu trái; rồi mở lại bằng menu tài khoản "Bộ sưu tập của tôi" | `h1` "Bộ sưu tập của tôi"; "2 bộ sưu tập · Gói Miễn phí: tối đa 3 bộ"; thẻ "Ấm" có "2 LUT" và 2 ảnh; thẻ "Lạnh" có "Chưa có LUT"; cả hai đường vào đều tới `/bo-suu-tap` |
| TC-30 | e2e | Tạo, đổi tên, xoá ở trang danh sách | khách không có bộ | trang trống "Chưa có bộ sưu tập nào" → "Tạo bộ sưu tập" → gửi trống → gõ "Du lịch biển" → "Tạo"; "Tuỳ chọn cho Du lịch biển" → "Đổi tên" → "Biển Nha Trang" → "Lưu"; "Tuỳ chọn cho Biển Nha Trang" → "Xoá" → "Xoá bộ sưu tập" | "Nhập tên bộ sưu tập"; toast "Đã tạo bộ sưu tập “Du lịch biển”", thẻ hiện, vẫn ở `/bo-suu-tap`; toast "Đã đổi tên bộ sưu tập", thẻ "Biển Nha Trang"; AlertDialog "Xoá bộ sưu tập “Biển Nha Trang”?", toast "Đã xoá bộ sưu tập “Biển Nha Trang”", về trạng thái trống |
| TC-31 | e2e | Băng hết lượt ở trang danh sách | khách Miễn phí có 3 bộ | mở `/bo-suu-tap`; xoá 1 bộ | có "Bạn đã dùng hết 3 bộ sưu tập của gói Miễn phí." + link "Nâng cấp Pro", nút "Tạo bộ sưu tập" disabled; sau khi xoá: băng biến mất, nút bấm được |
| TC-32 | e2e | Khách Pro không thấy giới hạn | khách Pro có 3 bộ | mở `/bo-suu-tap`, mở hộp thoại lưu | dòng phụ "3 bộ sưu tập" (không có "tối đa"); không có băng; hộp thoại vẫn có "Tên bộ sưu tập mới" |
| TC-33 | e2e | Trang một bộ, bỏ LUT có hoàn tác | khách có "Ấm" chứa noir, xanh-dien-anh | bấm thẻ "Ấm" → `/bo-suu-tap/{id}`; bấm "Bỏ Noir khỏi bộ sưu tập" → "Hoàn tác"; bấm lại "Bỏ Noir khỏi bộ sưu tập", chờ toast tắt, tải lại trang | `h1` "Ấm", "2 LUT", đường dẫn "Bộ sưu tập của tôi"; bỏ: thẻ Noir mất, toast "Đã bỏ “Noir” khỏi bộ sưu tập"; hoàn tác: thẻ Noir quay lại; tải lại: chỉ còn Xanh Điện Ảnh, "1 LUT" |
| TC-34 | e2e | Đổi tên / xoá ở trang một bộ | như TC-33 | "Đổi tên" → "Ấm áp" → "Lưu"; "Xoá" → "Xoá bộ sưu tập" | `h1` "Ấm áp", `document.title` "Ấm áp – Bộ sưu tập \| DownBeat"; xoá xong URL `/bo-suu-tap`, toast "Đã xoá bộ sưu tập “Ấm áp”", không còn thẻ |
| TC-35 | e2e | Bộ trống, 404 | khách 1 có bộ trống "Lạnh"; bộ X của khách 2 | mở `/bo-suu-tap/{Lạnh}`; `/bo-suu-tap/999999`; `/bo-suu-tap/{X}`; `/bo-suu-tap/abc` | "Bộ sưu tập này chưa có LUT" + "Khám phá kho LUT"; 3 lần "Không tìm thấy bộ sưu tập" |
| TC-36 | e2e | Chưa đăng nhập mở `/bo-suu-tap` | chưa đăng nhập; khách có sẵn 1 bộ "Ấm" | mở `/bo-suu-tap` → "Đăng nhập" → đăng nhập khách đó | "Đăng nhập để xem bộ sưu tập", nút "Đăng nhập", "Tạo tài khoản"; sau đăng nhập: thẻ "Ấm" hiện, không tải lại trang |
| TC-37 | e2e | Đăng nhập từ nút lưu giữ `then` | chưa đăng nhập, khách có sẵn | `/luts/noir` → "Lưu vào bộ sưu tập" → hộp thoại đăng ký → "Đăng nhập" (chuyển) → đăng nhập | hộp thoại đăng nhập mô tả "Đăng nhập để lưu LUT vào bộ sưu tập."; sau đăng nhập: "Lưu vào bộ sưu tập" có thẻ "Noir"; không có sự kiện download |
| TC-38 | e2e | Hồi quy: tải vẫn nối tiếp sau đăng ký | chưa đăng nhập, `/luts/noir` | "Tải miễn phí" → đăng ký | có sự kiện download "Noir-LUT-DownBeat.zip", hộp thoại "Đã tải xong" (hành vi cũ không đổi) |
| TC-39 | e2e | Điện thoại | viewport 390×844, khách có "Ấm" 2 LUT | mở `/bo-suu-tap`, `/bo-suu-tap/{Ấm}`, hộp thoại lưu cho Noir | `findHorizontalOverflow` rỗng ở cả 3; nút "Tuỳ chọn cho Ấm" và "Bỏ Noir khỏi bộ sưu tập" thấy được không cần rê chuột; "Xong" thấy được sau khi cuộn |

### 9.1 Đối chiếu

- Endpoint §5 → TC `api`: `my-list` TC-10, 15, 18 · `get` TC-17, 19, 22 · `update` (tạo) TC-10 → 14, 22 · `update` (đổi tên) TC-20 · `delete` TC-22 · `item/add` TC-15, 16, 17 · `item/remove` TC-21.
- Lỗi §5.7 → TC `api`: 401 TC-09 · 404 bộ sưu tập TC-16, 19, 20, 21, 22 · 404 LUT TC-14, 16 · 403 `COLLECTION_LIMIT` TC-12, 22 · 400 `COLLECTION_NAME_EXISTS` TC-11, 20.
- Luồng §3: chính TC-23, 24 · A1 TC-25 · A2 TC-28 · A3 TC-23, 37 · A4 TC-30 · A5 TC-33 · A6 TC-13, 32 · A7 TC-17 · A8 TC-01 (unit; API không giả được gói hết hạn), TC-31 · E1 TC-09 · E2 TC-12, 27 · E3 TC-11, 26 · E4 TC-16, 19, 35 · E5 TC-14, 16.

## 10. Tiêu chí hoàn thành

- [x] Mọi TC ở §9 pass; `tai-lut.spec.ts`, `shop-flows.spec.ts`, `tai-khoan-khach.spec.ts` vẫn pass (đụng `shop-dialogs.tsx`, `lut-card.tsx`) — 39/39 pass cho spec của lát; ba spec hồi quy còn lại chưa chạy lại ở phiên C (chỉ TC-38 hồi quy luồng tải)
- [x] `mvn test`, `pnpm build`, `pnpm lint` xanh
- [x] `grep -rn "Bộ sưu tập sẽ có ở bản sau" frontend/src` rỗng
- [ ] Sau E2E: `SHOW CREATE TABLE collection` có `COLLATE utf8mb4_0900_as_ci` ở cột `name`; `SELECT COUNT(*) FROM collection_item ci LEFT JOIN lut l ON l.id = ci.lut_id WHERE l.id IS NULL` = 0 — chưa kiểm ở phiên C (không truy cập DB trực tiếp); collation đã nằm trong V9 và TC-11 / TC-22 / TC-17 phủ hành vi
- [x] Có `docs/chuc-nang/bo-suu-tap.md`

## 11. Rủi ro / câu hỏi mở

1. **Gói hết hạn khi đang có hơn 3 bộ**: plan chọn giữ nguyên mọi bộ, vẫn thêm / bỏ LUT, chỉ chặn tạo mới tới khi còn dưới 3 bộ. Phương án khác: khoá (chỉ xem) các bộ thứ 4 trở đi. Giữ phương án của plan?
2. **Tên phân biệt dấu**: "Ấm" và "Âm" là hai bộ khác nhau, "ấm" và "ẤM" trùng (collation `utf8mb4_0900_as_ci` riêng cho cột `name`). Đồng ý?
3. **Bộ của người khác trả 404, không phải 403** (không lộ id có tồn tại). Đồng ý?
4. **Thẻ ở lưới `/luts` không hiện trạng thái "đã lưu"** (chỉ trang chi tiết có "Đã lưu"): muốn hiện trên thẻ cần thêm một API trả danh sách `lutId` khách đã lưu và sửa `LutCard` ở mọi lưới. Để lát sau nếu cần?
5. **`get` không phân trang**: một bộ của khách Pro có thể có vài trăm LUT; với kho 36 LUT (đồ án) là đủ. Khi kho lớn mới thêm `page`, `limit` (giữ khoá `luts`).
6. **Tạo kèm LUT trong một request** (`update { name, lutId }`) thay vì FE gọi `update` rồi `item/add`: một transaction, tránh tạo bộ trống khi lần gọi thứ hai lỗi. Lệch nhẹ so với thiết kế §5.4 (thêm field `lutId` tạm vào body `update`).
7. **Hai request tạo cùng lúc ở gói Miễn phí** có thể vượt 3 bộ (đếm rồi mới chèn, không khoá). Chấp nhận với đồ án; muốn chặn tuyệt đối thì `SELECT … FOR UPDATE` trên dòng `user_app` trong transaction.
8. **Bảng giá**: hàng so sánh "Bộ sưu tập: 3 bộ / Không giới hạn / Không giới hạn" đã có (`lib/mock/data/plans.ts`), danh sách quyền lợi gói Miễn phí trong DB (`plan.features`) chưa ghi "3 bộ sưu tập". Plan **không** sửa `plan.features`; muốn thêm thì một câu UPDATE trong V9.

## 12. Nhật ký thực hiện (do /cook và /doc-chuc-nang ghi — nối các phiên A/B/C)

| Thời điểm | Sự kiện |
|---|---|
| 2026-11-10 | Lập plan (draft) |
| 2026-11-10 | Người dùng duyệt (approved), giữ phương án mặc định §11 |
| 2026-11-10 | /cook phiên A: status → in-progress. Preflight xanh (Orca ready, `downBeat-mysql` / `downBeat-minio` healthy, backend **:9500** 200 — cổng 9500 theo quy ước mới chưa chuyển, lát này vẫn chạy 9500). File bẩn có sẵn trước khi giao: `.env.example`, `AGENTS.md`, `CLAUDE.md`, `backend/CLAUDE.md`, `backend/authenticate/.../RestService.java`, `docker-compose.yml`, `docs/plan/README.md`, `docs/tai-lieu-thiet-ke.md`, `plan/README.md`, `plan/_template.md`, `plan/thiet-ke-tong-quat.md`, `plan/bo-suu-tap.md` (mới) |
| 2026-11-10 | Spec nghiệm thu `frontend/tests/e2e/bo-suu-tap.spec.ts`: 31 test (API TC-09 → TC-22 = 14, giao diện TC-23 → TC-39 = 17), `--list` + tsc + eslint sạch. Các test kiểm thứ tự chờ 1,1 s giữa hai lần ghi (DATETIME tính theo giây) |
| 2026-11-10 | Task spec: `plan/tasks/bo-suu-tap-be.md`, `plan/tasks/bo-suu-tap-fe.md`. Orca run `run_58c31c83eeba`, coordinator `term_9684e52e-0cf0-4f36-be3c-feb0b35e5d90` (mọi lệnh kèm `--from`, `check` kèm `--terminal`; worktree `path:C:/Users/JulytusChu/Desktop/Code/DownBeat`) |
| 2026-11-10 | agy BE (gemini-3.8-flash-high): dispatch `ctx_6a0df4fcc242`, task `task_34cd5a5ba362`, terminal `term_8273d521-dc64-4cc5-b9c0-6cfc96d82033`. agy FE (gemini-3.8-flash-high): dispatch `ctx_24a3bceff29f`, task `task_06831b6cedc4`, terminal `term_9c009d5b-77f0-4f23-89dc-ad4c014326a3`. Cả hai `turnStart: observed` |
| 2026-11-10 | **phiên A xong** — phiên B bắt đầu ở bước 4 (check `--run run_58c31c83eeba --terminal term_9684e52e-…`) |
| 2026-11-10 | phiên B bắt đầu. agy FE `worker_done` (succeeded, 12:03Z): types/axios/options/hook, hộp thoại lưu, trang `/bo-suu-tap` + chi tiết, thẻ LUT/chi tiết/sidebar/header; build + lint sạch theo báo cáo. agy BE còn `implementing`; backend :9500/:9500 đang tắt |
| 2026-11-10 | Review FE vòng 1: build + lint xanh (0 error). Lỗi: (1) toast/invalidate gọi tay trong 4 component, options có `meta` viết sẵn nhưng không dùng; `item/remove` ở trang chi tiết không xử lý lỗi; (2) ô nhập tự viết thay `ShopField`; (3) mô tả hộp thoại 6.3 không là `DialogDescription`. Giao `plan/tasks/bo-suu-tap-fe-fix1.md` trên terminal FE cũ: dispatch `ctx_9f4435a276e9`, task `task_14ae2047bb0b` |
| 2026-11-10 | agy BE `worker_done` (succeeded, 12:08Z): V9, ErrorCode, POJO `LutCollection`/`CollectionItem`, repository/service/controller 6 endpoint, `CollectionServiceTest` TC-01→08; báo cáo mvn 63 pass, API bo-suu-tap 14/14, hồi quy kho-lut + quan-ly-lut API 40/40, không lệch plan |
| 2026-11-10 | Review BE vòng 1: **sạch**, không giao sửa. Diff chỉ `backend/**` (+ file bẩn có sẵn). Thứ tự quy tắc §5.3–5.6 đúng, `my-list` 3 câu (không N+1), không trả `userId`. mvn business 63/63 (CollectionServiceTest 8/8). Restart :9500, Flyway "up to date" (V9 đã áp lúc worker chạy). API E2E 13/14: TC-13 đỏ vì `order/create` → 502 `PAYMENT_GATEWAY_ERROR`, log backend "PayOS createLink … Read/Connect timed out" (mạng ra payOS thật, không thuộc lát này) — chạy lại ở bước 7 |
| 2026-11-10 | agy FE fix1 `worker_done` (succeeded): toast/invalidate qua `meta` (thêm `silentError` dạng hàm ở `MutationCache` + `getServerErrorCode`), `ShopField`, `DialogDescription`; ngoại lệ duy nhất toast "Hoàn tác" ở trang chi tiết (có comment). Review FE vòng 2: **sạch** — build ✓, lint 0 error, `pnpm api:types` sinh `/collection/*`, `LutCollection` khớp type tay; không đụng `tests/e2e` |
| 2026-11-10 | E2E có giao diện (`--headed`, slowMo 400, `E2E_DOC_SHOTS`): **31/31 pass** (2,0 phút; API 14/14 gồm TC-13 — payOS đã thông lại; giao diện 17/17). 20 ảnh ở `docs/chuc-nang/img/bo-suu-tap/` |
| 2026-11-10 | Release 3 dispatch (`ctx_6a0df4fcc242`, `ctx_24a3bceff29f`, `ctx_9f4435a276e9`), `worker-list --terminal-state reclaimable` rỗng. Vòng sửa: BE 0, FE 1. Lệch plan: không có (spec nghiệm thu không sửa). Ghi chú: backend chạy :9500 (quy ước cổng local chốt lại 9500 / 4500); `MutationCache` thêm `silentError` dạng hàm (dùng chung được cho lát sau); `api.gen.ts` đã sinh lại. **phiên B xong** |
| 2026-11-10 | /doc-chuc-nang (phiên C): viết `docs/chuc-nang/bo-suu-tap.md` (20 ảnh, 39/39 pass: JUnit 8 + Playwright 31), plan → done, cập nhật `plan/README.md`, `docs/plan/README.md` (giai đoạn 1 done), commit + push + PR vào `main` |
