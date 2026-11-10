# DownBeat Backend — quy tắc cho worker backend (agy)

Đọc `../AGENTS.md` (giao thức worker chung) trước file này.

Spring Boot 3.2 · Java 21 · MySQL 8 + jOOQ · Caffeine (cache trong bộ nhớ) · MinIO · Maven multi-module, build ra **1 jar** (`app/target/aeoc-backend.jar`).

```
entity/        POJO entity (vn.aeoc.entity.data.mysql.*) + jOOQ codegen (vn.entity.backend.*, entity/src/main/generated — không sửa tay)
base/          ApiResponse, AppException/ErrorCode, paging, AbsMysqlRepository, BaseService, utils
authenticate/  đăng nhập (JWT + refresh token lưu bảng `refresh_token`), user_app, role, permission, resource, module, BaseController
business/      TOÀN BỘ nghiệp vụ ecom (vn.aeoc.business.<chức năng>: lut, product, cart, order…)
app/           main + application*.yml + db/migration + db/seed. Không chứa nghiệp vụ
```
Phụ thuộc một chiều: `entity` ← `base` ← `authenticate` ← `business` ← `app`. Chức năng mới **không tạo module Maven mới**: thêm package con trong `business`. `base` chỉ chứa hạ tầng. Package chức năng này không gọi repository của package chức năng khác (gọi qua service). Logic dùng chung giữa các chức năng đặt ở `vn.aeoc.business.common`.

## Lệnh

Các lệnh chạy từ `backend/`, trừ dòng có `scripts/`, chạy từ gốc repo:

```bash
mvn -q -DskipTests package                              # build; có backend/.env => sinh lại jOOQ từ DB local
mvn -q -DskipTests "-Djooq.codegen.skip=true" package   # build khi DB chưa chạy / chưa có bảng
mvn -q "-Djooq.codegen.skip=true" -pl <module> -am test # unit test (không cần DB)
sh scripts/ai/backend-restart.sh                        # (gốc repo) build + restart :9500 + in dòng Flyway
```
Base URL `http://localhost:9500/api` · OpenAPI `/api/v3/api-docs`. Tài khoản local (seed `db/seed/V1_1__seed_auth.sql`, mật khẩu `Admin@123`): `admin@downbeat.local` (toàn quyền), `noaccess@downbeat.local` (không quyền). Lấy token: `POST /api/user/authenticate` với `{email, plainPassword}` → `result.token`.

Flyway: `app/src/main/resources/db/migration/V<n+1>__<mo_ta>.sql`. **Không sửa migration đã chạy** (checksum sai → app không lên). Viết idempotent (`CREATE TABLE IF NOT EXISTS`, `INSERT … WHERE NOT EXISTS`). Flyway chỉ chạy khi app khởi động, còn codegen đọc DB lúc build, nên thêm bảng mới phải restart rồi build lại. DB trống (chưa từng chạy app) thì build với `-Djooq.codegen.skip=true`, nếu không codegen sẽ sinh ra schema rỗng.

## Quy tắc bắt buộc

