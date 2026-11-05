package vn.aeoc.authenticate.service.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.repository.auth.RefreshTokenRepository;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private final RefreshTokenRepository repository;
    private final Duration ttl;
    public RefreshTokenService(RefreshTokenRepository repository, @Value("${security.jwt.refresh-expired-in:30d}") Duration ttl) {
        this.repository = repository; this.ttl = ttl;
    }
    public String issue(Integer userId) {
        repository.deleteExpiredByUserId(userId);
        byte[] bytes = new byte[32]; RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        repository.insert(userId, sha256(token), Math.toIntExact(ttl.toSeconds()));
        return token;
    }
    public Integer consume(String token) {
        if (token == null || token.isBlank()) throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        String hash = sha256(token);
        var found = repository.findValidByHash(hash);
        if (found == null) {
            var expired = repository.findByHash(hash);
            if (expired != null) repository.deleteById(expired.getId());
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        if (repository.deleteById(found.getId()) != 1) throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        return found.getUserId();
    }
    public void revoke(String token) {
        try { consume(token); } catch (AppException ignored) { }
    }
    public void revokeAll(Integer userId) { if (userId != null) repository.deleteByUserId(userId); }
    private static String sha256(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch (NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
}
