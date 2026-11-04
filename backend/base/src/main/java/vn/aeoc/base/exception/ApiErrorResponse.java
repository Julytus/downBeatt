package vn.aeoc.base.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import vn.aeoc.base.constant.ErrorCode;

import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        String path,
        int code,
        String errorCode,
        String message,
        String error,
        List<FieldViolation> errors
) {
    /** Một field vi phạm ràng buộc: tên field trong request và thông báo tiếng Việt. */
    public record FieldViolation(String field, String message) {
    }

    public static ApiErrorResponse of(String path, ErrorCode errorCode) {
        return new ApiErrorResponse(path, errorCode.code, errorCode.name(), errorCode.message, null, null);
    }

    public static ApiErrorResponse of(String path, ErrorCode errorCode, String error) {
        return new ApiErrorResponse(path, errorCode.code, errorCode.name(), errorCode.message, error, null);
    }

    public static ApiErrorResponse of(String path, ErrorCode errorCode, String message, String error) {
        return new ApiErrorResponse(path, errorCode.code, errorCode.name(), message, error, null);
    }

    /** Lỗi validate: {@code message} gom các thông báo để hiển thị ngay, {@code errors} chi tiết theo field. */
    public static ApiErrorResponse validation(String path, List<FieldViolation> violations) {
        String message = violations.stream().map(FieldViolation::message).distinct()
                .collect(java.util.stream.Collectors.joining("; "));
        return new ApiErrorResponse(path, ErrorCode.BAD_REQUEST.code, ErrorCode.BAD_REQUEST.name(),
                message.isEmpty() ? ErrorCode.BAD_REQUEST.message : message, null, violations);
    }
}
