package vn.aeoc.business.dashboard.calc;

import vn.aeoc.entity.data.mysql.dashboard.DashboardPoint;
import vn.aeoc.entity.data.mysql.dashboard.DashboardTotals;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public final class DashboardCalculator {

    private DashboardCalculator() {
    }

    public static String resolveGroupBy(String raw, long days) {
        if (raw != null) {
            String trimmed = raw.trim();
            if ("DAY".equalsIgnoreCase(trimmed)) {
                return "DAY";
            }
            if ("MONTH".equalsIgnoreCase(trimmed)) {
                return "MONTH";
            }
        }
        return days <= 92 ? "DAY" : "MONTH";
    }

    public static DateRange previousRange(LocalDate from, LocalDate to) {
        long n = ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevTo = from.minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(n - 1);
        return new DateRange(prevFrom, prevTo);
    }

    public static DashboardTotals totals(List<RevenueDay> revenues, List<CountDay> counts, List<DownloadDay> downloads) {
        long totalRevenue = 0L;
        long totalOrders = 0L;
        if (revenues != null) {
            for (RevenueDay r : revenues) {
                totalRevenue += r.revenue();
                totalOrders += r.orders();
            }
        }

        long totalCustomers = 0L;
        if (counts != null) {
            for (CountDay c : counts) {
                totalCustomers += c.count();
            }
        }

        long totalDownloads = 0L;
        long totalPremium = 0L;
        if (downloads != null) {
            for (DownloadDay d : downloads) {
                totalDownloads += d.downloads();
                totalPremium += d.premium();
            }
        }

        double ratio = 0.0;
        if (totalDownloads > 0) {
            ratio = BigDecimal.valueOf((double) totalPremium / totalDownloads)
                    .setScale(4, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return DashboardTotals.builder()
                .revenue(totalRevenue)
                .paidOrders(totalOrders)
                .newCustomers(totalCustomers)
                .downloads(totalDownloads)
                .premiumDownloads(totalPremium)
                .premiumRatio(ratio)
                .build();
    }

    public static List<DashboardPoint> series(LocalDate from, LocalDate to, String groupBy,
                                             List<RevenueDay> revenues, List<CountDay> counts, List<DownloadDay> downloads) {
        Map<LocalDate, long[]> dayMap = new HashMap<>();

        if (revenues != null) {
            for (RevenueDay r : revenues) {
                if (r.day() != null && !r.day().isBefore(from) && !r.day().isAfter(to)) {
                    long[] vals = dayMap.computeIfAbsent(r.day(), k -> new long[4]);
                    vals[0] += r.revenue();
                    vals[1] += r.orders();
                }
            }
        }
        if (counts != null) {
            for (CountDay c : counts) {
                if (c.day() != null && !c.day().isBefore(from) && !c.day().isAfter(to)) {
                    long[] vals = dayMap.computeIfAbsent(c.day(), k -> new long[4]);
                    vals[2] += c.count();
                }
            }
        }
        if (downloads != null) {
            for (DownloadDay d : downloads) {
                if (d.day() != null && !d.day().isBefore(from) && !d.day().isAfter(to)) {
                    long[] vals = dayMap.computeIfAbsent(d.day(), k -> new long[4]);
                    vals[3] += d.downloads();
                }
            }
        }

        List<DashboardPoint> points = new ArrayList<>();
        if ("MONTH".equalsIgnoreCase(groupBy)) {
            YearMonth startYm = YearMonth.from(from);
            YearMonth endYm = YearMonth.from(to);
            for (YearMonth ym = startYm; !ym.isAfter(endYm); ym = ym.plusMonths(1)) {
                long rev = 0;
                long orders = 0;
                long cust = 0;
                long dl = 0;
                for (Map.Entry<LocalDate, long[]> entry : dayMap.entrySet()) {
                    if (YearMonth.from(entry.getKey()).equals(ym)) {
                        long[] vals = entry.getValue();
                        rev += vals[0];
                        orders += vals[1];
                        cust += vals[2];
                        dl += vals[3];
                    }
                }
                points.add(DashboardPoint.builder()
                        .period(ym.toString())
                        .revenue(rev)
                        .paidOrders(orders)
                        .newCustomers(cust)
                        .downloads(dl)
                        .build());
            }
        } else {
            for (LocalDate cur = from; !cur.isAfter(to); cur = cur.plusDays(1)) {
                long[] vals = dayMap.get(cur);
                long rev = vals != null ? vals[0] : 0L;
                long orders = vals != null ? vals[1] : 0L;
                long cust = vals != null ? vals[2] : 0L;
                long dl = vals != null ? vals[3] : 0L;
                points.add(DashboardPoint.builder()
                        .period(cur.toString())
                        .revenue(rev)
                        .paidOrders(orders)
                        .newCustomers(cust)
                        .downloads(dl)
                        .build());
            }
        }
        return points;
    }
}