- **Một cửa hàng duy nhất**: không có bảng `branch`, không có cột `bsn_id` / `branch_id`, không lọc theo doanh nghiệp. Phân biệt dữ liệu theo người dùng (ví dụ `user_id` của giỏ hàng / đơn hàng) khi plan yêu cầu.
- **Ghi dữ liệu đồng bộ, đơn giản**: POST xử lý ngay trong request (`@Transactional` ở service khi ghi nhiều bảng) và trả kết quả. Không có `@Idempotent`, header `Idempotency-Key`, Kafka hay xử lý bất đồng bộ. Chống ghi trùng bằng ràng buộc DB (unique) + kiểm tra ở service khi plan yêu cầu.
- **Không làm DTO** (đồ án nhỏ): request và response dùng thẳng entity POJO (`vn.aeoc.entity.data.mysql.<feature>.Xxx`). Không tạo `XxxRequest` / `XxxResponse`. Field hiển thị lấy từ JOIN (ví dụ `categoryName`) thêm thẳng vào POJO.
- **Validate định dạng chỉ ở frontend**: backend không kiểm trống, độ dài, regex, SĐT, giá trị enum. Backend chỉ giữ những gì client không tự làm được hoặc không thể tin client: 404, quyền, quy tắc cần tra DB (trùng mã, tham chiếu tồn tại, tồn kho…), tính tiền, sinh mã. Chuẩn hoá nhẹ (trim) vẫn làm ở service.
- **Field do server quản lý**: vì body là entity, service phải tự ghi đè `id` (khi tạo), `status`, `createdBy`, `createdTime`, `updatedTime`, giá / tổng tiền tính từ DB… không lấy từ client. Hàm update chỉ ghi các cột client được sửa (`updateByCondition(cond, pojo, XXX.NAME, …)`).
- Controller `extends BaseController`, `private static final String URI = "/xxx/"`, mọi endpoint quản trị gọi `checkPermission(principal, URI, "VIEW|ADD|UPDATE|DELETE")` đầu tiên. Endpoint công khai (ví dụ xem sản phẩm cho khách) phải được plan §5 ghi rõ và mở trong cấu hình security. Endpoint: `/<x>/list`, `/<x>/get`, `/<x>/update` (upsert), `/<x>/delete/{id}`, trừ khi plan §5 ghi khác.
- Response bọc `Mapper.map(result, ApiResponse::okEntity)`; lỗi nghiệp vụ `new AppException(ErrorCode.BAD_REQUEST, "<message nguyên văn plan §5>")`, không tìm thấy → `ErrorCode.DATA_NOT_FOUND`. Package theo feature: `controller/`, `service/`, `repository/`.
- **Mọi repository `extends AbsMysqlRepository<XxxRecord, Xxx, Integer>`, mọi service có repository `extends BaseService<XxxRepository, Xxx, Integer>`** (khuôn ở mục "Thêm 1 CRUD"). Không tạo repository / service "trần" (`@RequiredArgsConstructor` + tự giữ `DSLContext`). Service dùng field `repository` của `BaseService`, không khai báo thêm field cho repository chính.
- **Repository dùng hàm có sẵn của `AbsMysqlRepository`** thay vì viết tay jOOQ: `getListByCriteria` / `getListByCriteriaWithJoin` (+ `mergeFields` cho cột JOIN), `getById`, `getByIdWithJoin`, `getOneByCriteriaWithJoin`, `getOne`, `exists`, `getCountWithCriteria`, `updateByCondition`, `updateFieldByCondition`, `insertReturning`, `delete(id)` / `delete(condition)`. Chỉ viết tay (`dslContext…`) khi truy vấn bảng khác, chọn một phần cột vào kiểu khác, hoặc cần `fetchGroups` / `forUpdate` / biểu thức SQL riêng.
- `getWhereCondition(…)` dựng `Condition` **chỉ tham chiếu bảng chính** (điều kiện trên bảng khác viết bằng `DSL.exists(selectOne()…)`), để `list` dùng `getListByCriteriaWithJoin` còn `count` dùng thẳng `getCountWithCriteria` với cùng điều kiện.
- Bảng không có cột `id` (bảng nối như `lut_tag`, `lut_category_map`) **không có repository riêng** (`AbsMysqlRepository.init` bắt buộc cột `id`): truy vấn nó bằng tay trong repository của bảng chính.
- Trong repository, `exists(…)` / `delete(…)` / `update(…)` là hàm kế thừa và **che** `import static org.jooq.impl.DSL.exists`: viết `DSL.exists(...)`.
- Danh sách có phân trang: service gọi `pageQuery(pageable, () -> repository.list(…), () -> repository.count(…))` (list + count chạy song song trên `dbExecutor`), không tự `new Page<>` / `setTotal`.
- **Phân quyền**: đã có màn hình quản trị (`/admin/chuc-vu`, `/admin/phan-quyen`, `/admin/tai-nguyen`, `/admin/module`; API `role`, `permission`, `resource`, `module` ở `authenticate`). Chức năng mới vẫn **tạo dòng `resource` bằng migration** (vì `uri` phải khớp hằng `URI` của controller viết cùng lúc); việc cấp quyền cho từng chức vụ làm trên màn hình. Không sửa code / uri của 4 resource hệ thống `MODULE`, `RESOURCE`, `ROLE`, `PERMISSION` (`ResourceService.SYSTEM_CODES`).
- Đổi quyền phải có hiệu lực ngay: ghi bảng `permission` thì `authCache.invalidateAll()` như `PermissionService.update`.
- Không nới whitelist upload cho svg/html.
- **Mẫu upload** (xem `LutAdminService.upload`): kiểm theo thứ tự tồn tại → loại → rỗng → đuôi → dung lượng → nội dung (magic bytes) rồi mới ghi; ghi file bằng `FileStorageService.putPublic` (bucket công khai, trả URL) hoặc `putPrivate` (bucket riêng tư); khoá object có UUID; content-type do server quyết định.

