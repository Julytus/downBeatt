package vn.aeoc.authenticate.util;

import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.nio.charset.StandardCharsets;

/** Quy tắc mật khẩu dùng chung cho đăng ký, tạo user, đổi / đặt lại mật khẩu. */
public final class PasswordPolicy {
    public static final int MIN_LENGTH = 8;
    // BCrypt chỉ dùng 72 byte đầu: dài hơn thì phần sau bị bỏ qua âm thầm
    public static final int MAX_BYTES = 72;

    private PasswordPolicy() {
    }

    public static void validate(String password) {
        if (password == null
                || password.length() < MIN_LENGTH
                || password.getBytes(StandardCharsets.UTF_8).length > MAX_BYTES) {
            throw new AppException(ErrorCode.WEAK_PASSWORD);
        }
    }
}
