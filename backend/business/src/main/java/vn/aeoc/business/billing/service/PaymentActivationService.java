package vn.aeoc.business.billing.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.business.billing.repository.PaymentOrderRepository;
import vn.aeoc.business.billing.repository.PlanRepository;
import vn.aeoc.business.billing.repository.SubscriptionRepository;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;
import vn.aeoc.entity.data.mysql.billing.Plan;
import vn.aeoc.entity.data.mysql.billing.Subscription;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import static vn.entity.backend.Tables.SUBSCRIPTION;

@Slf4j
@Service
public class PaymentActivationService {
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PaymentOrderRepository paymentOrderRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final Clock clock;

    @Autowired
    public PaymentActivationService(PaymentOrderRepository paymentOrderRepository,
                                    SubscriptionRepository subscriptionRepository,
                                    PlanRepository planRepository) {
        this(paymentOrderRepository, subscriptionRepository, planRepository, Clock.system(DEFAULT_ZONE));
    }

    public PaymentActivationService(PaymentOrderRepository paymentOrderRepository,
                                    SubscriptionRepository subscriptionRepository,
                                    PlanRepository planRepository,
                                    Clock clock) {
        this.paymentOrderRepository = paymentOrderRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.clock = clock;
    }

    @Transactional
    public void activate(PaymentOrder order, String reference, String payload) {
        activate(order, reference, payload, LocalDate.now(clock));
    }

    @Transactional
    public void activate(PaymentOrder order, String reference, String payload, LocalDate today) {
        if (order == null || order.getId() == null) {
            return;
        }

        int rows = paymentOrderRepository.markPaid(order.getId(), reference, payload);
        if (rows == 0) {
            PaymentOrder current = paymentOrderRepository.getById(order.getId());
            if (current != null && ("CANCELLED".equals(current.getStatus()) || "EXPIRED".equals(current.getStatus()))) {
                log.warn("Nhận tiền cho đơn {} đã {}, cần hoàn tiền tay", current.getCode(), current.getStatus());
            }
            return;
        }

        Subscription activeSub = subscriptionRepository.findActiveForUpdate(order.getUserId());
        int months = "YEAR".equalsIgnoreCase(order.getCycle()) ? 12 : 1;

        if (activeSub == null || activeSub.getEndDate().isBefore(today)) {
            if (activeSub != null) {
                subscriptionRepository.updateStatus(activeSub.getId(), "EXPIRED");
            }
            Subscription sub = new Subscription();
            sub.setUserId(order.getUserId());
            sub.setPlanId(order.getPlanId());
            sub.setOrderId(order.getId());
            sub.setCycle(order.getCycle());
            sub.setStatus("ACTIVE");
            sub.setStartDate(today);
            sub.setEndDate(today.plusMonths(months));
            sub.setAutoRenew(1);
            subscriptionRepository.insert(sub);
        } else if (activeSub.getPlanId().equals(order.getPlanId())) {
            // Cùng gói: gia hạn cộng nối tiếp từ end_date cũ
            LocalDate newEnd = activeSub.getEndDate().plusMonths(months);
            activeSub.setEndDate(newEnd);
            activeSub.setCycle(order.getCycle());
            activeSub.setOrderId(order.getId());
            subscriptionRepository.updateByCondition(
                    SUBSCRIPTION.ID.eq(activeSub.getId()),
                    activeSub,
                    SUBSCRIPTION.END_DATE, SUBSCRIPTION.CYCLE, SUBSCRIPTION.ORDER_ID
            );
        } else {
            // Đổi gói: huỷ dòng cũ, dòng mới bắt đầu hôm nay + quy đổi ngày còn lại
            subscriptionRepository.updateStatus(activeSub.getId(), "CANCELLED");

            long remainingDays = ChronoUnit.DAYS.between(today, activeSub.getEndDate());
            if (remainingDays < 0) {
                remainingDays = 0;
            }

            Plan oldPlan = planRepository.getById(activeSub.getPlanId());
            Plan newPlan = planRepository.getById(order.getPlanId());

            long oldMonthlyPrice = "YEAR".equalsIgnoreCase(activeSub.getCycle())
                    ? oldPlan.getYearlyMonthlyPrice()
                    : oldPlan.getMonthlyPrice();
            long newMonthlyPrice = "YEAR".equalsIgnoreCase(order.getCycle())
                    ? newPlan.getYearlyMonthlyPrice()
                    : newPlan.getMonthlyPrice();

            int creditDays = PlanCredit.creditDays(remainingDays, oldMonthlyPrice, newMonthlyPrice);

            Subscription sub = new Subscription();
            sub.setUserId(order.getUserId());
            sub.setPlanId(order.getPlanId());
            sub.setOrderId(order.getId());
            sub.setCycle(order.getCycle());
            sub.setStatus("ACTIVE");
            sub.setStartDate(today);
            sub.setEndDate(today.plusMonths(months).plusDays(creditDays));
            sub.setAutoRenew(1);
            subscriptionRepository.insert(sub);
        }
    }
}
