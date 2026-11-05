package vn.aeoc.base.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import org.jooq.exception.DataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.servlet.NoHandlerFoundException;

import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.ApiErrorResponse.FieldViolation;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final String DEFAULT_VALIDATION_ERROR = "Dữ liệu không hợp lệ";

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(AppException ex, HttpServletRequest request) {
        ErrorCode errorCode = ex.getErrorCode() != null ? ex.getErrorCode() : resolveErrorCode(ex.getStatusCode());
        String message = ex.getMessage() != null ? ex.getMessage() : errorCode.message;
        return buildResponse(request, errorCode, message, null);
    }

    /** Body {@code @Valid} sai ràng buộc: trả đủ mọi field lỗi, không chỉ field đầu tiên. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<FieldViolation> violations = ex.getBindingResult().getAllErrors().stream()
                .map(error -> new FieldViolation(
                        error instanceof FieldError fieldError ? fieldError.getField() : error.getObjectName(),
                        messageOf(error.getDefaultMessage())))
                .toList();
        return validationResponse(request, violations);
    }

    /** Ràng buộc đặt trực tiếp trên tham số (query, path) của controller. */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodValidation(
            HandlerMethodValidationException ex,
            HttpServletRequest request
    ) {
        List<FieldViolation> violations = ex.getAllValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> new FieldViolation(
                                result.getMethodParameter().getParameterName(),
                                messageOf(error.getDefaultMessage()))))
                .toList();
        return validationResponse(request, violations);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {
        List<FieldViolation> violations = ex.getConstraintViolations().stream()
                .map(violation -> new FieldViolation(violation.getPropertyPath().toString(),
                        messageOf(violation.getMessage())))
                .toList();
        return validationResponse(request, violations);
    }

    /** JSON hỏng hoặc sai kiểu (vd. chữ vào field số): lỗi của client, không phải 500. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleUnreadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {
        return buildResponse(request, ErrorCode.BAD_REQUEST, "Dữ liệu gửi lên không đúng định dạng", null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ApiErrorResponse> handleMissingParameter(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {
        return buildResponse(request, ErrorCode.BAD_REQUEST,
                "Thiếu tham số bắt buộc: " + ex.getParameterName(), null);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {
        return buildResponse(request, ErrorCode.BAD_REQUEST, "Tham số không hợp lệ: " + ex.getName(), null);
    }

    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ApiErrorResponse> handleDataAccessException(
            DataAccessException ex,
            HttpServletRequest request
    ) {
        return buildResponse(request, ErrorCode.BAD_REQUEST, ErrorCode.BAD_REQUEST.message, DEFAULT_VALIDATION_ERROR);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSize(
            MaxUploadSizeExceededException ex,
            HttpServletRequest request
    ) {
        return buildResponse(request, ErrorCode.FILE_TOO_LARGE, ErrorCode.FILE_TOO_LARGE.message, null);
    }

    @ExceptionHandler({NoResourceFoundException.class, NoHandlerFoundException.class})
    public ResponseEntity<ApiErrorResponse> handleMissingApi(Exception ex, HttpServletRequest request) {
        return ResponseEntity.status(404).body(ApiErrorResponse.of(resolvePath(request), ErrorCode.DATA_NOT_FOUND,
                "Không tìm thấy API", null));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleException(Exception ex, HttpServletRequest request) {
        return buildResponse(request, ErrorCode.INTERNAL_ERROR, ErrorCode.INTERNAL_ERROR.message, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> validationResponse(HttpServletRequest request,
                                                                List<FieldViolation> violations) {
        return ResponseEntity.status(ErrorCode.BAD_REQUEST.code)
                .body(ApiErrorResponse.validation(resolvePath(request), violations));
    }

    private String messageOf(String message) {
        return message != null ? message : DEFAULT_VALIDATION_ERROR;
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(HttpServletRequest request, ErrorCode errorCode, String message, String error) {
        return ResponseEntity.status(errorCode.code).body(buildBody(request, errorCode, message, error));
    }

    private ApiErrorResponse buildBody(HttpServletRequest request, ErrorCode errorCode, String message, String error) {
        return ApiErrorResponse.of(resolvePath(request), errorCode, message, error);
    }

    private ErrorCode resolveErrorCode(int statusCode) {
        for (ErrorCode value : ErrorCode.values()) {
            if (value.code == statusCode) {
                return value;
            }
        }
        return ErrorCode.INTERNAL_ERROR;
    }

    private String resolvePath(HttpServletRequest request) {
        return request != null ? request.getRequestURI() : "unknown";
    }
}
