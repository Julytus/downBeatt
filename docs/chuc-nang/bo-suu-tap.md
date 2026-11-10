# Bộ sưu tập (lưu LUT thành từng bộ, gói Miễn phí tối đa 3 bộ, trang "Bộ sưu tập của tôi")

> Plan: [plan/bo-suu-tap.md](../../plan/bo-suu-tap.md) · Route: `/bo-suu-tap`, `/bo-suu-tap/<id>`, hộp thoại "Lưu vào bộ sưu tập" ở `/luts` và `/luts/<slug>` · Phạm vi: backend + frontend

## 1. Mục tiêu

Trước chức năng này, nút + trên thẻ LUT chỉ báo "Bộ sưu tập sẽ có ở bản sau". Chức năng này cho **khách đã đăng nhập lưu LUT vào các bộ sưu tập có tên** (ví dụ "Phim cưới mùa thu"):

- Bấm nút + trên thẻ LUT, hoặc "Lưu vào bộ sưu tập" ở trang chi tiết, thì mở hộp thoại chọn bộ: bật / tắt từng bộ, hoặc tạo bộ mới ngay trong hộp thoại (tạo và lưu LUT trong một request).
- Trang `/bo-suu-tap` liệt kê các bộ (ảnh ghép tối đa 4 LUT, số LUT); trang `/bo-suu-tap/<id>` hiện lưới LUT của một bộ, cho đổi tên, xoá bộ, bỏ từng LUT (có "Hoàn tác").
- Gói Miễn phí tạo tối đa 3 bộ; Pro / Studio không giới hạn. Số LUT trong một bộ không giới hạn ở mọi gói.
- Bảng `collection_item` là nguồn tín hiệu "yêu thích" mà lát `ho-so-nguoi-dung` (2.2) sẽ đọc thẳng.

Chưa làm (để lát sau): đọc `collection_item` làm tín hiệu gợi ý, trạng thái "đã lưu" trên từng thẻ ở lưới (cần thêm API), chia sẻ bộ công khai, sắp xếp tay, mô tả / ảnh bìa tuỳ chọn, tải cả bộ thành một file zip, phân trang `get`.

## 2. Luồng sử dụng

**Luồng chính.** Khách Miễn phí đã đăng nhập rê chuột vào thẻ "Xanh Điện Ảnh", bấm nút +. Hộp thoại "Lưu vào bộ sưu tập" mở và gọi `GET /collection/my-list?lutId=…`. Chưa có bộ nào nên hộp thoại hiện ô "Tên bộ sưu tập mới"; khách gõ "Phim cưới mùa thu", bấm "Tạo và lưu" → `POST /collection/update { name, lutId }`. Backend tạo bộ và thêm LUT trong một transaction; toast "Đã tạo “Phim cưới mùa thu” và lưu LUT", bộ mới nằm đầu danh sách, đã tích, "1 LUT".

**Luồng phụ.**

