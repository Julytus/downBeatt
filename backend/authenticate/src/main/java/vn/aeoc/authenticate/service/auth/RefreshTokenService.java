package vn.aeoc.authenticate.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;

/**
 * Refresh token dạng chuỗi ngẫu nhiên (không phải JWT), lưu SHA-256 ở Redis:
 * <ul>
 *   <li>{@code auth:rt:{hash}} = userId, TTL = security.jwt.refresh-expired-in</li>
 *   <li>{@code auth:rt:user:{userId}} = tập hash của user => thu hồi toàn bộ phiên khi đổi mật khẩu / khoá / xoá</li>
 * </ul>
 * Mỗi lần refresh dùng xong token cũ bị xoá (rotation): token bị lộ chỉ dùng được 1 lần.
 */
@Service
public class RefreshTokenService {
    private static final String TOKEN_KEY = "auth:rt:";
    private static final String USER_KEY = "auth:rt:user:";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final StringRedisTemplate redis;
    private final Duration ttl;

    public RefreshTokenService(StringRedisTemplate redis,
                               @Value("${security.jwt.refresh-expired-in:30d}") Duration ttl) {
        this.redis = redis;
        this.ttl = ttl;
    }

    public String issue(Integer userId) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        String hash = sha256(token);
        redis.opsForValue().set(TOKEN_KEY + hash, userId.toString(), ttl);
        redis.opsForSet().add(USER_KEY + userId, hash);
        redis.expire(USER_KEY + userId, ttl);
        return token;
    }

    /** Dùng token (xoá luôn) và trả về userId; token không hợp lệ / hết hạn / đã dùng => 401. */
    public Integer consume(String token) {
        if (token == null || token.isBlank()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        String hash = sha256(token);
        String userId = redis.opsForValue().getAndDelete(TOKEN_KEY + hash);
        if (userId == null) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        redis.opsForSet().remove(USER_KEY + userId, hash);
        return Integer.valueOf(userId);
    }

    /** Đăng xuất 1 phiên. */
    public void revoke(String token) {
        try {
            consume(token);
        } catch (AppException ignored) {
            // token đã hết hạn / không tồn tại: coi như đã đăng xuất
        }
    }

    /** Đăng xuất mọi phiên của user. */
    public void revokeAll(Integer userId) {
        if (userId == null) {
            return;
        }
        Set<String> hashes = redis.opsForSet().members(USER_KEY + userId);
        List<String> keys = new ArrayList<>();
        keys.add(USER_KEY + userId);
        if (hashes != null) {
            hashes.forEach(hash -> keys.add(TOKEN_KEY + hash));
        }
        redis.delete(keys);
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
