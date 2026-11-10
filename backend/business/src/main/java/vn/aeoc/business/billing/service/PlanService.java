package vn.aeoc.business.billing.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.stereotype.Service;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.billing.repository.PlanRepository;
import vn.aeoc.entity.data.mysql.billing.Plan;

import java.time.Duration;
import java.util.List;

@Service
public class PlanService extends BaseService<PlanRepository, Plan, Integer> {
    private final Cache<String, List<Plan>> cache;

    public PlanService(PlanRepository repository, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofMinutes(5))
                .build();
    }

    public List<Plan> listPublic() {
        return cache.get("public_plans", k -> repository.findActivePlans());
    }

    public Plan findByCode(String code) {
        return repository.findByCode(code);
    }

    public void clearCache() {
        cache.invalidateAll();
    }
}
