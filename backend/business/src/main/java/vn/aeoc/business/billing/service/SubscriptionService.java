package vn.aeoc.business.billing.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.billing.repository.SubscriptionRepository;
import vn.aeoc.entity.data.mysql.billing.Plan;
import vn.aeoc.entity.data.mysql.billing.Subscription;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class SubscriptionService extends BaseService<SubscriptionRepository, Subscription, Integer> {
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PlanService planService;
    private final Clock clock;

    @Autowired
    public SubscriptionService(SubscriptionRepository repository,
                               QueryExecutor queryExecutor,
                               PlanService planService) {
        this(repository, queryExecutor, planService, Clock.system(DEFAULT_ZONE));
    }

    public SubscriptionService(SubscriptionRepository repository,
                               QueryExecutor queryExecutor,
                               PlanService planService,
                               Clock clock) {
        super(repository, queryExecutor);
        this.planService = planService;
        this.clock = clock;
    }

    public Subscription findActiveByUserId(Integer userId, LocalDate today) {
        return repository.findActiveByUserId(userId, today);
    }

    public Subscription my(Integer userId) {
        LocalDate today = LocalDate.now(clock);
        Subscription activeSub = repository.findActiveByUserId(userId, today);
        if (activeSub != null) {
            Plan plan = planService.getById(activeSub.getPlanId());
            if (plan != null) {
                activeSub.setPlanCode(plan.getCode());
                activeSub.setPlanName(plan.getName());
            }
            return activeSub;
        }

        Subscription freeSub = new Subscription();
        freeSub.setPlanCode("free");
        Plan freePlan = planService.findByCode("free");
        freeSub.setPlanName(freePlan != null ? freePlan.getName() : "Miễn phí");
        return freeSub;
    }

    @Transactional
    public Subscription cancel(Integer userId) {
        LocalDate today = LocalDate.now(clock);
        Subscription activeSub = repository.findActiveByUserId(userId, today);
        if (activeSub == null) {
            throw new AppException(ErrorCode.NO_ACTIVE_PLAN);
        }

        repository.disableAutoRenew(activeSub.getId());
        activeSub.setAutoRenew(0);

        Plan plan = planService.getById(activeSub.getPlanId());
        if (plan != null) {
            activeSub.setPlanCode(plan.getCode());
            activeSub.setPlanName(plan.getName());
        }

        return activeSub;
    }
}
