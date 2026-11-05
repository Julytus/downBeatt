package vn.aeoc.authenticate.config.property;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Chống dò mật khẩu theo tài khoản (bộ đếm Caffeine trong bộ nhớ, mỗi instance đếm riêng).
 * Giới hạn theo IP do nginx đảm nhận (deploy/nginx/default.conf, zone auth_limit).
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "security.guard")
public class AuthGuardProperties {

    /** Số lần đăng nhập sai liên tiếp cho 1 tài khoản trước khi khoá tạm. */
    private int loginMaxFailures = 10;

    /** Thời gian khoá tạm đăng nhập (tính từ lần sai đầu tiên trong chuỗi). */
    private Duration loginLockDuration = Duration.ofMinutes(15);
}
