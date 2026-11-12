package vn.aeoc.business.recommend.eval.stats;

public final class NormalDist {

    private NormalDist() {}

    /**
     * Hai phía: twoSidedP(z) = erfc(|z| / sqrt(2)).
     * Tự cài erfc với sai số tương đối <= 1e-15 trên toàn miền.
     * Kết quả kẹp trong [0, 1], không NaN; dưới ngưỡng double thì trả 0.
     */
    public static double twoSidedP(double z) {
        if (Double.isNaN(z)) {
            return Double.NaN;
        }
        double absZ = Math.abs(z);
        if (absZ == 0.0) {
            return 1.0;
        }
        double x = absZ / Math.sqrt(2.0);
        double p = erfc(x);
        if (Double.isNaN(p) || p < 0.0) {
            return 0.0;
        }
        if (p > 1.0) {
            return 1.0;
        }
        return p;
    }

    /**
     * Chuẩn xác cao erfc(x):
     * - Với x < 3.0: dùng chuỗi khai triển Taylor không triệt tiêu của erf:
     *   erf(x) = (2 / sqrt(pi)) * exp(-x^2) * sum_{n=0}^inf (2^n * x^(2n+1) / (2n+1)!!)
     *   erfc(x) = 1.0 - erf(x)
     * - Với x >= 3.0: dùng phân số liên tục Laplace:
     *   erfc(x) = exp(-x^2) / (sqrt(pi) * (x + 1/2 / (x + 2/2 / (x + 3/2 / ...))))
     */
    public static double erfc(double x) {
        if (x < 0.0) {
            return 2.0 - erfc(-x);
        }
        if (x >= 28.0) {
            return 0.0;
        }
        if (x < 3.0) {
            double sum = x;
            double term = x;
            double x2 = 2.0 * x * x;
            for (int n = 1; n <= 100; n++) {
                term *= x2 / (2 * n + 1);
                sum += term;
                if (term < 1e-18 * sum) {
                    break;
                }
            }
            double erf = (2.0 / Math.sqrt(Math.PI)) * Math.exp(-x * x) * sum;
            return 1.0 - erf;
        } else {
            double f = 0.0;
            for (int m = 60; m >= 1; m--) {
                f = (m / 2.0) / (x + f);
            }
            return Math.exp(-x * x) / (Math.sqrt(Math.PI) * (x + f));
        }
    }
}
