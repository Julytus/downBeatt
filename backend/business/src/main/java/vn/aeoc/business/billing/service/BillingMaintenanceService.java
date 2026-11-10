package vn.aeoc.business.billing.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.business.billing.repository.PaymentOrderRepository;
import vn.aeoc.business.billing.repository.SubscriptionRepository;

import java.time.LocalDateTime;
import java.time.ZoneId;

@Slf4j
@Service
public class BillingMaintenanceService {
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final SubscriptionRepository subscriptionRepository;
    private final PaymentOrderRepository paymentOrderRepository;

    public BillingMaintenanceService(SubscriptionRepository subscriptionRepository,
                                     PaymentOrderRepository paymentOrderRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.paymentOrderRepository = paymentOrderRepository;
    }

    @Scheduled(cron = "0 10 0 * * *", zone = "Asia/Ho_Chi_Minh")
    public void scheduledExpire() {
        expireOverdue(LocalDateTime.now(DEFAULT_ZONE));
    }

    @Transactional
    public void expireOverdue(LocalDateTime now) {
        int expiredSubs = subscriptionRepository.expireOverdue(now.toLocalDate());
        int expiredOrders = paymentOrderRepository.expirePending(now.minusHours(24));
        log.info("Billing maintenance completed: expired {} subscriptions, {} orders", expiredSubs, expiredOrders);
    }
}
