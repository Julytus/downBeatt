# DownBeat Backend — quy tắc cho worker Codex

Đọc `../AGENTS.md` (giao thức worker chung) trước file này.

Spring Boot 3.2 · Java 21 · MySQL 8 + jOOQ · Caffeine (cache trong bộ nhớ) · MinIO · Maven multi-module, build ra **1 jar** (`app/target/aeoc-backend.jar`).

```
entity/        POJO entity (vn.aeoc.entity.data.mysql.*) + jOOQ codegen (vn.entity.backend.*, entity/src/main/generated — không sửa tay)
base/          ApiResponse, AppException/ErrorCode, paging, AbsMysqlRepository, BaseService, utils
authenticate/  đăng nhập (JWT + refresh token lưu bảng `refresh_token`), user_app, role, permission, resource, module, BaseController
business/      TOÀN BỘ nghiệp vụ ecom (vn.aeoc.business.<chức năng>: product, category, cart, order…) — hiện đang trống
app/           main + application*.yml + db/migration + db/seed. Không chứa nghiệp vụ
```
Phụ thuộc một chiều: `entity` ← `base` ← `authenticate` ← `business` ← `app`. Chức năng mới **không tạo module Maven mới**: thêm package con trong `business`. `base` chỉ chứa hạ tầng. Package chức năng này không gọi repository của package chức năng khác (gọi qua service). Logic dùng chung giữa các chức năng đặt ở `vn.aeoc.business.common`.

## Lệnh

Các lệnh chạy từ `backend/`, trừ dòng có `scripts/`, chạy từ gốc repo:

```bash
mvn -q -DskipTests package                              # build; có backend/.env => sinh lại jOOQ từ DB local
mvn -q -DskipTests "-Djooq.codegen.skip=true" package   # build khi DB chưa chạy / chưa có bảng
mvn -q "-Djooq.codegen.skip=true" -pl <module> -am test # unit test (không cần DB)
sh scripts/ai/backend-restart.sh                        # (gốc repo) build + restart :9200 + in dòng Flyway
```
Base URL `http://localhost:9200/api` · OpenAPI `/api/v3/api-docs`. Tài khoản local (seed `db/seed/V1_1__seed_auth.sql`, mật khẩu `Admin@123`): `admin@downbeat.local` (toàn quyền), `noaccess@downbeat.local` (không quyền). Lấy token: `POST /api/user/authenticate` với `{email, plainPassword}` → `result.token`.

Flyway: `app/src/main/resources/db/migration/V<n+1>__<mo_ta>.sql`. **Không sửa migration đã chạy** (checksum sai → app không lên). Viết idempotent (`CREATE TABLE IF NOT EXISTS`, `INSERT … WHERE NOT EXISTS`). Flyway chỉ chạy khi app khởi động, còn codegen đọc DB lúc build, nên thêm bảng mới phải restart rồi build lại. DB trống (chưa từng chạy app) thì build với `-Djooq.codegen.skip=true`, nếu không codegen sẽ sinh ra schema rỗng.

## Quy tắc bắt buộc

- **Một cửa hàng duy nhất**: không có bảng `branch`, không có cột `bsn_id` / `branch_id`, không lọc theo doanh nghiệp. Phân biệt dữ liệu theo người dùng (ví dụ `user_id` của giỏ hàng / đơn hàng) khi plan yêu cầu.
- **Ghi dữ liệu đồng bộ, đơn giản**: POST xử lý ngay trong request (`@Transactional` ở service khi ghi nhiều bảng) và trả kết quả. Không có `@Idempotent`, header `Idempotency-Key`, Kafka hay xử lý bất đồng bộ. Chống ghi trùng bằng ràng buộc DB (unique) + kiểm tra ở service khi plan yêu cầu.
- **Không làm DTO** (đồ án nhỏ): request và response dùng thẳng entity POJO (`vn.aeoc.entity.data.mysql.<feature>.Xxx`). Không tạo `XxxRequest` / `XxxResponse`. Field hiển thị lấy từ JOIN (ví dụ `categoryName`) thêm thẳng vào POJO.
- **Validate định dạng chỉ ở frontend**: backend không kiểm trống, độ dài, regex, SĐT, giá trị enum. Backend chỉ giữ những gì client không tự làm được hoặc không thể tin client: 404, quyền, quy tắc cần tra DB (trùng mã, tham chiếu tồn tại, tồn kho…), tính tiền, sinh mã. Chuẩn hoá nhẹ (trim) vẫn làm ở service.
- **Field do server quản lý**: vì body là entity, service phải tự ghi đè `id` (khi tạo), `status`, `createdBy`, `createdTime`, `updatedTime`, giá / tổng tiền tính từ DB… không lấy từ client. Hàm update chỉ ghi các cột client được sửa (`updateByCondition(cond, pojo, XXX.NAME, …)`).
- Controller `extends BaseController`, `private static final String URI = "/xxx/"`, mọi endpoint quản trị gọi `checkPermission(principal, URI, "VIEW|ADD|UPDATE|DELETE")` đầu tiên. Endpoint công khai (ví dụ xem sản phẩm cho khách) phải được plan §5 ghi rõ và mở trong cấu hình security. Endpoint: `/<x>/list`, `/<x>/get`, `/<x>/update` (upsert), `/<x>/delete/{id}`, trừ khi plan §5 ghi khác.
- Response bọc `Mapper.map(result, ApiResponse::okEntity)`; lỗi nghiệp vụ `new AppException(ErrorCode.BAD_REQUEST, "<message nguyên văn plan §5>")`, không tìm thấy → `ErrorCode.DATA_NOT_FOUND`. Package theo feature: `controller/`, `service/`, `repository/`.
- **Repository dùng hàm có sẵn của `AbsMysqlRepository`** thay vì viết tay jOOQ: `getListByCriteria` / `getListByCriteriaWithJoin` (+ `mergeFields` cho cột JOIN), `getById`, `getByIdWithJoin`, `getOne`, `exists`, `getCountWithCriteria`, `updateByCondition`, `updateFieldByCondition`, `insertReturning`. Chỉ viết tay khi truy vấn bảng khác hoặc chọn một phần cột vào kiểu khác.
- Danh mục `module` / `resource` / `permission` chỉ đổi qua migration (chưa có màn hình quản trị). Không nới whitelist upload cho svg/html.