## Thêm 1 CRUD

Khuôn chuẩn (ví dụ `product`). Code đã theo khuôn để tham khảo: `authenticate/.../RoleController` + `RoleService` + `RoleRepository` (CRUD quản trị đầy đủ nhất: trùng tên, chặn xoá khi đang dùng, chỉ một bản ghi mặc định), `ModuleService` (xoá có dọn tham chiếu, endpoint body là mảng id), `PermissionService.update` (ghi theo lô, `@Transactional`), `business/lut` (JOIN + `DSL.exists`, `pageQuery`, cache Caffeine), `authenticate/.../RefreshTokenRepository` (`getOne`, `delete(condition)`). Unit test mẫu cho CRUD quản trị: `authenticate/src/test/.../service/auth/PhanQuyenServiceTest.java`.

```java
// business/src/main/java/vn/aeoc/business/product/repository/ProductRepository.java
@Repository
public class ProductRepository extends AbsMysqlRepository<ProductRecord, Product, Integer> {
    public ProductRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<ProductRecord> getTable() {
        return PRODUCT;
    }

    // Dùng chung cho list và count. Chỉ tham chiếu PRODUCT (bảng khác thì DSL.exists).
    private Condition getWhereCondition(String keyword, Integer status) {
        Condition condition = DSL.noCondition();
        if (keyword != null && !keyword.isBlank()) {
            String like = "%" + keyword.trim() + "%";
            condition = condition.and(PRODUCT.CODE.likeIgnoreCase(like)
                    .or(PRODUCT.NAME.likeIgnoreCase(like)));
        }
        if (status != null) {
            condition = condition.and(PRODUCT.STATUS.eq(status));
        }
        return condition;
    }

    // Cột hiển thị lấy từ JOIN: thêm field cùng tên (camelCase) vào POJO Product.
    private List<Field<?>> fields() {
        return mergeFields(CATEGORY.NAME.as("category_name"), USER_APP.NAME.as("created_by_name"));
    }

    private Table<?> joined() {
        return PRODUCT.leftJoin(CATEGORY).on(CATEGORY.ID.eq(PRODUCT.CATEGORY_ID))
                .leftJoin(USER_APP).on(USER_APP.ID.eq(PRODUCT.CREATED_BY));
    }

    public List<Product> list(String keyword, Integer status, Pageable pageable) {
        return getListByCriteriaWithJoin(fields(), joined(), getWhereCondition(keyword, status),
                List.of(PRODUCT.CREATED_TIME.desc(), PRODUCT.ID.desc()), pageable);
    }

    public Long count(String keyword, Integer status) {
        return getCountWithCriteria(getWhereCondition(keyword, status));
    }

    public Product getProductById(Integer id) {
        return getByIdWithJoin(fields(), joined(), id);
    }

    public boolean existsByCode(String code) {
        return exists(PRODUCT.CODE.eq(code));
    }

    // Chỉ ghi các cột client được sửa.
    public void updateProduct(Product product) {
        updateByCondition(PRODUCT.ID.eq(product.getId()), product,
                PRODUCT.NAME, PRODUCT.PRICE, PRODUCT.CATEGORY_ID);
    }

    public void updateStatus(Integer id, Integer status) {
        updateFieldByCondition(PRODUCT.ID.eq(id), PRODUCT.STATUS, status);
    }
}

// business/src/main/java/vn/aeoc/business/product/service/ProductService.java
@Service
public class ProductService extends BaseService<ProductRepository, Product, Integer> {
    public ProductService(ProductRepository repository, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
    }

    public Page<Product> list(String keyword, Integer status, Pageable pageable) {
        return pageQuery(pageable,
                () -> repository.list(keyword, status, pageable),
                () -> repository.count(keyword, status));
    }

    public Product get(Integer id) {
        return repository.getProductById(require(id).getId());
    }

    // Validate định dạng ở frontend; ở đây chỉ giữ quy tắc nghiệp vụ.
    @Transactional
    public Product upsert(User login, Product request) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        request.setName(trim(request.getName()));
        if (!creating) {
            require(request.getId());
            repository.updateProduct(request);           // field khác client gửi bị bỏ qua
            return repository.getProductById(request.getId());
        }
        String code = trim(request.getCode());
        if (code != null && repository.existsByCode(code)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Mã sản phẩm đã tồn tại");
        }
        // Field do server quản lý: ghi đè, không lấy từ client.
        request.setId(null);
        request.setCode(code);
        request.setStatus(1);
        request.setCreatedBy(login.getId());
        request.setCreatedTime(null);
        request.setUpdatedTime(null);
        return repository.getProductById(insert(request).getId());
    }

    @Transactional
    public Product changeStatus(Product request) {
        Product current = require(request.getId());
        if (request.getStatus() != null && !request.getStatus().equals(current.getStatus())) {
            repository.updateStatus(current.getId(), request.getStatus());
        }
        return repository.getProductById(current.getId());
    }

    private Product require(Integer id) {
        Product record = id == null ? null : getById(id);
        if (record == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND);
        }
        return record;
    }

    private static String trim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

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
    public ResponseEntity<ApiResponse<Page<Product>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer status,
            @ParameterObject Pageable pageable,
            Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(productService.list(keyword, status, pageable), ApiResponse::okEntity);
    }

    @GetMapping("/product/get")
    public ResponseEntity<ApiResponse<Product>> get(@RequestParam Integer id, Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(productService.get(id), ApiResponse::okEntity);
    }

    @PostMapping("/product/update")
    public ResponseEntity<ApiResponse<Product>> update(@RequestBody Product request, Principal principal) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        User login = checkPermission(principal, URI, creating ? "ADD" : "UPDATE");
        return map(productService.upsert(login, request), ApiResponse::okEntity);
    }

    @PostMapping("/product/change-status")
    public ResponseEntity<ApiResponse<Product>> changeStatus(@RequestBody Product request, Principal principal) {
        checkPermission(principal, URI, "UPDATE");
        return map(productService.changeStatus(request), ApiResponse::okEntity);
    }
}
```

