package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.rank.RankedItem;
import vn.aeoc.business.recommend.rank.Recommender;

import java.util.*;

public class PopularDdAlgorithm implements EvalAlgorithm {

    private final RecommendProperties props;

    public PopularDdAlgorithm(RecommendProperties props) {
        this.props = props != null ? props : new RecommendProperties();
    }

    @Override
    public String code() {
        return "popular-dd";
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

        List<RankedItem> ranked = Recommender.rankPopular(
                pool,
                c.downloadCounts30DaysBeforeT0(),
                k,
                false,
                this.props
        );

        List<Integer> result = new ArrayList<>(ranked.size());
        for (RankedItem ri : ranked) {
            result.add(ri.id());
        }
        return result;
    }
}
