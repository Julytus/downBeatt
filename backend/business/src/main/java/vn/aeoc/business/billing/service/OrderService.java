package vn.aeoc.business.billing.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.billing.payos.PayosClient;
import vn.aeoc.business.billing.repository.PaymentOrderRepository;
import vn.aeoc.business.billing.repository.PlanRepository;
import vn.aeoc.business.billing.repository.SubscriptionRepository;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;
import vn.aeoc.entity.data.mysql.billing.Plan;
import vn.aeoc.entity.data.mysql.billing.Subscription;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.util.List;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

import static vn.entity.backend.Tables.PAYMENT_ORDER;

@Slf4j
@Service
public class OrderService extends BaseService<PaymentOrderRepository, PaymentOrder, Integer> {
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final PlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PayosClient payosClient;
    private final PaymentActivationService paymentActivationService;
    private final LutService lutService;
    private final Clock clock;
    private final String frontendUrl;

    private final Cache<String, Instant> reconciliationThrottle;

    @Autowired
    public OrderService(PaymentOrderRepository repository,
                        QueryExecutor queryExecutor,
                        PlanRepository planRepository,
                        SubscriptionRepository subscriptionRepository,
                        PayosClient payosClient,
                        PaymentActivationService paymentActivationService,
                        LutService lutService,
                        @Value("${system.frontend-url:http://localhost:4200}") String frontendUrl) {
        this(repository, queryExecutor, planRepository, subscriptionRepository, payosClient, paymentActivationService,
                lutService, Clock.system(DEFAULT_ZONE), frontendUrl);
    }

    public OrderService(PaymentOrderRepository repository,
                        QueryExecutor queryExecutor,
                        PlanRepository planRepository,
                        SubscriptionRepository subscriptionRepository,
                        PayosClient payosClient,
                        PaymentActivationService paymentActivationService,
                        LutService lutService,
                        Clock clock,
                        String frontendUrl) {
        super(repository, queryExecutor);
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.payosClient = payosClient;
        this.paymentActivationService = paymentActivationService;
        this.lutService = lutService;
        this.clock = clock;
        this.frontendUrl = frontendUrl != null ? frontendUrl.replaceAll("/+$", "") : "http://localhost:4200";
        this.reconciliationThrottle = Caffeine.newBuilder()
                .expireAfterWrite(Duration.ofSeconds(5))
                .build();
    }