- **Đã có bộ**: hộp thoại liệt kê các bộ (mới sửa gần nhất lên đầu), bộ nào đang chứa LUT thì đã tích. Tích → `item/add`, bỏ tích → `item/remove`; lưu vào nhiều bộ cùng lúc được.
- **Trang chi tiết**: nút "Lưu vào bộ sưu tập"; LUT đã nằm trong ít nhất một bộ thì nhãn đổi thành "Đã lưu" (bấm vẫn mở hộp thoại).
- **Chưa đăng nhập** bấm lưu: hộp thoại "Tạo tài khoản để lưu bộ sưu tập" kèm thẻ LUT; đăng ký / đăng nhập xong mở tiếp hộp thoại lưu (không tải LUT). Chuyển qua lại "Đăng nhập" ↔ "Đăng ký" vẫn giữ ý định lưu. Nút "Tải" vẫn nối tiếp sang tải như cũ.
- **Trang `/bo-suu-tap`**: "Tạo bộ sưu tập", menu "⋯" trên thẻ bộ (Đổi tên, Xoá có hộp thoại xác nhận). Lối vào: mục "Bộ sưu tập" ở menu trái và "Bộ sưu tập của tôi" ở menu tài khoản.
- **Trang một bộ**: nút "Bỏ khỏi bộ sưu tập" trên thẻ LUT, thẻ biến mất ngay, toast có nút "Hoàn tác" (gọi lại `item/add`).
- **LUT bị quản trị ẩn**: biến khỏi lưới, không tính vào số LUT và ảnh ghép, nhưng dòng lưu vẫn giữ; xuất bản lại thì hiện lại. LUT bị xoá hẳn thì dòng lưu tự xoá theo (CASCADE).
- **Gói trả phí hết hạn khi đang có hơn 3 bộ**: giữ mọi bộ, vẫn thêm / bỏ LUT, đổi tên, xoá được; chỉ không tạo thêm khi còn từ 3 bộ trở lên. Trang hiện băng "Bạn đã dùng hết 3 bộ sưu tập của gói Miễn phí."

**Ngoại lệ.**

- Không token, hoặc token hết hạn mà refresh hỏng: 401; giao diện xoá phiên, hộp thoại / trang về trạng thái chưa đăng nhập.
- Gói Miễn phí đã có từ 3 bộ mà tạo thêm: 403 `COLLECTION_LIMIT`, không ghi gì (kể cả LUT kèm theo). Giao diện bình thường đã ẩn ô tạo trước đó; lỗi này chỉ gặp khi dữ liệu trên trình duyệt đã cũ.
- Tên trùng một bộ khác của chính khách: 400 `COLLECTION_NAME_EXISTS`, hiện dưới ô nhập, không toast.
- Bộ không có, của khách khác, hoặc thiếu id: 404 "Không tìm thấy bộ sưu tập" (không dùng 403 để không lộ id nào có tồn tại).
- LUT không có / chưa xuất bản / đã ẩn khi **thêm**: 404 "Không tìm thấy LUT". Bỏ LUT thì không kiểm LUT.

## 3. Cơ sở dữ liệu

Migration mới `V9__bo_suu_tap.sql`, hai bảng, không seed, không migration phân quyền (API khách, chỉ cần token, không tạo resource).

**`collection`**

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | int PK AUTO_INCREMENT | |
| `user_id` | int NOT NULL | FK → `user_app(id)` ON DELETE CASCADE |
| `name` | varchar(100) NOT NULL, `COLLATE utf8mb4_0900_as_ci` | Collation riêng cột: không phân biệt hoa thường nhưng **phân biệt dấu** ("phim CƯỚI" trùng "Phim cưới", "Phim cuoi" thì không; collation mặc định `ai_ci` sẽ coi "Ấm" = "Âm" = "am", sai với tiếng Việt) |
| `created_time` | datetime | Mặc định `CURRENT_TIMESTAMP` |
| `updated_time` | datetime | `ON UPDATE CURRENT_TIMESTAMP`; thêm / bỏ LUT thì service tự cập nhật (vì không đụng dòng `collection`) |

Ràng buộc: `uq_collection_user_name (user_id, name)`; index `idx_collection_user (user_id, updated_time)`. Xoá bộ là xoá cứng, kéo theo `collection_item`.

**`collection_item`** (bảng nối, không có cột `id`)

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `collection_id` | int NOT NULL | FK → `collection(id)` ON DELETE CASCADE |
| `lut_id` | int NOT NULL | FK → `lut(id)` ON DELETE CASCADE |
| `created_time` | datetime | Thứ tự hiện trong bộ (mới lưu lên đầu); lát 2.2 dùng làm thời điểm tín hiệu "yêu thích" |

Khoá chính `(collection_id, lut_id)` nên lưu trùng không sinh dòng thứ hai; index `idx_collection_item_lut (lut_id)`.

## 4. Backend

