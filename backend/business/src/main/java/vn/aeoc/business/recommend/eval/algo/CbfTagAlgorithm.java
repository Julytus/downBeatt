package vn.aeoc.business.recommend.eval.algo;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.profile.ProfileBuilder;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.business.recommend.rank.RankedItem;
import vn.aeoc.business.recommend.rank.Recommender;

import java.util.ArrayList;
import java.util.List;

public class CbfTagAlgorithm implements EvalAlgorithm {

    private final LutVectorIndex ix;
    private final RecommendProperties propsCopy;

    public CbfTagAlgorithm(LutVectorIndex ix, RecommendProperties props) {
        this.ix = ix;
        this.propsCopy = copyProperties(props);
        this.propsCopy.setWeights(new RecommendProperties.Weights(1.0, 0.0, 0.0, 0.0, 0.0, 0.0));
    }

    @Override
    public String code() {
        return "cbf-tag";
    }

    @Override
    public List<Integer> rank(EvalCase c, int k) {
        if (c == null || c.candidates() == null || k <= 0) {
            return List.of();
        }

        UserProfile profile = ProfileBuilder.build(
                this.ix,
                c.signals(),
                c.declaredSlugs(),
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

    public static RecommendProperties copyProperties(RecommendProperties src) {
        RecommendProperties dest = new RecommendProperties();
        if (src == null) return dest;

        if (src.getWeights() != null) {
            dest.setWeights(new RecommendProperties.Weights(
                    src.getWeights().getTag(),
                    src.getWeights().getColor(),
                    src.getWeights().getCategory(),
                    src.getWeights().getStyle(),
                    src.getWeights().getText(),
                    src.getWeights().getCreator()
            ));
        }
        dest.setSimilarityTop(src.getSimilarityTop());
        dest.setBuildOnStartup(src.isBuildOnStartup());
        dest.setRebuildCron(src.getRebuildCron());
        if (src.getTagSynonyms() != null) {
            List<List<String>> synCopy = new ArrayList<>();
            for (List<String> list : src.getTagSynonyms()) {
                synCopy.add(new ArrayList<>(list));
            }
            dest.setTagSynonyms(synCopy);
        }
        if (src.getTextStopwords() != null) {
            dest.setTextStopwords(new ArrayList<>(src.getTextStopwords()));
        }
        if (src.getEvent() != null) {
            dest.setEvent(new RecommendProperties.EventWeights(
                    src.getEvent().getView(),
                    src.getEvent().getPreview(),
                    src.getEvent().getSearch(),
                    src.getEvent().getFilterStyle(),
                    src.getEvent().getFavorite(),
                    src.getEvent().getDownload(),
                    src.getEvent().getPurchase(),
                    src.getEvent().getDismiss()
            ));
        }
        dest.setHalfLifeDays(src.getHalfLifeDays());
        dest.setHistoryDays(src.getHistoryDays());
        dest.setHistoryMaxPairs(src.getHistoryMaxPairs());
        dest.setColdStartK(src.getColdStartK());
        dest.setEventDedupMinutes(src.getEventDedupMinutes());
        dest.setProfileCacheMinutes(src.getProfileCacheMinutes());
        dest.setPreferenceMax(src.getPreferenceMax());
        dest.setEventCleanupCron(src.getEventCleanupCron());
        dest.setMmrLambda(src.getMmrLambda());
        dest.setCandidateTop(src.getCandidateTop());
        dest.setPremiumMaxRatio(src.getPremiumMaxRatio());
        dest.setRelatedPersonalRatio(src.getRelatedPersonalRatio());
        dest.setPopularDays(src.getPopularDays());
        dest.setForYouLimit(src.getForYouLimit());
        dest.setForYouMaxLimit(src.getForYouMaxLimit());
        dest.setVariant(src.getVariant());
        dest.setStatsDownloadWindowMinutes(src.getStatsDownloadWindowMinutes());
        dest.setStatsMaxDays(src.getStatsMaxDays());
        return dest;
    }
}
