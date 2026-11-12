package vn.aeoc.business.recommend.eval.stats;

import java.util.Arrays;
import java.util.SplittableRandom;

public final class BootstrapCi {

    private BootstrapCi() {}

    /**
     * Bootstrap confidence interval 95% cho mảng chênh lệch d.
     * n = 0 -> [0, 0].
     */
    public static double[] ci(double[] d, int B, long seed) {
        if (d == null || d.length == 0 || B <= 0) {
            return new double[]{0.0, 0.0};
        }
        int n = d.length;
        SplittableRandom rng = new SplittableRandom(seed);
        double[] means = new double[B];

        for (int b = 0; b < B; b++) {
            double sum = 0.0;
            for (int i = 0; i < n; i++) {
                int idx = rng.nextInt(n);
                sum += d[idx];
            }
            means[b] = sum / (double) n;
        }

        Arrays.sort(means);
        return percentile(means);
    }

    /**
     * Phân vị 2.5% và 97.5% từ mảng means đã sắp xếp tăng dần.
     */
    public static double[] percentile(double[] sortedMeans) {
        if (sortedMeans == null || sortedMeans.length == 0) {
            return new double[]{0.0, 0.0};
        }
        int B = sortedMeans.length;
        int lo = (int) Math.floor(0.025 * B);
        double low = sortedMeans[lo];
        double high = sortedMeans[B - 1 - lo];
        return new double[]{low, high};
    }
}