Package mới `vn.aeoc.business.collection` (`CollectionController`, `CollectionService`, `CollectionRepository`). POJO `LutCollection` (tên này để không đụng `java.util.Collection`) và `CollectionItem` ở module `entity`; `ErrorCode` thêm `COLLECTION_LIMIT` (403) và `COLLECTION_NAME_EXISTS` (400); `LutService` thêm `listPublishedByIds` (đúng thứ tự id, đã gắn thẻ và danh mục) và `isPublished`. Cấu hình `collection.free-limit` (mặc định 3, biến môi trường `COLLECTION_FREE_LIMIT`).

Mọi endpoint cần token (không nằm trong whitelist, không gọi `checkPermission`); `userId` luôn lấy từ token, response không bao giờ trả `userId`.

| Method | Đường dẫn | Việc | Response `result` |
|---|---|---|---|
| GET | `/api/collection/my-list?lutId=` | Các bộ của tôi, `updated_time DESC, id DESC`; có `lutId` thì mỗi bộ kèm `containsLut` | mảng bộ |
| GET | `/api/collection/get?id=` | Một bộ kèm `luts` (LUT `PUBLISHED`, mới lưu lên đầu, cùng dạng với `lut/public/list`) | bộ |
| POST | `/api/collection/update` | Tạo (không có `id`; có thể kèm `lutId`) hoặc đổi tên (`id > 0`) | bộ |
| POST | `/api/collection/delete/{id}` | Xoá bộ | id đã xoá |
| POST | `/api/collection/item/add` | Lưu LUT vào bộ (lặp lại là no-op 200) | bộ, `containsLut: true` |
| POST | `/api/collection/item/remove` | Bỏ LUT khỏi bộ (không có thì vẫn 200) | bộ, `containsLut: false` |

Đối tượng bộ: `id, name, itemCount, coverUrls (tối đa 4 ảnh bìa, mới nhất trước), containsLut (chỉ khi có lutId), luts (chỉ ở get), createdTime, updatedTime`. `itemCount`, `coverUrls`, `luts` chỉ tính LUT `PUBLISHED`.

**Quy tắc tạo bộ** (gặp lỗi đầu tiên thì dừng, chưa ghi gì): trim tên → có `lutId` thì LUT phải `PUBLISHED` → khách không có subscription `ACTIVE` còn hạn mà đã có từ 3 bộ thì `COLLECTION_LIMIT` → tên trùng thì `COLLECTION_NAME_EXISTS` → một transaction INSERT `collection` (+ `collection_item` nếu có LUT). Hai request cùng lúc dính UNIQUE cũng thành `COLLECTION_NAME_EXISTS` (bắt `DuplicateKeyException`). Đổi tên chỉ UPDATE cột `name`, không kiểm giới hạn số bộ. Backend không kiểm tên rỗng / quá 100 ký tự (frontend kiểm).

`my-list` chạy đúng 3 câu SQL bất kể số bộ (danh sách bộ; `collection_item JOIN lut` để đếm và lấy ảnh; bộ nào chứa `lutId`), không N+1.

Lỗi nghiệp vụ:

| Tình huống | HTTP | errorCode | Message |
|---|---|---|---|
| Không token / token sai | 401 | `LOGIN` / `UNAUTHORIZED` (filter có sẵn) | Chưa đăng nhập / Token không hợp lệ hoặc sai chữ ký |
| Bộ không có / của khách khác / thiếu id | 404 | `DATA_NOT_FOUND` | Không tìm thấy bộ sưu tập |
| LUT không có / chưa xuất bản / đã ẩn (khi thêm) | 404 | `DATA_NOT_FOUND` | Không tìm thấy LUT |
| Gói Miễn phí đã có từ 3 bộ mà tạo thêm | 403 | `COLLECTION_LIMIT` (mới) | Gói Miễn phí lưu được tối đa 3 bộ sưu tập |
| Trùng tên bộ khác của chính khách | 400 | `COLLECTION_NAME_EXISTS` (mới) | Bạn đã có bộ sưu tập tên này |

