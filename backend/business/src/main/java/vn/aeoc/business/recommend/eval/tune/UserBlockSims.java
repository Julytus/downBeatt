package vn.aeoc.business.recommend.eval.tune;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.profile.ProfileVector;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.business.recommend.rank.Recommender;
import vn.aeoc.business.recommend.rank.ScoreCalculator;

import java.util.*;

public class UserBlockSims {

    private static final RecommendProperties.Weights ONES =
            new RecommendProperties.Weights(1.0, 1.0, 1.0, 1.0, 1.0, 1.0);

    private final EvalCase evalCase;
    private final boolean isPopular;
    private final List<ItemVector> filteredCandidates;
    private final Map<Integer, Integer> recentDownloads;
    private final int[] itemIds;
    private final int[] downloadCounts;
    private final boolean[] premiums;
    private final double[] rawSims;

    public UserBlockSims(EvalCase evalCase,
                         boolean isPopular,
                         List<ItemVector> filteredCandidates,
                         Map<Integer, Integer> recentDownloads,
                         int[] itemIds,
                         int[] downloadCounts,
                         boolean[] premiums,
                         double[] rawSims) {
        this.evalCase = evalCase;
        this.isPopular = isPopular;
        this.filteredCandidates = filteredCandidates;
        this.recentDownloads = recentDownloads;
        this.itemIds = itemIds;
        this.downloadCounts = downloadCounts;
        this.premiums = premiums;
        this.rawSims = rawSims;
    }

    public static UserBlockSims build(EvalCase c, UserProfile profile) {
        Set<Integer> excluded = Recommender.excludedIds(profile);
        List<ItemVector> filtered = new ArrayList<>();
        if (c.candidates() != null) {
            for (ItemVector iv : c.candidates()) {
                if (!excluded.contains(iv.id())) {
                    filtered.add(iv);
                }
            }
        }

        Map<Integer, Integer> recentDownloads = c.downloadCounts30DaysBeforeT0() != null
                ? c.downloadCounts30DaysBeforeT0()
                : Map.of();

        boolean isPopular = (profile == null || "POPULAR".equalsIgnoreCase(profile.strategy()));
        int nItems = filtered.size();

        if (isPopular || nItems == 0) {
            return new UserBlockSims(c, isPopular, filtered, recentDownloads,
                    new int[0], new int[0], new boolean[0], new double[0]);
        }

        ProfileVector p = profile.mixed();
        int[] itemIds = new int[nItems];
        int[] downloadCounts = new int[nItems];
        boolean[] premiums = new boolean[nItems];
        double[] rawSims = new double[nItems * 6];

        for (int i = 0; i < nItems; i++) {
            ItemVector item = filtered.get(i);
            itemIds[i] = item.id();
            downloadCounts[i] = item.downloadCount();
            premiums[i] = item.premium();

            Map<String, Double> cont = ScoreCalculator.contributions(p, item, ONES);
            int base = i * 6;
            rawSims[base] = cont.getOrDefault("tag", 0.0);
            rawSims[base + 1] = cont.getOrDefault("color", 0.0);
            rawSims[base + 2] = cont.getOrDefault("category", 0.0);
            rawSims[base + 3] = cont.getOrDefault("style", 0.0);
            rawSims[base + 4] = cont.getOrDefault("text", 0.0);
            rawSims[base + 5] = cont.getOrDefault("creator", 0.0);
        }

        return new UserBlockSims(c, false, filtered, recentDownloads,
                itemIds, downloadCounts, premiums, rawSims);
    }

    public EvalCase evalCase() {
        return evalCase;
    }

    public boolean isPopular() {
        return isPopular;
    }

    public List<ItemVector> filteredCandidates() {
        return filteredCandidates;
    }

    public Map<Integer, Integer> recentDownloads() {
        return recentDownloads;
    }

    public int itemCount() {
        return itemIds.length;
    }

    public int itemId(int index) {
        return itemIds[index];
    }

    public int downloadCount(int index) {
        return downloadCounts[index];
    }

    public boolean isPremium(int index) {
        return premiums[index];
    }

    public double rawSim(int itemIndex, int blockIndex) {
        return rawSims[itemIndex * 6 + blockIndex];
    }
}
