package vn.aeoc.base.constant;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNAUTHORIZED(401, "Token không hợp lệ hoặc sai chữ ký"),
    TOKEN_EXPIRED(401,  "Token đã hết hạn"),
    LOGIN(401,  "Chưa đăng nhập"),
    FORBIDDEN(403, "Không có quyền truy cập"),
    LOCK_ACCOUNT(403, "Tài khoản bị khóa"),
    INTERNAL_ERROR(500, "Lỗi hệ thống"),

    DUPLICATED_USER(400, "Số điện thoại đã tồn tại"),
    DUPLICATED_DATA(400, "Trùng dữ liệu"),
    INVALID_AUTHENTICATION_INFO(400, "Tài khoản hoặc mật khẩu không đúng."),
    DUPLICATED_EMAIL(400, "Email đã tồn tại"),
    EMAIL_EXISTS(400, "Email đã được đăng ký"),
    UPLOAD_FILE_FAILED(400, "Upload file thất bại"),
    FILE_EMPTY(400, "File rỗng"),
    FILE_TOO_LARGE(413, "File vượt quá dung lượng cho phép"),
    FILE_TYPE_NOT_ALLOWED(415, "Định dạng file không được hỗ trợ"),

    VERSION_CONFLICT(409, "Dữ liệu đã bị thay đổi, vui lòng tải lại"),

    WRONG_LOGIN_INFO(400, "Sai thông tin đăng nhập. Kiểm tra lại tài khoản hoặc mật khẩu!"),
    MISSING_PASSWORD(400, "Chưa nhập mật khẩu!"),
    MISSING_EMAIL_OR_PHONE(400, "Chưa nhập email hoặc số điện thoại!"),
    WEAK_PASSWORD(400, "Mật khẩu phải có từ 8 đến 72 ký tự"),
    REFRESH_TOKEN_INVALID(401, "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại"),
    LOGIN_TOO_MANY_ATTEMPTS(429, "Đăng nhập sai quá nhiều lần, vui lòng thử lại sau ít phút"),
    REGISTRATION_DISABLED(403, "Hệ thống không mở đăng ký"),
    DATA_NOT_FOUND(404, "Dữ liệu không tồn tại"),
    DEFAULT_ROLE_NOT_FOUND(404, "Role mặc định không tồn tại"),
    LOCK_STATUS(401, "Trạng thái không hoạt động"),
    BAD_REQUEST(400, "Yêu cầu không hợp lệ"),
    BAD_REQUEST_AI(400, "Yêu cầu không hợp lệ"),
    EXIST_VOUCHER(400, "Mã Voucher đã tồn tại"),
    INVALID_ORDER_STATUS(400, "Trạng thái đơn hàng không hợp lệ"),
    INVALID_PAYMENT_STATUS(400, "Trạng thái thanh toán không hợp lệ"),
    ORDER_ALREADY_FINISHED(400, "Đơn hàng đã hoàn tất, không thể thao tác thêm"),
    INPUT_WRONG(400,"Dữ liệu sai"),
    INVOICE_FILE_NOT_ISSUED(400, "Chỉ xem được tệp của hoá đơn đã cấp mã"),
    INVOICE_EMAIL_NOT_ACTIVE(400, "Chỉ gửi email được hoá đơn đã cấp mã còn hiệu lực"),
    INVOICE_EMAIL_MISSING(400, "Chưa có email người nhận"),
    INVOICE_EMAIL_FAILED(503, "Không gửi được email, vui lòng thử lại sau"),
    INVOICE_FILE_FAILED(503, "Không tạo được tệp hoá đơn, vui lòng thử lại sau"),
    INVOICE_LOOKUP_NOT_FOUND(404, "Không tìm thấy hoá đơn. Kiểm tra lại mã số thuế người bán và mã tra cứu"),
    INVOICE_LOOKUP_BLOCKED(429, "Bạn đã tra cứu sai quá nhiều lần, vui lòng thử lại sau 10 phút"),
    INVOICE_FILE_TOKEN_INVALID(404, "Liên kết tải hoá đơn không hợp lệ hoặc đã hết hạn"),
    LUT_FILE_INVALID(400, "File .cube không hợp lệ"),
    PREVIEW_MISSING(400, "LUT chưa có đủ ảnh / video xem trước"),
    LUT_FILE_MISSING(400, "LUT chưa có file .cube đã đo đặc trưng màu"),
    LUT_FEATURE_MISSING(400, "LUT cần ít nhất 3 thẻ và 1 danh mục"),
    PLAN_ACTIVE(400, "Bạn đang dùng gói này"),
    ORDER_INVALID_STATUS(400, "Đơn hàng đã được xử lý"),
    PAYMENT_GATEWAY_ERROR(502, "Không kết nối được cổng thanh toán, vui lòng thử lại"),
    INVALID_SIGNATURE(400, "Chữ ký không hợp lệ"),
    PLAN_REQUIRED(403, "LUT Premium cần gói Pro hoặc Studio"),
    LUT_FILE_UNAVAILABLE(503, "File LUT đang không sẵn sàng, vui lòng thử lại sau"),
    COLLECTION_LIMIT(403, "Gói Miễn phí lưu được tối đa 3 bộ sưu tập"),
    COLLECTION_NAME_EXISTS(400, "Bạn đã có bộ sưu tập tên này"),
    PREFERENCE_INVALID(400, "Lựa chọn không hợp lệ"),
    NO_ACTIVE_PLAN(400, "Bạn chưa có gói trả phí nào để huỷ");

    public final int code;
    public final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
