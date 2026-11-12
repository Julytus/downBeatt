package vn.aeoc.business.recommend.eval.tune;

import vn.aeoc.business.recommend.config.RecommendProperties;

import java.util.*;

public class WeightSampler {

    public static List<RecommendProperties.Weights> sample(
            RecommendProperties.Weights defaultWeights,
            int trials,
            SplittableRandom rng
    ) {
        if (trials <= 0) {
            return List.of();
        }

        List<RecommendProperties.Weights> result = new ArrayList<>(trials);

        // Bộ số 0: trọng số mặc định đã chuẩn hoá
        RecommendProperties.Weights w0 = normalize(defaultWeights);
        result.add(w0);

        if (trials == 1) {
            return result;
        }

        while (result.size() < trials) {
            // Rút 5 số khác nhau trong 1..25
            Set<Integer> set = new HashSet<>(5);
            while (set.size() < 5) {
                set.add(rng.nextInt(25) + 1);
            }

            List<Integer> sorted = new ArrayList<>(set);
            Collections.sort(sorted);

            int p1 = sorted.get(0);
            int p2 = sorted.get(1);
            int p3 = sorted.get(2);
            int p4 = sorted.get(3);
            int p5 = sorted.get(4);

            int part0 = p1 - 1;
            int part1 = p2 - p1 - 1;
            int part2 = p3 - p2 - 1;
            int part3 = p4 - p3 - 1;
            int part4 = p5 - p4 - 1;
            int part5 = 25 - p5;

            RecommendProperties.Weights candidate = new RecommendProperties.Weights(
                    part0 / 20.0,
                    part1 / 20.0,
                    part2 / 20.0,
                    part3 / 20.0,
                    part4 / 20.0,
                    part5 / 20.0
            );

            if (!isDuplicate(candidate, result)) {
                result.add(candidate);
            }
        }

        return result;
    }

    private static boolean isDuplicate(RecommendProperties.Weights w, List<RecommendProperties.Weights> existing) {
        for (RecommendProperties.Weights e : existing) {
            if (Math.abs(e.getTag() - w.getTag()) < 1e-9
                    && Math.abs(e.getColor() - w.getColor()) < 1e-9
                    && Math.abs(e.getCategory() - w.getCategory()) < 1e-9
                    && Math.abs(e.getStyle() - w.getStyle()) < 1e-9
                    && Math.abs(e.getText() - w.getText()) < 1e-9
                    && Math.abs(e.getCreator() - w.getCreator()) < 1e-9) {
                return true;
            }
        }
        return false;
    }

    private static RecommendProperties.Weights normalize(RecommendProperties.Weights w) {
        if (w == null) {
            return new RecommendProperties.Weights(0.30, 0.25, 0.15, 0.15, 0.10, 0.05);
        }
        double sum = w.getTag() + w.getColor() + w.getCategory() + w.getStyle() + w.getText() + w.getCreator();
        if (sum <= 0) {
            return new RecommendProperties.Weights(0.30, 0.25, 0.15, 0.15, 0.10, 0.05);
        }
        return new RecommendProperties.Weights(
                w.getTag() / sum,
                w.getColor() / sum,
                w.getCategory() / sum,
                w.getStyle() / sum,
                w.getText() / sum,
                w.getCreator() / sum
        );
    }
}