    public PaymentOrder create(Integer userId, PaymentOrder request) {
        if (request == null || request.getPlanCode() == null
                || (!"pro".equals(request.getPlanCode()) && !"studio".equals(request.getPlanCode()))) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Gói không hợp lệ");
        }
        Plan plan = planRepository.findByCode(request.getPlanCode());
        if (plan == null || plan.getActive() == null || plan.getActive() != 1) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Gói không hợp lệ");
        }

        if (request.getCycle() == null || (!"MONTH".equals(request.getCycle()) && !"YEAR".equals(request.getCycle()))) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Chu kỳ không hợp lệ");
        }

        LocalDate today = LocalDate.now(clock);
        Subscription activeSub = subscriptionRepository.findActiveByUserId(userId, today);
        if (activeSub != null) {
            Plan currentPlan = planRepository.getById(activeSub.getPlanId());
            if (currentPlan != null && plan.getMonthlyPrice() < currentPlan.getMonthlyPrice()) {
                long remainingDays = ChronoUnit.DAYS.between(today, activeSub.getEndDate());
                if (remainingDays > 3) {
                    throw new AppException(ErrorCode.PLAN_ACTIVE,
                            "Bạn đang dùng gói " + currentPlan.getName() + ", cao hơn gói " + plan.getName());
                }
            }
        }

        long amount = "YEAR".equals(request.getCycle()) ? plan.getYearlyMonthlyPrice() * 12 : plan.getMonthlyPrice();

        Integer sourceLutId = request.getSourceLutId();
        if (sourceLutId != null) {
            if (sourceLutId <= 0 || lutService.getById(sourceLutId) == null) {
                sourceLutId = null;
            }
        }

        PaymentOrder order = new PaymentOrder();
        order.setUserId(userId);
        order.setPlanId(plan.getId());
        order.setCycle(request.getCycle());
        order.setAmount(amount);
        order.setStatus("PENDING");
        order.setSourceLutId(sourceLutId);

        // Sinh mã và thử lại tối đa 3 lần nếu trùng mã
        boolean inserted = false;
        for (int i = 0; i < 3; i++) {
            String code = repository.generateNextOrderCode(today);
            long payosOrderCode = Long.parseLong(code.substring(2));
            order.setCode(code);
            order.setPayosOrderCode(payosOrderCode);
            try {
                PaymentOrder created = insert(order);
                order.setId(created.getId());
                inserted = true;
                break;
            } catch (Exception e) {
                log.warn("Insert order collision for code {}, retry {}/3", code, i + 1);
            }
        }

        if (!inserted) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Không thể tạo mã đơn hàng, vui lòng thử lại");
        }

        long expiredAt = LocalDateTime.now(clock).plusHours(24).atZone(DEFAULT_ZONE).toEpochSecond();
        String returnUrl = frontendUrl + "/thanh-toan/ket-qua/" + order.getCode();
        String cancelUrl = returnUrl;
        String itemName = "Gói " + plan.getName() + " - " + ("YEAR".equals(request.getCycle()) ? "12" : "1") + " tháng";

        try {
            PayosClient.CreateLinkResult link = payosClient.createLink(
                    order.getPayosOrderCode(),
                    amount,
                    "DownBeat",
                    returnUrl,
                    cancelUrl,
                    expiredAt,
                    itemName
            );
            repository.updateFieldByCondition(PAYMENT_ORDER.ID.eq(order.getId()), PAYMENT_ORDER.PAYOS_PAYMENT_LINK_ID, link.paymentLinkId());
            repository.updateFieldByCondition(PAYMENT_ORDER.ID.eq(order.getId()), PAYMENT_ORDER.CHECKOUT_URL, link.checkoutUrl());

            PaymentOrder result = new PaymentOrder();
            result.setCode(order.getCode());
            result.setAmount(order.getAmount());
            result.setCheckoutUrl(link.checkoutUrl());
            return result;
        } catch (Exception e) {
            repository.markCancelled(order.getId());
            if (e instanceof AppException ae) {
                throw ae;
            }
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    public PaymentOrder get(String code, Integer userId) {
        PaymentOrder order = repository.getOrderByCode(code);
        if (order == null || !userId.equals(order.getUserId())) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy đơn hàng");
        }

        if ("PENDING".equals(order.getStatus()) && order.getPayosPaymentLinkId() != null) {
            if (reconciliationThrottle.getIfPresent(order.getCode()) == null) {
                reconciliationThrottle.put(order.getCode(), Instant.now());
                try {
                    PayosClient.PaymentLinkStatus linkStatus = payosClient.getStatus(order.getPayosOrderCode());
                    if ("PAID".equals(linkStatus.status()) && order.getAmount().equals(linkStatus.amount())) {
                        paymentActivationService.activate(
                                order,
                                linkStatus.reference(),
                                linkStatus.rawPayload() != null ? linkStatus.rawPayload().toString() : null,
                                LocalDate.now(clock)
                        );
                        order = repository.getOrderByCode(code);
                    }
                } catch (Exception e) {
                    log.warn("Reconciliation check failed for {}: {}", order.getCode(), e.getMessage());
                }
            }
        }

        if ("PAID".equals(order.getStatus())) {
            Subscription active = subscriptionRepository.findActiveByUserId(userId, LocalDate.now(clock));
            if (active != null) {
                order.setPlanExpiresAt(active.getEndDate());
            }
        }

        return order;
    }

    public PaymentOrder cancel(String code, Integer userId) {
        PaymentOrder order = repository.getOrderByCode(code);
        if (order == null || !userId.equals(order.getUserId())) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy đơn hàng");
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS, "Đơn hàng đã được xử lý");
        }

        int rows = repository.markCancelled(order.getId());
        if (rows == 0) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS, "Đơn hàng đã được xử lý");
        }

        payosClient.cancelLink(order.getPayosOrderCode());
        return repository.getOrderByCode(code);
    }

    public PaymentOrder mockPay(String code, Integer userId) {
        PaymentOrder order = repository.getOrderByCode(code);
        if (order == null || !userId.equals(order.getUserId())) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy đơn hàng");
        }
        if (!"PENDING".equals(order.getStatus())) {
            throw new AppException(ErrorCode.ORDER_INVALID_STATUS, "Đơn hàng đã được xử lý");
        }

        paymentActivationService.activate(order, "MOCK", "{\"mock\": true}", LocalDate.now(clock));
        order = repository.getOrderByCode(code);
        if ("PAID".equals(order.getStatus())) {
            Subscription active = subscriptionRepository.findActiveByUserId(userId, LocalDate.now(clock));
            if (active != null) {
                order.setPlanExpiresAt(active.getEndDate());
            }
        }
        return order;
    }

    public List<UserSignal> purchaseSignals(Integer userId, LocalDateTime since) {
        if (userId == null) {
            return List.of();
        }
        return repository.purchaseSignals(userId, since);
    }
}
