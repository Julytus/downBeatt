package vn.aeoc.authenticate.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.config.property.AuthGuardProperties;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.util.Locale;

/**
 * Đếm số lần đăng nhập sai theo tài khoản (email/SĐT), khoá tạm khi vượt ngưỡng.
 * Bổ sung cho giới hạn theo IP ở nginx: chặn dò mật khẩu 1 tài khoản từ nhiều IP.
 */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {
    private static final String FAIL_KEY = "auth:login:fail:";

    private final StringRedisTemplate redis;
    private final AuthGuardProperties properties;

    public void checkNotLocked(String identifier) {
        String count = redis.opsForValue().get(key(identifier));
        if (count != null && Long.parseLong(count) >= properties.getLoginMaxFailures()) {
            throw new AppException(ErrorCode.LOGIN_TOO_MANY_ATTEMPTS);
        }
    }

    public void onFailure(String identifier) {
        String key = key(identifier);
        Long fails = redis.opsForValue().increment(key);
        if (fails != null && fails == 1) {
            redis.expire(key, properties.getLoginLockDuration());
        }
    }

    public void onSuccess(String identifier) {
        redis.delete(key(identifier));
    }

    private static String key(String identifier) {
        return FAIL_KEY + identifier.trim().toLowerCase(Locale.ROOT);
    }
}
