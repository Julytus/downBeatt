package vn.aeoc.business.billing.service;

import org.springframework.stereotype.Service;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.billing.repository.SubscriptionRepository;
import vn.aeoc.entity.data.mysql.billing.Subscription;

import java.time.LocalDate;

@Service
public class SubscriptionService extends BaseService<SubscriptionRepository, Subscription, Integer> {
    public SubscriptionService(SubscriptionRepository repository, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
    }

    public Subscription findActiveByUserId(Integer userId, LocalDate today) {
        return repository.findActiveByUserId(userId, today);
    }
}