## 5. Giao diện

**Điểm vào** (`hooks/use-save-to-collection.ts`): `LutGrid` / `LutCard` (kho, danh mục, "Có thể bạn cũng thích") và trang chi tiết dùng chung một hook; chưa đăng nhập thì mở hộp thoại đăng ký với `then: "collection"`, đã đăng nhập thì mở hộp thoại lưu. Hai chỗ toast giữ chỗ cũ đã được xoá. Trang chi tiết đọc `my-list?lutId=` để hiện "Đã lưu".

**Hộp thoại "Lưu vào bộ sưu tập"** (`save-to-collection-panel.tsx`, loại `collection` trong `ShopDialogs`):

- Danh sách `ul` "Bộ sưu tập của bạn": mỗi dòng là checkbox có nhãn là tên bộ và chữ nhỏ "{n} LUT" / "Trống"; dòng đang gửi bị khoá kèm spinner. Đang tải: 3 `Skeleton`; lỗi tải: "Không tải được bộ sưu tập" + "Thử lại".
- Khối tạo mới: "Tên bộ sưu tập mới" + "Tạo và lưu" (Enter cũng gửi). Rỗng → "Nhập tên bộ sưu tập"; quá 100 ký tự → "Tên tối đa 100 ký tự" (không gửi request); trùng tên → "Bạn đã có bộ sưu tập tên này" dưới ô.
- Hết lượt (Miễn phí, đã có từ 3 bộ, hoặc vừa nhận `COLLECTION_LIMIT`): thay khối tạo bằng "Gói Miễn phí lưu được tối đa 3 bộ sưu tập." và link "Nâng cấp Pro".
- Chân: "Xem bộ sưu tập của tôi" và nút "Xong".

**Trang `/bo-suu-tap`** (`collections-page.tsx`): `h1` "Bộ sưu tập của tôi", dòng phụ "{n} bộ sưu tập" (Miễn phí thêm " · Gói Miễn phí: tối đa 3 bộ"). Lưới 1 / 2 / 3 / 4 cột theo độ rộng; thẻ có ảnh ghép 16:9 (1 ảnh đầy khung, 2 ảnh chia đôi, 3–4 ảnh lưới 2×2, bộ trống hiện "Chưa có LUT"), tên, số LUT, menu "⋯". Hết lượt thì nút "Tạo bộ sưu tập" bị khoá và có băng thông báo kèm "Nâng cấp Pro". Trạng thái trống, lỗi tải và chưa đăng nhập ("Đăng nhập để xem bộ sưu tập") đều có khối riêng.

**Trang `/bo-suu-tap/$id`** (`collection-detail-page.tsx`): đường dẫn, `h1` tên bộ, "Đổi tên", "Xoá", "Thêm LUT từ kho"; lưới dùng lại `LutCard` với prop mới `onRemove` (nút "Bỏ {LUT} khỏi bộ sưu tập"). Bộ trống, 404 (id không có, của người khác, không phải số) và chưa đăng nhập đều có khối riêng. `document.title` là "{tên} – Bộ sưu tập | DownBeat".

**Hộp thoại tên bộ** (tạo / đổi tên, `collection-name-dialog.tsx`) và **hộp thoại xoá** (`delete-collection-dialog.tsx`, AlertDialog nêu số LUT sẽ được bỏ lưu). **Điện thoại (≤ 640 px)**: không tràn ngang ở hai trang và hộp thoại lưu; nút "⋯" và "Bỏ khỏi bộ sưu tập" luôn hiện, hộp thoại lưu cuộn được.

Mã dùng chung: `lib/types/collection.ts`, `lib/axios/collection.ts`, `lib/tanstack/options/collection.ts` (toast và làm mới query `["collections"]` đặt ở `meta` của mutation), `lib/stores/shop-dialog.ts` (loại `collection`, `then` ở `login` / `register`), `lib/tanstack/query-client/index.ts` (`silentError` nhận được cả hàm để một số mã lỗi tự xử lý tại chỗ). `api.gen.ts` được sinh lại có `/collection/*`.

