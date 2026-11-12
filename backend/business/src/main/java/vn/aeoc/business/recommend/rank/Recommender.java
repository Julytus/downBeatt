package vn.aeoc.business.recommend.rank;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.profile.ProfileVector;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.time.LocalDateTime;
import java.util.*;
import java.util.function.BiFunction;

public final class Recommender {

    private Recommender() {}

    public static Set<Integer> excludedIds(UserProfile p) {
        if (p == null || p.signals() == null) {
            return Collections.emptySet();
        }
        Set<Integer> set = new HashSet<>();
        for (UserSignal s : p.signals()) {
            if (s.getLutId() != null && s.getType() != null) {
                String t = s.getType().toUpperCase();
                if ("DOWNLOAD".equals(t) || "DISMISS".equals(t)) {
                    set.add(s.getLutId());
                }
            }
        }
        return set;
    }

    public static int premiumQuota(int k, double ratio) {
        return (int) Math.floor(k * ratio + 1e-9);
    }

    public static List<RankedItem> selectPool(List<RankedItem> sortedItems, int candidateTop, int k, boolean premiumLimited) {
        if (sortedItems == null || sortedItems.isEmpty()) {
            return Collections.emptyList();
        }
        int topLimit = Math.min(candidateTop, sortedItems.size());
        List<RankedItem> pool = new ArrayList<>(sortedItems.subList(0, topLimit));
        if (premiumLimited) {
            long freeCount = pool.stream().filter(item -> !item.premium()).count();
            if (freeCount < k) {
                for (int i = topLimit; i < sortedItems.size(); i++) {
                    RankedItem item = sortedItems.get(i);
                    if (!item.premium()) {
                        pool.add(item);
                        freeCount++;
                        if (freeCount >= k) {
                            break;
                        }
                    }
                }
            }
        }
        return pool;
    }

    public static List<RankedItem> mmr(List<RankedItem> pool, BiFunction<Integer, Integer, Double> simFn, int k, double lambda, int quota) {
        if (pool == null || pool.isEmpty() || k <= 0) {
            return Collections.emptyList();
        }
        List<RankedItem> S = new ArrayList<>(Math.min(k, pool.size()));
        Set<Integer> selectedIds = new HashSet<>();
        int premiumCount = 0;

        while (S.size() < k) {
            RankedItem bestCandidate = null;
            double bestMmr = Double.NEGATIVE_INFINITY;

            for (RankedItem item : pool) {
                if (selectedIds.contains(item.id())) {
                    continue;
                }
                if (item.premium() && premiumCount >= quota) {
                    continue;
                }

                double mmrScore;
                if (S.isEmpty()) {
                    mmrScore = lambda * item.score();
                } else {
                    double maxSim = 0.0;
                    for (RankedItem selected : S) {
                        double sim = simFn != null ? simFn.apply(item.id(), selected.id()) : 0.0;
                        if (sim > maxSim) {
                            maxSim = sim;
                        }
                    }
                    mmrScore = lambda * item.score() - (1.0 - lambda) * maxSim;
                }

                if (bestCandidate == null) {
                    bestCandidate = item;
                    bestMmr = mmrScore;
                } else {
                    double diff = mmrScore - bestMmr;
                    if (Math.abs(diff) < 1e-12) {
                        if (item.downloadCount() > bestCandidate.downloadCount()) {
                            bestCandidate = item;
                            bestMmr = mmrScore;
                        } else if (item.downloadCount() == bestCandidate.downloadCount() && item.id() < bestCandidate.id()) {
                            bestCandidate = item;
                            bestMmr = mmrScore;
                        }
                    } else if (diff > 0) {
                        bestCandidate = item;
                        bestMmr = mmrScore;
                    }
                }
            }

            if (bestCandidate == null) {
                break;
            }

            S.add(bestCandidate);
            selectedIds.add(bestCandidate.id());
            if (bestCandidate.premium()) {
                premiumCount++;
            }
        }
        return S;
    }