## Thêm 1 CRUD

Chưa có chức năng nghiệp vụ nào để chép; khung dưới đây là chuẩn (ví dụ `product`):

```java
// business/src/main/java/vn/aeoc/business/product/controller/ProductController.java
@RestController
public class ProductController extends BaseController {
    private static final String URI = "/product/";          // = resource.uri trong migration
    private final ProductService productService;

    public ProductController(ProductService productService, UserService userService) {
        super(userService);
        this.productService = productService;
    }

    @GetMapping("/product/list")
    public ResponseEntity<ApiResponse<Page<Product>>> list(@RequestParam(required = false) String keyword,
                                                           @ParameterObject Pageable pageable, Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(productService.list(keyword, pageable), ApiResponse::okEntity);
    }

    @PostMapping("/product/update")
    public ResponseEntity<ApiResponse<Product>> update(@RequestBody Product request, Principal principal) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        User login = checkPermission(principal, URI, creating ? "ADD" : "UPDATE");
        return map(productService.upsert(login, request), ApiResponse::okEntity);
    }
}

// service: extends BaseService<ProductRepository, Product, Integer>
//   list  → pageQuery(pageable, () -> repository.list(keyword, pageable), () -> repository.count(keyword))
//   upsert(login, req) @Transactional: sửa → getById null thì DATA_NOT_FOUND → updateByCondition(ID = id, req, NAME, PRICE, …)
//                                      tạo → quy tắc nghiệp vụ (trùng mã…) → ghi đè id/status/createdBy/thời gian → insertReturning
// repository: extends AbsMysqlRepository<ProductRecord, Product, Integer>, getTable() = PRODUCT,
//   getWhereCondition(keyword, …) dựng Condition (bắt đầu DSL.noCondition()) dùng chung cho list và count.
```

### Các bước

1. Migration: bảng + dòng `resource` (không ghi cứng `id`, chạy lại không bị trùng):
   ```sql
   INSERT INTO `resource` (`name`, `description`, `code`, `uri`, `actions`, `active`)
   SELECT 'Quản lý xxx', '', 'XXX', '/xxx/', '["VIEW", "ADD", "UPDATE", "DELETE"]', 1 FROM DUAL
   WHERE NOT EXISTS (SELECT 1 FROM `resource` WHERE `code` = 'XXX');
   ```
   `uri` = hằng `URI` của controller; `code` = mã frontend dùng ở `CrmPermissionGuard` / sidebar (plan §2). Đặt ở migration, không đặt ở `db/seed` (seed chỉ chạy local, dùng cho dữ liệu mẫu).
2. `sh scripts/ai/backend-restart.sh` (Flyway tạo bảng) → `mvn -q -DskipTests package` (sinh jOOQ) → POJO trong `entity/.../data/mysql/<feature>/`.
3. Viết theo thứ tự: entity (thêm cột JOIN) → Repository → Service → Controller theo khung trên.
4. Unit test service cùng package: JUnit 5 + AssertJ + Mockito, `new` service với mock (không dựng Spring). Phủ tối thiểu: quy tắc nghiệp vụ (trùng mã…), field server quản bị ghi đè khi tạo, bản ghi không tồn tại → 404 và không ghi. Cộng thêm mọi test case loại `unit` trong plan §9. Mẫu: `authenticate/src/test/.../service/auth/RefreshTokenServiceTest.java` (mock repository), `LoginAttemptServiceTest.java` (Caffeine thật + `Ticker` giả).
5. Chạy unit test, restart, rồi tự gọi thử từng endpoint §5 bằng curl.

## Nghiệm thu chuẩn (task không ghi gì thêm thì dùng mục này)

1. `mvn -q "-Djooq.codegen.skip=true" -pl <module> -am test` xanh.
2. `sh scripts/ai/backend-restart.sh` in `backend sẵn sàng`, Flyway đã áp migration mới.
3. Mỗi endpoint trong plan §5 gọi bằng curl (có token) trả đúng shape và đúng mã lỗi. Dán 1 response mẫu cho mỗi endpoint vào báo cáo `worker_done`.

## Code cũ chưa theo chuẩn (đừng chép)

- `controller/FileController` nằm ở package phẳng; code mới đặt theo feature.
- `UserService` dùng `new AppException(msg, 400)`; code mới dùng `ErrorCode`.
