package vn.aeoc.business.recommend.eval;

import org.springframework.stereotype.Service;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.algo.*;
import vn.aeoc.business.recommend.eval.metric.EvalMetricSet;
import vn.aeoc.business.recommend.eval.metric.EvalMetrics;
import vn.aeoc.business.recommend.eval.sim.CatalogGenerator;
import vn.aeoc.business.recommend.eval.sim.SimDataset;
import vn.aeoc.business.recommend.eval.sim.UserSimulator;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.eval.split.TimeSplitter;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.stats.StatsCalculator;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class EvalRunner {

    private final RecommendProperties recommendProperties;

    public EvalRunner(RecommendProperties recommendProperties) {
        this.recommendProperties = recommendProperties != null ? recommendProperties : new RecommendProperties();
    }

    public List<RecEvalRun> run(long seed, EvalProperties p, String batchCode) {
        SplittableRandom rootRng = new SplittableRandom(seed);
        SplittableRandom catalogRng = rootRng.split();

        List<Lut> luts = CatalogGenerator.generate(p.getLuts(), catalogRng);
        LutVectorIndex ix = LutVectorIndex.build(luts, this.recommendProperties);

        SplittableRandom simRng = rootRng.split();
        SimDataset dataset = UserSimulator.simulate(luts, ix, p.getUsers(), seed, simRng);

        List<EvalCase> evalCases = TimeSplitter.split(
                dataset,
                ix,
                p.getPhase(),
                this.recommendProperties.getPopularDays()
        );

        int userCount = evalCases.size();
        int maxK = p.getKValues().stream().max(Integer::compareTo).orElse(20);

        List<String> order = List.of("random", "popular", "popular-dd", "cbf-tag", "cbf-full");
        Set<String> chosenAlgos = new HashSet<>();
        for (String a : p.getAlgorithms()) {
            chosenAlgos.add(a.trim());
        }

        List<RecEvalRun> results = new ArrayList<>();
        LocalDateTime createdTime = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).truncatedTo(ChronoUnit.SECONDS);

        for (String algoCode : order) {
            if (!chosenAlgos.contains(algoCode)) {
                continue;
            }

            long startTime = System.currentTimeMillis();
            Map<String, EvalMetricSet> metricsByK = new LinkedHashMap<>();

            if ("random".equals(algoCode)) {
                int repeats = p.getRandomRepeats();
                RandomAlgorithm randomAlgo = new RandomAlgorithm();

                for (int k : p.getKValues()) {
                    double sumP = 0.0, sumR = 0.0, sumNdcg = 0.0, sumHit = 0.0;
                    double sumIld = 0.0, sumStyles = 0.0, sumNov = 0.0;
                    double sumCov = 0.0;

                    for (int rep = 0; rep < repeats; rep++) {
                        List<List<Integer>> repAllL = new ArrayList<>(userCount);

                        for (EvalCase c : evalCases) {
                            List<Integer> ranked = randomAlgo.rank(c, maxK, rep, seed);
                            List<Integer> sub = ranked.subList(0, Math.min(k, ranked.size()));
                            repAllL.add(sub);

                            sumP += EvalMetrics.precision(sub, c.relevantIds(), k);
                            sumR += EvalMetrics.recall(sub, c.relevantIds(), k);
                            sumNdcg += EvalMetrics.ndcg(sub, c.relMap(), k);
                            sumHit += EvalMetrics.hitRate(sub, c.relevantIds(), k);
                            sumIld += EvalMetrics.ild(sub, ix, k);
                            sumStyles += EvalMetrics.styles(sub, ix, k);
                            sumNov += EvalMetrics.novelty(sub, c.downloadCountsBeforeT0(), p.getUsers(), k);
                        }

                        sumCov += EvalMetrics.coverage(repAllL, luts.size(), k);
                    }

                    double totalUserEvals = (double) userCount * (double) repeats;
                    double avgP = totalUserEvals > 0 ? (sumP / totalUserEvals) : 0.0;
                    double avgR = totalUserEvals > 0 ? (sumR / totalUserEvals) : 0.0;
                    double avgNdcg = totalUserEvals > 0 ? (sumNdcg / totalUserEvals) : 0.0;
                    double avgHit = totalUserEvals > 0 ? (sumHit / totalUserEvals) : 0.0;
                    double avgIld = totalUserEvals > 0 ? (sumIld / totalUserEvals) : 0.0;
                    double avgStyles = totalUserEvals > 0 ? (sumStyles / totalUserEvals) : 0.0;
                    double avgNov = totalUserEvals > 0 ? (sumNov / totalUserEvals) : 0.0;
                    double avgCov = repeats > 0 ? (sumCov / repeats) : 0.0;

                    metricsByK.put(String.valueOf(k), new EvalMetricSet(
                            avgP, avgR, avgNdcg, avgHit, avgIld, avgStyles, avgCov, avgNov
                    ));
                }
            } else {
                EvalAlgorithm algo = switch (algoCode) {
                    case "popular" -> new PopularAlgorithm();
                    case "popular-dd" -> new PopularDdAlgorithm(this.recommendProperties);
                    case "cbf-tag" -> new CbfTagAlgorithm(ix, this.recommendProperties);
                    case "cbf-full" -> new CbfFullAlgorithm(ix, this.recommendProperties);
                    default -> throw new IllegalArgumentException("Unknown algorithm: " + algoCode);
                };

                List<List<Integer>> allRanked = new ArrayList<>(userCount);
                for (EvalCase c : evalCases) {
                    allRanked.add(algo.rank(c, maxK));
                }

                for (int k : p.getKValues()) {
                    double sumP = 0.0, sumR = 0.0, sumNdcg = 0.0, sumHit = 0.0;
                    double sumIld = 0.0, sumStyles = 0.0, sumNov = 0.0;
                    List<List<Integer>> allL = new ArrayList<>(userCount);

                    for (int uIdx = 0; uIdx < userCount; uIdx++) {
                        EvalCase c = evalCases.get(uIdx);
                        List<Integer> ranked = allRanked.get(uIdx);
                        List<Integer> sub = ranked.subList(0, Math.min(k, ranked.size()));
                        allL.add(sub);

                        sumP += EvalMetrics.precision(sub, c.relevantIds(), k);
                        sumR += EvalMetrics.recall(sub, c.relevantIds(), k);
                        sumNdcg += EvalMetrics.ndcg(sub, c.relMap(), k);
                        sumHit += EvalMetrics.hitRate(sub, c.relevantIds(), k);
                        sumIld += EvalMetrics.ild(sub, ix, k);
                        sumStyles += EvalMetrics.styles(sub, ix, k);
                        sumNov += EvalMetrics.novelty(sub, c.downloadCountsBeforeT0(), p.getUsers(), k);
                    }

                    double avgP = userCount > 0 ? (sumP / userCount) : 0.0;
                    double avgR = userCount > 0 ? (sumR / userCount) : 0.0;
                    double avgNdcg = userCount > 0 ? (sumNdcg / userCount) : 0.0;
                    double avgHit = userCount > 0 ? (sumHit / userCount) : 0.0;
                    double avgIld = userCount > 0 ? (sumIld / userCount) : 0.0;
                    double avgStyles = userCount > 0 ? (sumStyles / userCount) : 0.0;
                    double avgNov = userCount > 0 ? (sumNov / userCount) : 0.0;
                    double cov = EvalMetrics.coverage(allL, luts.size(), k);

                    metricsByK.put(String.valueOf(k), new EvalMetricSet(
                            avgP, avgR, avgNdcg, avgHit, avgIld, avgStyles, cov, avgNov
                    ));
                }
            }

            long elapsedMs = System.currentTimeMillis() - startTime;

            // Xây dựng params đúng thứ tự §5.1
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("seed", seed);
            params.put("phase", p.getPhase());
            params.put("lutCount", p.getLuts());
            params.put("simUserCount", p.getUsers());
            params.put("kValues", new ArrayList<>(p.getKValues()));
            params.put("generatorVersion", 1);
            params.put("catalogStart", "2026-01-01T00:00:00");
            params.put("elapsedMs", elapsedMs);

            switch (algoCode) {
                case "random" -> params.put("repeats", p.getRandomRepeats());
                case "popular" -> params.put("popularWindow", "before-t0");
                case "popular-dd" -> params.put("popularDays", this.recommendProperties.getPopularDays());
                case "cbf-tag" -> {
                    params.put("weights", buildTagWeights());
                    params.put("eventWeights", buildEventWeights());
                    params.put("halfLifeDays", this.recommendProperties.getHalfLifeDays());
                    params.put("coldStartK", this.recommendProperties.getColdStartK());
                    params.put("mmrLambda", this.recommendProperties.getMmrLambda());
                    params.put("candidateTop", this.recommendProperties.getCandidateTop());
                    params.put("historyDays", this.recommendProperties.getHistoryDays());
                    params.put("historyMaxPairs", this.recommendProperties.getHistoryMaxPairs());
                    params.put("popularDays", this.recommendProperties.getPopularDays());
                }
                case "cbf-full" -> {
                    params.put("weights", buildNormalizedWeights());
                    params.put("eventWeights", buildEventWeights());
                    params.put("halfLifeDays", this.recommendProperties.getHalfLifeDays());
                    params.put("coldStartK", this.recommendProperties.getColdStartK());
                    params.put("mmrLambda", this.recommendProperties.getMmrLambda());
                    params.put("candidateTop", this.recommendProperties.getCandidateTop());
                    params.put("historyDays", this.recommendProperties.getHistoryDays());
                    params.put("historyMaxPairs", this.recommendProperties.getHistoryMaxPairs());
                    params.put("popularDays", this.recommendProperties.getPopularDays());
                }
            }

            // Xây dựng metrics theo từng K làm tròn 4 chữ số
            Map<String, Map<String, Double>> metricsMap = new LinkedHashMap<>();
            for (Map.Entry<String, EvalMetricSet> me : metricsByK.entrySet()) {
                String kStr = me.getKey();
                EvalMetricSet ms = me.getValue();
                Map<String, Double> inner = new LinkedHashMap<>();
                inner.put("precision", StatsCalculator.round4(ms.precision()));
                inner.put("recall", StatsCalculator.round4(ms.recall()));
                inner.put("ndcg", StatsCalculator.round4(ms.ndcg()));
                inner.put("hitRate", StatsCalculator.round4(ms.hitRate()));
                inner.put("ild", StatsCalculator.round4(ms.ild()));
                inner.put("styles", StatsCalculator.round4(ms.styles()));
                inner.put("coverage", StatsCalculator.round4(ms.coverage()));
                inner.put("novelty", StatsCalculator.round4(ms.novelty()));
                metricsMap.put(kStr, inner);
            }

            RecEvalRun run = RecEvalRun.builder()
                    .batchCode(batchCode)
                    .dataset("D1-sim")
                    .algorithm(algoCode)
                    .params(params)
                    .metrics(metricsMap)
                    .userCount(userCount)
                    .createdTime(createdTime)
                    .build();

            results.add(run);
        }

        return results;
    }

    private Map<String, Double> buildTagWeights() {
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("tag", 1.0);
        map.put("color", 0.0);
        map.put("category", 0.0);
        map.put("style", 0.0);
        map.put("text", 0.0);
        map.put("creator", 0.0);
        return map;
    }

    private Map<String, Double> buildNormalizedWeights() {
        RecommendProperties.Weights nw = recommendProperties.normalizedWeights();
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("tag", StatsCalculator.round4(nw.getTag()));
        map.put("color", StatsCalculator.round4(nw.getColor()));
        map.put("category", StatsCalculator.round4(nw.getCategory()));
        map.put("style", StatsCalculator.round4(nw.getStyle()));
        map.put("text", StatsCalculator.round4(nw.getText()));
        map.put("creator", StatsCalculator.round4(nw.getCreator()));
        return map;
    }

    private Map<String, Double> buildEventWeights() {
        RecommendProperties.EventWeights ew = recommendProperties.getEvent();
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("VIEW", ew != null ? ew.getView() : 1.0);
        map.put("PREVIEW", ew != null ? ew.getPreview() : 2.0);
        map.put("SEARCH", ew != null ? ew.getSearch() : 0.5);
        map.put("FILTER_STYLE", ew != null ? ew.getFilterStyle() : 0.5);
        map.put("FAVORITE", ew != null ? ew.getFavorite() : 4.0);
        map.put("DOWNLOAD", ew != null ? ew.getDownload() : 5.0);
        map.put("PURCHASE", ew != null ? ew.getPurchase() : 6.0);
        map.put("DISMISS", ew != null ? ew.getDismiss() : -4.0);
        return map;
    }
}