Khác code mẫu của dự án AEOC cũ (`StoreService`, `InvoiceRepository`): **không** có `BsnScope` / `bsnId` / `getInScope`, **không** có `@Idempotent`. Không tạo hàm chỉ để bọc hàm có sẵn (`insertStore` → gọi thẳng `insert(…)` ở service hoặc `insertReturning(…)` ở repository).

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
4. Unit test service cùng package: JUnit 5 + AssertJ + Mockito, `new` service với mock (không dựng Spring); tham số `QueryExecutor` truyền `new QueryExecutor(Runnable::run)` để `pageQuery` chạy ngay trên luồng test. Phủ tối thiểu: quy tắc nghiệp vụ (trùng mã…), field server quản bị ghi đè khi tạo, bản ghi không tồn tại → 404 và không ghi. Cộng thêm mọi test case loại `unit` trong plan §9. Mẫu: `business/src/test/.../lut/service/LutServiceTest.java` (mock repository + `pageQuery`), `authenticate/src/test/.../service/auth/RefreshTokenServiceTest.java`, `LoginAttemptServiceTest.java` (Caffeine thật + `Ticker` giả).
5. Chạy unit test, restart, rồi tự gọi thử từng endpoint §5 bằng curl.

## Nghiệm thu chuẩn (task không ghi gì thêm thì dùng mục này)

1. `mvn -q "-Djooq.codegen.skip=true" -pl <module> -am test` xanh.
2. `sh scripts/ai/backend-restart.sh` in `backend sẵn sàng`, Flyway đã áp migration mới.
3. Mỗi endpoint trong plan §5 gọi bằng curl (có token) trả đúng shape và đúng mã lỗi. Dán 1 response mẫu cho mỗi endpoint vào báo cáo `worker_done`.

## Code cũ chưa theo chuẩn (đừng chép)

- `UserService` dùng `new AppException(msg, 400)`; code mới dùng `ErrorCode`.
