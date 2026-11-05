package vn.aeoc.authenticate.config.cache;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Expiry;
import com.github.benmanes.caffeine.cache.Ticker;
import vn.aeoc.authenticate.service.auth.LoginAttemptService.Attempt;
import vn.aeoc.authenticate.config.property.AuthGuardProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AuthCacheConfig {

    @Bean("authCache")
    public Cache<String, Object> authCache() {
        return Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(30))
                .maximumSize(10_000)
                .build();
    }

    @Bean
    public Ticker loginAttemptTicker() { return Ticker.systemTicker(); }

    @Bean("loginAttemptCache")
    public Cache<String, Attempt> loginAttemptCache(AuthGuardProperties properties, Ticker loginAttemptTicker) {
        return Caffeine.newBuilder().maximumSize(100_000)
                .expireAfter(new Expiry<String, Attempt>() {
                    @Override public long expireAfterCreate(String key, Attempt value, long now) {
                        return properties.getLoginLockDuration().toNanos();
                    }
                    @Override public long expireAfterUpdate(String key, Attempt value, long now, long currentDuration) {
                        long elapsed = loginAttemptTicker.read() - value.startedAtNanos();
                        return Math.max(0, properties.getLoginLockDuration().toNanos() - elapsed);
                    }
                    @Override public long expireAfterRead(String key, Attempt value, long now, long currentDuration) {
                        return currentDuration;
                    }
                }).ticker(loginAttemptTicker).build();
    }
}