### Hình ảnh

![Đăng ký để lưu](img/bo-suu-tap/01-dang-ky-de-luu.png)

Khách chưa đăng nhập bấm nút + trên thẻ: hộp thoại "Tạo tài khoản để lưu bộ sưu tập" kèm thẻ LUT.

![Hộp thoại lưu, chưa có bộ](img/bo-suu-tap/02-hop-thoai-trong.png)

Sau đăng ký, hộp thoại "Lưu vào bộ sưu tập" yêu cầu đặt tên cho bộ đầu tiên.

![Đã tạo và lưu](img/bo-suu-tap/03-da-tao-va-luu.png)

Tạo "Phim cưới mùa thu" ngay trong hộp thoại: bộ mới đã tích, "1 LUT", có toast xác nhận.

![Tích bộ sưu tập](img/bo-suu-tap/04-tich-bo-suu-tap.png)

Khách có nhiều bộ: tích / bỏ tích từng bộ, mỗi lần một toast.

![Trùng tên](img/bo-suu-tap/05-trung-ten.png)

Tên trùng một bộ sẵn có (không phân biệt hoa thường): lỗi hiện dưới ô nhập, không toast.

![Hết lượt trong hộp thoại](img/bo-suu-tap/06-het-luot-hop-thoai.png)

Gói Miễn phí đã có 3 bộ: ô tạo mới được thay bằng thông báo giới hạn và link "Nâng cấp Pro".

![Trang chi tiết đã lưu](img/bo-suu-tap/07-chi-tiet-da-luu.png)

Trang chi tiết LUT sau khi lưu: nút đổi thành "Đã lưu".

![Danh sách bộ sưu tập](img/bo-suu-tap/08-danh-sach-bo-suu-tap.png)

Trang `/bo-suu-tap` với ảnh ghép, số LUT và dòng phụ "Gói Miễn phí: tối đa 3 bộ".

![Danh sách trống](img/bo-suu-tap/09-danh-sach-trong.png)

Khách chưa có bộ nào: lời mời tạo bộ và "Khám phá kho LUT".

![Tạo bộ sưu tập](img/bo-suu-tap/10-tao-bo-suu-tap.png)

Hộp thoại "Tạo bộ sưu tập" ở trang danh sách.

![Xác nhận xoá](img/bo-suu-tap/11-xac-nhan-xoa.png)

AlertDialog xác nhận xoá bộ, nêu số LUT sẽ được bỏ lưu.

![Hết lượt ở trang danh sách](img/bo-suu-tap/12-het-luot-trang.png)

Đủ 3 bộ ở gói Miễn phí: nút "Tạo bộ sưu tập" bị khoá, băng thông báo kèm "Nâng cấp Pro".

![Trang một bộ](img/bo-suu-tap/13-trang-mot-bo.png)

Trang một bộ: đường dẫn, tên, số LUT, lưới LUT với nút "Bỏ khỏi bộ sưu tập" trên mỗi thẻ.

![Bỏ LUT có hoàn tác](img/bo-suu-tap/14-bo-lut-hoan-tac.png)

Bỏ một LUT: thẻ biến mất, toast có nút "Hoàn tác".

![Bộ trống](img/bo-suu-tap/15-bo-trong.png)

Bộ chưa có LUT: hướng dẫn bấm nút + trong kho.

![Không tìm thấy](img/bo-suu-tap/16-khong-tim-thay.png)

Mở bộ không tồn tại hoặc của người khác: "Không tìm thấy bộ sưu tập".

![Mời đăng nhập](img/bo-suu-tap/17-moi-dang-nhap.png)

Chưa đăng nhập mở `/bo-suu-tap`: khối "Đăng nhập để xem bộ sưu tập".

