package vn.aeoc.business.recommend.eval.stats;

import java.util.List;

public final class SeedStats {

    private SeedStats() {}

    public static Double mean(List<Double> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        double sum = 0.0;
        for (Double v : values) {
            sum += v;
        }
        return sum / values.size();
    }

    /**
     * Độ lệch chuẩn mẫu (chia n - 1). n = 1 -> null.
     */
    public static Double sampleStd(List<Double> values) {
        if (values == null || values.size() <= 1) {
            return null;
        }
        double m = mean(values);
        double sumSq = 0.0;
        for (Double v : values) {
            double diff = v - m;
            sumSq += diff * diff;
        }
        return Math.sqrt(sumSq / (values.size() - 1));
    }
}
