package vn.aeoc.business.recommend.eval.tune;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.rank.RankedItem;
import vn.aeoc.business.recommend.rank.Recommender;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.function.BiFunction;

public final class FastCbfRanker {

    private static final RecommendProperties DUMMY_PROPS = new RecommendProperties();

    private FastCbfRanker() {}

    public static List<Integer> rank(UserBlockSims u,
                                    ItemSimMatrix m,
                                    RecommendProperties.Weights w,
                                    double lambda,
                                    int candidateTop,
                                    int k) {
        if (u == null || k <= 0) {
            return Collections.emptyList();
        }

        if (u.isPopular()) {
            List<RankedItem> popular = Recommender.rankPopular(
                    u.filteredCandidates(),
                    u.recentDownloads(),
                    k,
                    false,
                    DUMMY_PROPS
            );
            List<Integer> ids = new ArrayList<>(popular.size());
            for (RankedItem item : popular) {
                ids.add(item.id());
            }
            return ids;
        }

        int nItems = u.itemCount();
        if (nItems == 0) {
            return Collections.emptyList();
        }

        List<RankedItem> sorted = new ArrayList<>(nItems);
        for (int i = 0; i < nItems; i++) {
            double s = 0.0;
            s += w.getTag() * u.rawSim(i, 0);
            s += w.getColor() * u.rawSim(i, 1);
            s += w.getCategory() * u.rawSim(i, 2);
            s += w.getStyle() * u.rawSim(i, 3);
            s += w.getText() * u.rawSim(i, 4);
            s += w.getCreator() * u.rawSim(i, 5);

            sorted.add(new RankedItem(u.itemId(i), s, null, u.isPremium(i), u.downloadCount(i)));
        }

        sorted.sort((a, b) -> {
            int cmp = Double.compare(b.score(), a.score());
            if (cmp != 0) return cmp;
            cmp = Integer.compare(b.downloadCount(), a.downloadCount());
            if (cmp != 0) return cmp;
            return Integer.compare(a.id(), b.id());
        });

        List<RankedItem> pool = Recommender.selectPool(sorted, candidateTop, k, false);

        BiFunction<Integer, Integer, Double> simFn = (id1, id2) -> m.sim(id1, id2, w);

        List<RankedItem> mmrResult = Recommender.mmr(pool, simFn, k, lambda, Integer.MAX_VALUE);

        List<Integer> result = new ArrayList<>(mmrResult.size());
        for (RankedItem item : mmrResult) {
            result.add(item.id());
        }
        return result;
    }
}