![Điện thoại: danh sách](img/bo-suu-tap/18-dien-thoai-danh-sach.png)

Trang danh sách ở 390×844: một cột, nút "⋯" luôn hiện, không tràn ngang.

![Điện thoại: một bộ](img/bo-suu-tap/19-dien-thoai-mot-bo.png)

Trang một bộ ở 390×844: nút "Bỏ khỏi bộ sưu tập" luôn hiện.

![Điện thoại: hộp thoại lưu](img/bo-suu-tap/20-dien-thoai-hop-thoai.png)

Hộp thoại lưu ở 390×844: cuộn được trong khung, nút "Xong" thấy được.

## 6. Kiểm thử

JUnit (module `business`): `CollectionServiceTest` 8 test (mock `CollectionRepository`, `LutService`, `SubscriptionService`), 8/8 pass; toàn module `business` 63/63. Playwright `frontend/tests/e2e/bo-suu-tap.spec.ts`: 31/31 pass (API 14, giao diện 17). Mỗi test tự đăng ký khách mới nên không phụ thuộc thứ tự; các test kiểm thứ tự chờ 1,1 giây giữa hai lần ghi (cột DATETIME tính theo giây).

| ID | Loại | Nội dung | Kết quả |
|---|---|---|---|
| TC-01 | unit | Giới hạn gói Miễn phí (3 bộ bị chặn, 2 bộ được tạo, có gói thì không chặn) | Pass |
| TC-02 | unit | Tên trùng khi tạo (kiểm trước và bắt `DuplicateKeyException`) | Pass |
| TC-03 | unit | Field server quản (`id`, `userId`, `createdTime`) bị ghi đè, tên được trim | Pass |
| TC-04 | unit | Tạo kèm LUT: LUT chưa xuất bản thì 404, không insert | Pass |
| TC-05 | unit | Đổi tên: không phải bộ của khách, loại trừ chính nó, không kiểm giới hạn | Pass |
| TC-06 | unit | Thêm LUT: bộ lạ, LUT chưa xuất bản, đã có (không `touch`), mới (`touch` 1 lần) | Pass |
| TC-07 | unit | Bỏ LUT / xoá bộ của người khác: 404, không gọi repository ghi | Pass |
| TC-08 | unit | Gom số LUT và ảnh ghép trong một lần truy vấn (không N+1) | Pass |
| TC-09 | api | Không token: 6 endpoint đều 401 | Pass |
| TC-10 | api | Danh sách trống, tạo bộ (tên được trim, không lộ `userId`) | Pass |
| TC-11 | api | Trùng tên: hoa thường trùng, dấu không trùng, khách khác đặt được | Pass |
| TC-12 | api | Gói Miễn phí có 3 bộ: 403 `COLLECTION_LIMIT`, không ghi gì | Pass |
| TC-13 | api | Khách Pro (kích hoạt bằng `order/mock-pay`) tạo 5 bộ không bị chặn | Pass |
| TC-14 | api | Tạo kèm LUT; LUT nháp thì 404 và không tạo bộ | Pass |
| TC-15 | api | Thêm LUT, thêm lặp không tăng số, bộ vừa sửa lên đầu, thứ tự ảnh ghép | Pass |
| TC-16 | api | Lỗi khi thêm: bộ người khác, LUT nháp / ẩn / không có, bộ không có | Pass |
| TC-17 | api | LUT bị ẩn thì khỏi lưới, xuất bản lại thì quay về, xoá hẳn không lỗi FK | Pass |
| TC-18 | api | `containsLut` theo `lutId` (có, không, không tồn tại, không truyền) | Pass |
| TC-19 | api | Xem một bộ: thứ tự, dạng LUT công khai, 3 trường hợp 404 | Pass |
| TC-20 | api | Đổi tên: thành công, đúng tên của chính nó, trùng bộ khác, 404 | Pass |
| TC-21 | api | Bỏ LUT hai lần vẫn 200; khách khác 404 | Pass |
| TC-22 | api | Xoá bộ, xoá xong dùng lại được tên cũ, đủ 3 bộ lại bị chặn | Pass |
| TC-23 | e2e | Chưa đăng nhập: lưu từ thẻ → đăng ký → mở tiếp hộp thoại lưu, không tải file | Pass |
| TC-24 | e2e | Tạo bộ đầu tiên trong hộp thoại | Pass |
| TC-25 | e2e | Tích / bỏ tích, mở lại thấy đúng, toast từng bước | Pass |
| TC-26 | e2e | Kiểm tên trong hộp thoại (rỗng, 101 ký tự, trùng) | Pass |
| TC-27 | e2e | Hết lượt trong hộp thoại, link "Nâng cấp Pro" sang `/pricing` | Pass |
| TC-28 | e2e | Trang chi tiết: "Lưu vào bộ sưu tập" → "Đã lưu" | Pass |
| TC-29 | e2e | Trang `/bo-suu-tap` có dữ liệu, hai lối vào (menu trái, menu tài khoản) | Pass |
| TC-30 | e2e | Tạo, đổi tên, xoá ở trang danh sách | Pass |
| TC-31 | e2e | Băng hết lượt, xoá một bộ thì băng biến mất | Pass |
| TC-32 | e2e | Khách Pro không thấy giới hạn | Pass |
| TC-33 | e2e | Trang một bộ: bỏ LUT, hoàn tác, tải lại | Pass |
| TC-34 | e2e | Đổi tên / xoá ở trang một bộ | Pass |
| TC-35 | e2e | Bộ trống và các trường hợp 404 | Pass |
| TC-36 | e2e | Chưa đăng nhập mở `/bo-suu-tap`, đăng nhập xong hiện danh sách | Pass |
| TC-37 | e2e | Đăng nhập từ nút lưu giữ ý định lưu, không tải file | Pass |
| TC-38 | e2e | Hồi quy: "Tải miễn phí" → đăng ký vẫn tải tiếp | Pass |
| TC-39 | e2e | Điện thoại 390×844: không tràn ngang, nút luôn hiện | Pass |
| | | **Tổng** | **39/39 pass** (JUnit 8 + Playwright 31) |

