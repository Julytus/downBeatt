package vn.aeoc.authenticate.service.auth;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Ticker;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.config.property.AuthGuardProperties;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import java.util.Locale;

@Service
public class LoginAttemptService {
    public record Attempt(int count, long startedAtNanos) { }
    private final @Qualifier("loginAttemptCache") Cache<String, Attempt> cache;
    private final AuthGuardProperties properties;
    private final Ticker ticker;
    public LoginAttemptService(@Qualifier("loginAttemptCache") Cache<String, Attempt> cache,
                               AuthGuardProperties properties, Ticker ticker) {
        this.cache = cache; this.properties = properties; this.ticker = ticker;
    }
    public void checkNotLocked(String identifier) {
        Attempt attempt = cache.getIfPresent(key(identifier));
        if (attempt != null && attempt.count() >= properties.getLoginMaxFailures()) throw new AppException(ErrorCode.LOGIN_TOO_MANY_ATTEMPTS);
    }
    public void onFailure(String identifier) {
        String key = key(identifier);
        cache.asMap().compute(key, (k, current) -> current == null
                ? new Attempt(1, ticker.read()) : new Attempt(current.count() + 1, current.startedAtNanos()));
    }
    public void onSuccess(String identifier) { cache.invalidate(key(identifier)); }
    private static String key(String identifier) { return identifier.trim().toLowerCase(Locale.ROOT); }
}
