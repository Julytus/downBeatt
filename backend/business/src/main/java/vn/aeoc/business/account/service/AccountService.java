package vn.aeoc.business.account.service;

import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.business.billing.service.PlanService;
import vn.aeoc.business.billing.service.SubscriptionService;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.mysql.billing.Plan;
import vn.aeoc.entity.data.mysql.billing.Subscription;
import vn.aeoc.entity.data.response.TokenResponse;

import java.time.LocalDate;

@Service
public class AccountService {
    private final UserService userService;
    private final SubscriptionService subscriptionService;
    private final PlanService planService;

    public AccountService(UserService userService,
                          SubscriptionService subscriptionService,
                          PlanService planService) {
        this.userService = userService;
        this.subscriptionService = subscriptionService;
        this.planService = planService;
    }

    public TokenResponse register(User request) {
        return userService.register(request);
    }

    public User me(Integer userId) {
        if (userId == null || userId <= 0) {
            throw new AppException(ErrorCode.LOGIN);
        }
        User user = userService.getUserById(userId);
        if (user == null || user.getId() == null) {
            throw new AppException(ErrorCode.LOGIN);
        }
        if (CommonUtils.NVL(user.getActive()) != 1) {
            throw new AppException(ErrorCode.LOCK_ACCOUNT);
        }
        User result = new User();
        result.setId(user.getId());
        result.setName(user.getName());
        result.setEmail(user.getEmail());

        Subscription activeSub = subscriptionService.findActiveByUserId(userId, LocalDate.now());
        if (activeSub != null) {
            Plan plan = planService.getById(activeSub.getPlanId());
            if (plan != null) {
                result.setPlan(plan.getCode());
                result.setPlanExpiresAt(activeSub.getEndDate());
                result.setPlanAutoRenew(activeSub.getAutoRenew());
                return result;
            }
        }

        result.setPlan("free");
        result.setPlanExpiresAt(null);
        return result;
    }
}
