package vn.aeoc.business.dashboard.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.dashboard.calc.CountDay;
import vn.aeoc.business.dashboard.calc.DashboardCalculator;
import vn.aeoc.business.dashboard.calc.DateRange;
import vn.aeoc.business.dashboard.calc.DownloadDay;
import vn.aeoc.business.dashboard.calc.RevenueDay;
import vn.aeoc.business.dashboard.repository.DashboardRepository;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;
import vn.aeoc.entity.data.mysql.dashboard.ActivePlans;
import vn.aeoc.entity.data.mysql.dashboard.DashboardPoint;
import vn.aeoc.entity.data.mysql.dashboard.DashboardSummary;
import vn.aeoc.entity.data.mysql.dashboard.DashboardTopLut;
import vn.aeoc.entity.data.mysql.dashboard.DashboardTotals;
import vn.aeoc.entity.data.mysql.dashboard.PlanCustomers;
import vn.aeoc.entity.data.mysql.dashboard.PlanRevenue;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DashboardService extends BaseService<DashboardRepository, PaymentOrder, Integer> {

    public static final int MAX_DAYS = 366;
    public static final int AUTO_DAY_MAX_DAYS = 92;
    public static final int TOP_LIMIT = 10;

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter STRICT_FORMATTER = DateTimeFormatter.ofPattern("uuuu-MM-dd")
            .withResolverStyle(ResolverStyle.STRICT);

    private final Clock clock;

    @Autowired
    public DashboardService(DashboardRepository repository, QueryExecutor queryExecutor) {
        this(repository, Clock.system(DEFAULT_ZONE), queryExecutor);
    }

    public DashboardService(DashboardRepository repository, Clock clock, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.clock = clock;
    }

    public DashboardSummary summary(String from, String to, String groupBy) {
        LocalDate toDate;
        if (to == null || to.isBlank()) {
            toDate = LocalDate.now(clock);
        } else {
            try {
                toDate = LocalDate.parse(to.trim(), STRICT_FORMATTER);
            } catch (DateTimeParseException e) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Ngày không hợp lệ");
            }
        }

        LocalDate fromDate;
        if (from == null || from.isBlank()) {
            fromDate = toDate.minusDays(29);
        } else {
            try {
                fromDate = LocalDate.parse(from.trim(), STRICT_FORMATTER);
            } catch (DateTimeParseException e) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Ngày không hợp lệ");
            }
        }

        if (fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }

        long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        if (days > MAX_DAYS) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Khoảng thời gian tối đa 366 ngày");
        }

        String actualGroupBy = DashboardCalculator.resolveGroupBy(groupBy, days);
        DateRange prevRange = DashboardCalculator.previousRange(fromDate, toDate);

        LocalDateTime fromTime = fromDate.atStartOfDay();
        LocalDateTime toExTime = toDate.plusDays(1).atStartOfDay();

        List<RevenueDay> revDays = repository.revenueByDay(fromTime, toExTime);
        List<CountDay> countDays = repository.newCustomersByDay(fromTime, toExTime);
        List<DownloadDay> dlDays = repository.downloadsByDay(fromTime, toExTime);

        DashboardTotals currentSummary = DashboardCalculator.totals(revDays, countDays, dlDays);
        List<DashboardPoint> series = DashboardCalculator.series(fromDate, toDate, actualGroupBy, revDays, countDays, dlDays);
        List<PlanRevenue> revByPlan = repository.revenueByPlan(fromTime, toExTime);
        List<DashboardTopLut> topLuts = repository.topLuts(fromTime, toExTime, TOP_LIMIT);

        LocalDateTime prevFromTime = prevRange.from().atStartOfDay();
        LocalDateTime prevToExTime = prevRange.to().plusDays(1).atStartOfDay();

        List<RevenueDay> prevRevDays = repository.revenueByDay(prevFromTime, prevToExTime);
        List<CountDay> prevCountDays = repository.newCustomersByDay(prevFromTime, prevToExTime);
        List<DownloadDay> prevDlDays = repository.downloadsByDay(prevFromTime, prevToExTime);

        DashboardTotals previous = DashboardCalculator.totals(prevRevDays, prevCountDays, prevDlDays);
        previous.setFrom(prevRange.from().toString());
        previous.setTo(prevRange.to().toString());

        LocalDate today = LocalDate.now(clock);
        long totalCustomers = repository.customerCount();
        List<PlanCustomers> paidItems = repository.paidCustomersByPlan(today);

        long sumPaid = 0L;
        if (paidItems != null) {
            for (PlanCustomers item : paidItems) {
                if (!"free".equalsIgnoreCase(item.getPlanCode())) {
                    sumPaid += (item.getCustomers() != null ? item.getCustomers() : 0L);
                }
            }
            long freeCustomers = Math.max(0L, totalCustomers - sumPaid);
            for (PlanCustomers item : paidItems) {
                if ("free".equalsIgnoreCase(item.getPlanCode())) {
                    item.setCustomers(freeCustomers);
                }
            }
        }

        ActivePlans activePlans = ActivePlans.builder()
                .totalCustomers(totalCustomers)
                .items(paidItems)
                .build();

        return DashboardSummary.builder()
                .from(fromDate.toString())
                .to(toDate.toString())
                .groupBy(actualGroupBy)
                .summary(currentSummary)
                .previous(previous)
                .series(series)
                .revenueByPlan(revByPlan)
                .activePlans(activePlans)
                .topLuts(topLuts)
                .build();
    }
}
