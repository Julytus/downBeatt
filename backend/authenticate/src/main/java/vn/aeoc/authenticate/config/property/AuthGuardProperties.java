package vn.aeoc.authenticate.config.property;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Chống dò mật khẩu / OTP (lưu bộ đếm ở Redis, dùng chung giữa các instance).
 * Giới hạn theo IP do nginx đảm nhận (deploy/nginx/default.conf, zone auth_limit).
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "security.guard")
public class AuthGuardProperties {

    /** Thời gian sống của mã OTP quên mật khẩu. */
    private Duration otpTtl = Duration.ofMinutes(5);

    /** Số lần nhập sai OTP tối đa; vượt quá => huỷ mã, phải yêu cầu mã mới. */
    private int otpMaxAttempts = 5;

    /** Khoảng cách tối thiểu giữa 2 lần gửi OTP cho cùng 1 email. */
    private Duration otpResendInterval = Duration.ofSeconds(60);

    /** Số lần đăng nhập sai liên tiếp cho 1 tài khoản trước khi khoá tạm. */
    private int loginMaxFailures = 10;

    /** Thời gian khoá tạm đăng nhập (tính từ lần sai đầu tiên trong chuỗi). */
    private Duration loginLockDuration = Duration.ofMinutes(15);
}
