package vn.aeoc.business.recommend.eval.stats;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class WilcoxonSignedRank {

    private WilcoxonSignedRank() {}

    public record Result(int nonZeroCount, double wPlus, double z, double pValue) {}

    private static class DiffItem {
        final double absD;
        final double d;
        double rank;

        DiffItem(double absD, double d) {
            this.absD = absD;
            this.d = d;
        }
    }

    public static Result test(double[] a, double[] b) {
        if (a == null || b == null || a.length != b.length) {
            throw new IllegalArgumentException("Arrays a and b must be non-null and of equal length");
        }

        List<DiffItem> items = new ArrayList<>();
        for (int i = 0; i < a.length; i++) {
            double d = a[i] - b[i];
            double absD = Math.abs(d);
            if (absD >= 1e-12) {
                items.add(new DiffItem(absD, d));
            }
        }

        int n = items.size();
        if (n == 0) {
            return new Result(0, 0.0, 0.0, 1.0);
        }

        items.sort(Comparator.comparingDouble(it -> it.absD));

        int i = 0;
        double sumTieAdjust = 0.0;
        while (i < n) {
            int start = i;
            double groupLeaderAbs = items.get(start).absD;
            while (i < n && Math.abs(items.get(i).absD - groupLeaderAbs) < 1e-12) {
                i++;
            }
            int end = i;
            int t = end - start;
            double avgRank = (start + 1 + end) / 2.0;
            for (int j = start; j < end; j++) {
                items.get(j).rank = avgRank;
            }
            if (t > 1) {
                sumTieAdjust += ((double) t * t * t - (double) t);
            }
        }

        double wPlus = 0.0;
        for (DiffItem it : items) {
            if (it.d > 0) {
                wPlus += it.rank;
            }
        }

        double mu = (double) n * (n + 1) / 4.0;
        double sigma2 = (double) n * (n + 1) * (2 * n + 1) / 24.0 - sumTieAdjust / 48.0;

        if (sigma2 <= 0.0) {
            return new Result(n, wPlus, 0.0, 1.0);
        }

        double sigma = Math.sqrt(sigma2);
        double z = (wPlus - mu) / sigma;
        double p = NormalDist.twoSidedP(z);

        return new Result(n, wPlus, z, p);
    }
}
