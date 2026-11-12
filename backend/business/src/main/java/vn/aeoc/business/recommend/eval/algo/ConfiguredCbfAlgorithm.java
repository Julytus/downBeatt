package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.profile.ProfileBuilder;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.business.recommend.rank.RankedItem;
import vn.aeoc.business.recommend.rank.Recommender;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ConfiguredCbfAlgorithm implements EvalAlgorithm {

    private final String code;
    private final LutVectorIndex ix;
    private final RecommendProperties propsCopy;
    private final boolean useDeclared;

    public ConfiguredCbfAlgorithm(String code, LutVectorIndex ix, RecommendProperties props, boolean useDeclared) {
        this.code = code;
        this.ix = ix;
        this.propsCopy = CbfTagAlgorithm.copyProperties(props);
        this.useDeclared = useDeclared;
    }

    @Override
    public String code() {
        return code;
    }

    @Override
    public List<Integer> rank(EvalCase c, int k) {
        if (c == null || c.candidates() == null || k <= 0) {
            return Collections.emptyList();
        }

        UserProfile profile = ProfileBuilder.build(
                this.ix,
                c.signals(),
                this.useDeclared ? c.declaredSlugs() : List.of(),
                c.t0(),
                this.propsCopy
        );

        List<RankedItem> ranked = Recommender.recommend(
                profile,
                c.candidates(),
                c.downloadCounts30DaysBeforeT0(),
                k,
                false,
                this.propsCopy
        );

        List<Integer> result = new ArrayList<>(ranked.size());
        for (RankedItem ri : ranked) {
            result.add(ri.id());
        }
        return result;
    }
}
