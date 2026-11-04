package vn.aeoc.authenticate.service.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.config.property.AuthGuardProperties;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.util.CommonUtils;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * OTP quên mật khẩu lưu ở Redis: chỉ giữ SHA-256 của mã, có TTL,
 * giới hạn số lần nhập sai và thời gian chờ giữa 2 lần gửi.
 */
@Service
@RequiredArgsConstructor
public class OtpService {
    private static final String OTP_KEY = "auth:otp:";
    private static final String FAIL_KEY = "auth:otp:fail:";
    private static final String COOLDOWN_KEY = "auth:otp:cooldown:";
    private static final int OTP_LENGTH = 6;

    private final StringRedisTemplate redis;
    private final AuthGuardProperties properties;

    /**
     * Tạo mã mới cho email.
     *
     * @return mã OTP (để gửi mail); rỗng nếu vừa gửi trong khoảng otp-resend-interval
     */
    public Optional<String> issue(String email) {
        String id = normalize(email);
        Boolean allowed = redis.opsForValue().setIfAbsent(COOLDOWN_KEY + id, "1", properties.getOtpResendInterval());
        if (!Boolean.TRUE.equals(allowed)) {
            return Optional.empty();
        }

        String otp = CommonUtils.randomNumber(OTP_LENGTH);
        redis.opsForValue().set(OTP_KEY + id, sha256(otp), properties.getOtpTtl());
        redis.delete(FAIL_KEY + id);
        return Optional.of(otp);
    }

    /**
     * Kiểm tra và tiêu thụ mã (đúng => xoá, mỗi mã chỉ dùng 1 lần).
     * Sai quá otp-max-attempts lần => huỷ mã.
     */
    public void verify(String email, String otp) {
        String id = normalize(email);
        String stored = redis.opsForValue().get(OTP_KEY + id);
        if (stored == null) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        boolean match = MessageDigest.isEqual(
                stored.getBytes(StandardCharsets.UTF_8),
                sha256(otp.trim()).getBytes(StandardCharsets.UTF_8));
        if (match) {
            redis.delete(List.of(OTP_KEY + id, FAIL_KEY + id));
            return;
        }

        Long fails = redis.opsForValue().increment(FAIL_KEY + id);
        redis.expire(FAIL_KEY + id, properties.getOtpTtl());
        if (fails != null && fails >= properties.getOtpMaxAttempts()) {
            redis.delete(List.of(OTP_KEY + id, FAIL_KEY + id));
            throw new AppException(ErrorCode.OTP_TOO_MANY_ATTEMPTS);
        }
        throw new AppException(ErrorCode.OTP_INVALID);
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String sha256(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