    public static List<RankedItem> rankByProfile(ProfileVector p, List<ItemVector> candidates, int k, boolean premiumLimited, RecommendProperties props) {
        if (candidates == null || candidates.isEmpty() || k <= 0) {
            return Collections.emptyList();
        }
        if (props == null) {
            props = new RecommendProperties();
        }

        RecommendProperties.Weights w = props.normalizedWeights();
        List<RankedItem> sorted = new ArrayList<>(candidates.size());
        Map<Integer, ItemVector> itemMap = new HashMap<>(candidates.size());

        for (ItemVector item : candidates) {
            itemMap.put(item.id(), item);
            Map<String, Double> cont = ScoreCalculator.contributions(p, item, w);
            double s = 0.0;
            for (double v : cont.values()) {
                s += v;
            }
            sorted.add(new RankedItem(item.id(), s, cont, item.premium(), item.downloadCount()));
        }

        sorted.sort((a, b) -> {
            int cmp = Double.compare(b.score(), a.score());
            if (cmp != 0) return cmp;
            cmp = Integer.compare(b.downloadCount(), a.downloadCount());
            if (cmp != 0) return cmp;
            return Integer.compare(a.id(), b.id());
        });

        List<RankedItem> pool = selectPool(sorted, props.getCandidateTop(), k, premiumLimited);
        int quota = premiumLimited ? premiumQuota(k, props.getPremiumMaxRatio()) : Integer.MAX_VALUE;
        BiFunction<Integer, Integer, Double> simFn = (id1, id2) ->
                ScoreCalculator.itemSim(itemMap.get(id1), itemMap.get(id2), w);

        return mmr(pool, simFn, k, props.getMmrLambda(), quota);
    }

    public static List<RankedItem> rankPopular(List<ItemVector> candidates, Map<Integer, Integer> recentDownloads, int k, boolean premiumLimited, RecommendProperties props) {
        if (candidates == null || candidates.isEmpty() || k <= 0) {
            return Collections.emptyList();
        }
        if (props == null) {
            props = new RecommendProperties();
        }

        Comparator<ItemVector> popComp = (a, b) -> {
            int recA = recentDownloads != null ? recentDownloads.getOrDefault(a.id(), 0) : 0;
            int recB = recentDownloads != null ? recentDownloads.getOrDefault(b.id(), 0) : 0;
            int cmp = Integer.compare(recB, recA);
            if (cmp != 0) return cmp;
            cmp = Integer.compare(b.downloadCount(), a.downloadCount());
            if (cmp != 0) return cmp;
            LocalDateTime tA = a.publishedTime() != null ? a.publishedTime() : LocalDateTime.MIN;
            LocalDateTime tB = b.publishedTime() != null ? b.publishedTime() : LocalDateTime.MIN;
            cmp = tB.compareTo(tA);
            if (cmp != 0) return cmp;
            return Integer.compare(a.id(), b.id());
        };

        Map<String, List<ItemVector>> groupsByStyle = new HashMap<>();
        for (ItemVector iv : candidates) {
            String st = iv.style() != null ? iv.style().trim() : "";
            groupsByStyle.computeIfAbsent(st, s -> new ArrayList<>()).add(iv);
        }
        for (List<ItemVector> group : groupsByStyle.values()) {
            group.sort(popComp);
        }
        List<List<ItemVector>> sortedGroups = new ArrayList<>(groupsByStyle.values());
        sortedGroups.sort((g1, g2) -> popComp.compare(g1.get(0), g2.get(0)));

        List<ItemVector> interleaved = new ArrayList<>(candidates.size());
        int maxGroupSize = 0;
        for (List<ItemVector> g : sortedGroups) {
            if (g.size() > maxGroupSize) {
                maxGroupSize = g.size();
            }
        }
        for (int round = 0; round < maxGroupSize; round++) {
            for (List<ItemVector> g : sortedGroups) {
                if (round < g.size()) {
                    interleaved.add(g.get(round));
                }
            }
        }

        int quota = premiumLimited ? premiumQuota(k, props.getPremiumMaxRatio()) : Integer.MAX_VALUE;
        List<RankedItem> result = new ArrayList<>(Math.min(k, interleaved.size()));
        int premiumCount = 0;
        for (ItemVector iv : interleaved) {
            if (iv.premium() && premiumCount >= quota) {
                continue;
            }
            result.add(new RankedItem(iv.id(), 0.0, null, iv.premium(), iv.downloadCount()));
            if (iv.premium()) {
                premiumCount++;
            }
            if (result.size() >= k) {
                break;
            }
        }
        return result;
    }

    public static List<RankedItem> recommend(UserProfile profile, List<ItemVector> all, Map<Integer, Integer> recentDownloads, int k, boolean premiumLimited, RecommendProperties props) {
        if (all == null || all.isEmpty() || k <= 0) {
            return Collections.emptyList();
        }
        Set<Integer> excluded = excludedIds(profile);
        List<ItemVector> candidates = all.stream().filter(iv -> !excluded.contains(iv.id())).toList();
        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        if (profile == null || "POPULAR".equalsIgnoreCase(profile.strategy())) {
            return rankPopular(candidates, recentDownloads, k, premiumLimited, props);
        } else {
            return rankByProfile(profile.mixed(), candidates, k, premiumLimited, props);
        }
    }
}
