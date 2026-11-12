package vn.aeoc.business.recommend.eval.metric;

import vn.aeoc.business.recommend.index.LutVectorIndex;

import java.util.*;

public final class EvalMetrics {

    private EvalMetrics() {}

    public static double precision(List<Integer> l, Set<Integer> r, int k) {
        if (k <= 0) return 0.0;
        if (l == null || l.isEmpty() || r == null || r.isEmpty()) return 0.0;
        int size = Math.min(k, l.size());
        int hits = 0;
        for (int i = 0; i < size; i++) {
            if (r.contains(l.get(i))) {
                hits++;
            }
        }
        return (double) hits / (double) k;
    }

    public static double recall(List<Integer> l, Set<Integer> r, int k) {
        if (r == null || r.isEmpty()) return 0.0;
        if (l == null || l.isEmpty() || k <= 0) return 0.0;
        int size = Math.min(k, l.size());
        int hits = 0;
        for (int i = 0; i < size; i++) {
            if (r.contains(l.get(i))) {
                hits++;
            }
        }
        return (double) hits / (double) r.size();
    }

    public static double hitRate(List<Integer> l, Set<Integer> r, int k) {
        if (r == null || r.isEmpty() || l == null || l.isEmpty() || k <= 0) return 0.0;
        int size = Math.min(k, l.size());
        for (int i = 0; i < size; i++) {
            if (r.contains(l.get(i))) {
                return 1.0;
            }
        }
        return 0.0;
    }

    public static double ndcg(List<Integer> l, Map<Integer, Integer> relMap, int k) {
        if (l == null || l.isEmpty() || k <= 0 || relMap == null || relMap.isEmpty()) {
            return 0.0;
        }
        int size = Math.min(k, l.size());
        double dcg = 0.0;
        double log2 = Math.log(2.0);

        for (int i = 0; i < size; i++) {
            int id = l.get(i);
            int rel = relMap.getOrDefault(id, 0);
            if (rel > 0) {
                dcg += (Math.pow(2.0, rel) - 1.0) / (Math.log(i + 2) / log2);
            }
        }

        List<Integer> allRels = relMap.values().stream()
                .filter(r -> r != null && r >= 1)
                .sorted(Comparator.reverseOrder())
                .toList();

        if (allRels.isEmpty()) {
            return 0.0;
        }

        int idcgSize = Math.min(k, allRels.size());
        double idcg = 0.0;
        for (int i = 0; i < idcgSize; i++) {
            int rel = allRels.get(i);
            idcg += (Math.pow(2.0, rel) - 1.0) / (Math.log(i + 2) / log2);
        }

        if (idcg <= 0.0) {
            return 0.0;
        }
        return dcg / idcg;
    }

    public static double ild(List<Integer> l, LutVectorIndex ix, int k) {
        if (l == null || l.isEmpty() || k <= 0 || ix == null) return 0.0;
        int size = Math.min(k, l.size());
        if (size < 2) return 0.0;

        double sumDist = 0.0;
        int pairs = 0;
        double sqrt10 = Math.sqrt(10.0);

        for (int i = 0; i < size; i++) {
            double[] zi = ix.colorZ(l.get(i));
            for (int j = i + 1; j < size; j++) {
                double[] zj = ix.colorZ(l.get(j));
                double distSq = 0.0;
                for (int d = 0; d < 10; d++) {
                    double diff = zi[d] - zj[d];
                    distSq += diff * diff;
                }
                sumDist += Math.sqrt(distSq) / sqrt10;
                pairs++;
            }
        }

        return pairs > 0 ? (sumDist / pairs) : 0.0;
    }

    public static double styles(List<Integer> l, LutVectorIndex ix, int k) {
        if (l == null || l.isEmpty() || k <= 0 || ix == null) return 0.0;
        int size = Math.min(k, l.size());
        Set<String> distinctStyles = new HashSet<>();
        for (int i = 0; i < size; i++) {
            String st = ix.style(l.get(i));
            if (st != null && !st.isBlank()) {
                distinctStyles.add(st.trim());
            }
        }
        return (double) distinctStyles.size();
    }

    public static double coverage(List<List<Integer>> allL, int totalLuts, int k) {
        if (totalLuts <= 0 || allL == null || allL.isEmpty() || k <= 0) return 0.0;
        Set<Integer> union = new HashSet<>();
        for (List<Integer> l : allL) {
            if (l != null) {
                int size = Math.min(k, l.size());
                for (int i = 0; i < size; i++) {
                    union.add(l.get(i));
                }
            }
        }
        return (double) union.size() / (double) totalLuts;
    }

    public static double novelty(List<Integer> l, Map<Integer, Integer> downloadCountsBeforeT0, int n, int k) {
        if (l == null || l.isEmpty() || k <= 0) return 0.0;
        int size = Math.min(k, l.size());
        double sum = 0.0;
        double denom = (double) n + 1.0;
        double log2 = Math.log(2.0);

        for (int i = 0; i < size; i++) {
            int id = l.get(i);
            int count = (downloadCountsBeforeT0 != null) ? downloadCountsBeforeT0.getOrDefault(id, 0) : 0;
            double prob = (count + 1.0) / denom;
            sum += -(Math.log(prob) / log2);
        }
        return sum / (double) k;
    }

    public static double newLutHit(List<Integer> l, Set<Integer> newIds, int k) {
        if (l == null || l.isEmpty() || newIds == null || newIds.isEmpty() || k <= 0) {
            return 0.0;
        }
        int size = Math.min(k, l.size());
        for (int i = 0; i < size; i++) {
            if (newIds.contains(l.get(i))) {
                return 1.0;
            }
        }
        return 0.0;
    }

    public static double newLutRecall(List<Integer> l, Set<Integer> relNew, int k) {
        if (l == null || l.isEmpty() || relNew == null || relNew.isEmpty() || k <= 0) {
            return 0.0;
        }
        int size = Math.min(k, l.size());
        int hits = 0;
        for (int i = 0; i < size; i++) {
            if (relNew.contains(l.get(i))) {
                hits++;
            }
        }
        return (double) hits / (double) relNew.size();
    }
}
