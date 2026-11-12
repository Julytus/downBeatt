package vn.aeoc.business.dashboard.calc;

import java.time.LocalDate;

public record RevenueDay(LocalDate day, long revenue, long orders) {
}
