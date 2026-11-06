package vn.aeoc.authenticate.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.repository.auth.RefreshTokenRepository;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.entity.data.mysql.auth.RefreshToken;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;

/** Refresh token lưu MySQL dạng băm SHA-256, dùng một lần (xoay vòng). */
@Service
public class RefreshTokenService extends BaseService<RefreshTokenRepository, RefreshToken, Long> {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final Duration ttl;

    public RefreshTokenService(RefreshTokenRepository repository,
                               QueryExecutor queryExecutor,
                               @Value("${security.jwt.refresh-expired-in:30d}") Duration ttl) {
        super(repository, queryExecutor);
        this.ttl = ttl;
    }

    public String issue(Integer userId) {
        repository.deleteExpiredByUserId(userId);
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        repository.insert(userId, sha256(token), Math.toIntExact(ttl.toSeconds()));
        return token;
    }

    public Integer consume(String token) {
        if (token == null || token.isBlank()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        String hash = sha256(token);
        RefreshToken found = repository.findValidByHash(hash);
        if (found == null) {
            RefreshToken expired = repository.findByHash(hash);
            if (expired != null) {
                delete(expired.getId());
            }
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        // Hai request cùng dùng một token: chỉ request xoá được dòng mới thắng.
        if (delete(found.getId()) != 1) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        return found.getUserId();
    }

    public void revoke(String token) {
        try {
            consume(token);
        } catch (AppException ignored) {
            // Đăng xuất bằng token đã hết hạn / không tồn tại: coi như thành công.
        }
    }

    public void revokeAll(Integer userId) {
        if (userId != null) {
            repository.deleteByUserId(userId);
        }
    }

    private static String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
