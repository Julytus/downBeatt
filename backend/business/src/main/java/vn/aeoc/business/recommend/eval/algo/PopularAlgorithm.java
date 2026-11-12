package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.ItemVector;

import java.time.LocalDateTime;
import java.util.*;

public class PopularAlgorithm implements EvalAlgorithm {

    @Override
    public String code() {
        return "popular";
    }

    @Override
    public List<Integer> rank(EvalCase c, int k) {
        if (c == null || c.candidates() == null || k <= 0) {
            return List.of();
        }

        Set<Integer> excluded = RandomAlgorithm.getExcludedIds(c.signals());
        List<ItemVector> pool = new ArrayList<>();
        for (ItemVector iv : c.candidates()) {
            if (!excluded.contains(iv.id())) {
                pool.add(iv);
            }
        }

        if (pool.isEmpty()) {
            return List.of();
        }

        Map<Integer, Integer> dlCounts = c.downloadCountsBeforeT0();

        pool.sort((a, b) -> {
            int cntA = dlCounts != null ? dlCounts.getOrDefault(a.id(), 0) : 0;
            int cntB = dlCounts != null ? dlCounts.getOrDefault(b.id(), 0) : 0;
            int cmp = Integer.compare(cntB, cntA);
            if (cmp != 0) return cmp;

            LocalDateTime tA = a.publishedTime() != null ? a.publishedTime() : LocalDateTime.MIN;
            LocalDateTime tB = b.publishedTime() != null ? b.publishedTime() : LocalDateTime.MIN;
            cmp = tB.compareTo(tA);
            if (cmp != 0) return cmp;

            return Integer.compare(a.id(), b.id());
        });

        int take = Math.min(k, pool.size());
        List<Integer> result = new ArrayList<>(take);
        for (int i = 0; i < take; i++) {
            result.add(pool.get(i).id());
        }
        return result;
    }
}
