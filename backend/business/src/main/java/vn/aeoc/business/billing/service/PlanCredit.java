package vn.aeoc.business.billing.service;

public final class PlanCredit {
    private PlanCredit() {}

    /**
     * Quy đổi số ngày còn lại của gói cũ thành ngày dùng thêm của gói mới:
     * ngày quy đổi = floor(còn lại × giá tháng cũ / giá tháng mới).
     */
    public static int creditDays(long remainingDays, long oldMonthlyPrice, long newMonthlyPrice) {
        if (remainingDays <= 0 || oldMonthlyPrice <= 0 || newMonthlyPrice <= 0) {
            return 0;
        }
        return (int) ((remainingDays * oldMonthlyPrice) / newMonthlyPrice);
    }
}