Số vòng sửa: backend 0, frontend 1 (vòng sửa đưa toast và làm mới query về `meta` của mutation thay vì gọi tay trong từng component, dùng `ShopField` thay ô nhập tự viết, mô tả hộp thoại thành `DialogDescription`).

## 7. Điểm lệch plan và vấn đề còn lại

- **Không có điểm lệch plan**; spec nghiệm thu không phải sửa.
- Toast "Hoàn tác" ở trang một bộ gọi `toast` trực tiếp (có chú thích trong mã) vì cần nút hành động mà `meta` của mutation không diễn đạt được; mọi toast khác đi qua `meta`.
- `MutationCache` được thêm khả năng `silentError` dạng hàm, các lát sau dùng chung được.
- TC-13 phụ thuộc cổng payOS thật: lần chạy đầu của phiên review bị `order/create` → 502 do mạng ra payOS hết thời gian; chạy lại khi payOS thông thì pass.
- **Còn lại**: hai request tạo bộ cùng lúc ở gói Miễn phí có thể vượt 3 bộ (đếm rồi mới chèn, không khoá; chấp nhận với đồ án). `get` không phân trang (đủ với kho 36 LUT). Thẻ ở lưới `/luts` chưa hiện trạng thái "đã lưu". Danh sách quyền lợi gói Miễn phí trong DB (`plan.features`) chưa ghi "3 bộ sưu tập". Hai mã lỗi mới `COLLECTION_LIMIT`, `COLLECTION_NAME_EXISTS` cần bổ sung vào bảng lỗi của `docs/tai-lieu-thiet-ke.md` §5.7 (file đang có thay đổi chưa commit từ trước nên chưa sửa ở lần này).
