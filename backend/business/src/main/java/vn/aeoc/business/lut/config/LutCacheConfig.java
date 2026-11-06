package vn.aeoc.business.lut.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import vn.aeoc.entity.data.mysql.lut.LutCategory;
import java.time.Duration;
import java.util.List;

@Configuration
public class LutCacheConfig {
    @Bean(name = "lutCategoryCache")
    public Cache<String, List<LutCategory>> lutCategoryCache() {
        return Caffeine.newBuilder().expireAfterWrite(Duration.ofMinutes(10)).build();
    }
}
