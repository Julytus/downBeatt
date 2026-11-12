package vn.aeoc.business.recommend.eval.stats;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class HolmCorrection {

    private HolmCorrection() {}

    private static class PIndex {
        final int origIndex;
        final double p;

        PIndex(int origIndex, double p) {
            this.origIndex = origIndex;
            this.p = p;
        }
    }

    /**
     * Holm-Bonferroni correction:
     * - sắp p tăng dần (bằng nhau thì giữ thứ tự gốc);
     * - p_holm(i) = max_{j <= i} min(1, (m - j + 1) * p_(j)), với j đếm từ 1;
     * - trả mảng theo thứ tự gốc.
     */
    public static double[] adjust(double[] p) {
        if (p == null) {
            return null;
        }
        int m = p.length;
        if (m == 0) {
            return new double[0];
        }

        List<PIndex> list = new ArrayList<>(m);
        for (int i = 0; i < m; i++) {
            list.add(new PIndex(i, p[i]));
        }

        // Stable sort
        list.sort(Comparator.comparingDouble(it -> it.p));

        double[] adjusted = new double[m];
        double cumMax = 0.0;
        for (int j = 1; j <= m; j++) {
            PIndex item = list.get(j - 1);
            double val = Math.min(1.0, (double) (m - j + 1) * item.p);
            cumMax = Math.max(cumMax, val);
            adjusted[item.origIndex] = Math.min(1.0, cumMax);
        }

        return adjusted;
    }
}
