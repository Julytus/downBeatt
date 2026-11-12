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
import vn.aeoc.business.recommend.eval.tune.ItemSimMatrix;
import vn.aeoc.business.recommend.eval.tune.Tuner;
import vn.aeoc.business.recommend.eval.tune.TuningResult;
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

    public record EvalSeedResult(
            List<RecEvalRun> runs,
            TuningResult tuningM,
            TuningResult tuningB3
    ) {}

    private final RecommendProperties recommendProperties;

    public EvalRunner(RecommendProperties recommendProperties) {
        this.recommendProperties = recommendProperties != null ? recommendProperties : new RecommendProperties();
    }

    public List<RecEvalRun> run(long seed, EvalProperties p, String batchCode) {
        return runWithReport(seed, p, batchCode).runs();
    }

    public EvalSeedResult runWithReport(long seed, EvalProperties p, String batchCode) {
        SplittableRandom rootRng = new SplittableRandom(seed);
        SplittableRandom catalogRng = rootRng.split();

        List<Lut> luts = CatalogGenerator.generate(p.getLuts(), catalogRng);
        LutVectorIndex ix = LutVectorIndex.build(luts, this.recommendProperties);

        SplittableRandom simRng = rootRng.split();
        SimDataset dataset = UserSimulator.simulate(luts, ix, p.getUsers(), seed, simRng);

        SplittableRandom tuneRng = rootRng.split();

        Set<String> chosenAlgos = new HashSet<>();
        for (String a : p.getAlgorithms()) {
            chosenAlgos.add(a.trim());
        }

        boolean needTuneM = p.isTune() && (
                chosenAlgos.contains("cbf-full")
                        || chosenAlgos.contains("m-mau")
                        || chosenAlgos.contains("m-the")
                        || chosenAlgos.contains("m-giam")
                        || chosenAlgos.contains("m-mmr")
                        || chosenAlgos.contains("m-kb")
                        || chosenAlgos.contains("m-tron")
        );
        boolean needTuneB3 = p.isTune() && chosenAlgos.contains("cbf-tag");

        ItemSimMatrix simMatrix = null;
        if (needTuneM || needTuneB3) {
            simMatrix = ItemSimMatrix.build(ix);
        }

        // Tinh chỉnh trên tập kiểm định
        TuningResult tuningM = null;
        TuningResult tuningB3 = null;

        if (needTuneM || needTuneB3) {
            List<EvalCase> validCases = TimeSplitter.split(
                    dataset,
                    ix,
                    "valid",
                    this.recommendProperties.getPopularDays(),
                    p.isExcludeSeen(),
                    p.getNewLutDays()
            );

            if (needTuneM) {
                tuningM = Tuner.tuneM(validCases, ix, simMatrix, this.recommendProperties, tuneRng, p.getTuneTrials());
            }
            if (needTuneB3) {
                tuningB3 = Tuner.tuneB3(validCases, ix, simMatrix, this.recommendProperties);
            }
        }

        LocalDateTime createdTime = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).truncatedTo(ChronoUnit.SECONDS);
        List<RecEvalRun> allRuns = new ArrayList<>();

        // Kịch bản chính (standard)
        if (p.getScenarios().contains("standard")) {
            List<EvalCase> testCases = TimeSplitter.split(
                    dataset,
                    ix,
                    p.getPhase(),
                    this.recommendProperties.getPopularDays(),
                    p.isExcludeSeen(),
                    p.getNewLutDays()
            );

            for (String algoCode : EvalProperties.ALGORITHM_ORDER) {
                if (!chosenAlgos.contains(algoCode)) {
                    continue;
                }
                RecEvalRun run = evaluateAlgorithm(
                        algoCode,
                        "standard",
                        testCases,
                        luts.size(),
                        ix,
                        p,
                        seed,
                        batchCode,
                        createdTime,
                        tuningM,
                        tuningB3,
                        null
                );
                allRuns.add(run);
            }
        }

        // Kịch bản người mới (cold-user)
        if (p.getScenarios().contains("cold-user")) {
            List<String> coldAlgoOrder = List.of("popular", "cbf-tag", "cbf-full", "m-kb");
            List<String> activeColdAlgos = coldAlgoOrder.stream().filter(chosenAlgos::contains).toList();

            if (!activeColdAlgos.isEmpty()) {
                LinkedHashMap<Integer, List<EvalCase>> coldCasesByN = TimeSplitter.coldUser(
                        dataset,
                        ix,
                        p.getColdUserEvents(),
                        this.recommendProperties.getPopularDays(),
                        p.isExcludeSeen(),
                        p.getNewLutDays()
                );

                for (Map.Entry<Integer, List<EvalCase>> entry : coldCasesByN.entrySet()) {
                    int n = entry.getKey();
                    List<EvalCase> casesForN = entry.getValue();
                    String scenario = "cold-user-" + n;

                    for (String algoCode : activeColdAlgos) {
                        RecEvalRun run = evaluateAlgorithm(
                                algoCode,
                                scenario,
                                casesForN,
                                luts.size(),
                                ix,
                                p,
                                seed,
                                batchCode,
                                createdTime,
                                tuningM,
                                tuningB3,
                                n
                        );
                        allRuns.add(run);
                    }
                }
            }
        }

        return new EvalSeedResult(allRuns, tuningM, tuningB3);
    }

    private RecEvalRun evaluateAlgorithm(String algoCode,
                                         String scenario,
                                         List<EvalCase> evalCases,
                                         int totalLuts,
                                         LutVectorIndex ix,
                                         EvalProperties p,
                                         long seed,
                                         String batchCode,
                                         LocalDateTime createdTime,
                                         TuningResult tuningM,
                                         TuningResult tuningB3,
                                         Integer historyEvents) {
        int userCount = evalCases.size();
        int maxK = p.getKValues().stream().max(Integer::compareTo).orElse(20);

        // Đếm số người có ít nhất 1 LUT mới liên quan (R_new != empty)
        int newLutUserCount = 0;
        List<Set<Integer>> relNewList = new ArrayList<>(userCount);
        for (EvalCase c : evalCases) {
            Set<Integer> rNew = new HashSet<>(c.relevantIds());
            rNew.retainAll(c.newLutIds());
            relNewList.add(rNew);
            if (!rNew.isEmpty()) {
                newLutUserCount++;
            }
        }

        long startTime = System.currentTimeMillis();
        Map<String, EvalMetricSet> metricsByK = new LinkedHashMap<>();

        if ("random".equals(algoCode)) {
            int repeats = p.getRandomRepeats();
            RandomAlgorithm randomAlgo = new RandomAlgorithm();

            for (int k : p.getKValues()) {
                double sumP = 0.0, sumR = 0.0, sumNdcg = 0.0, sumHit = 0.0;
                double sumIld = 0.0, sumStyles = 0.0, sumNov = 0.0;
                double sumCov = 0.0, sumNewLutHit = 0.0, sumNewLutRecall = 0.0;

                for (int rep = 0; rep < repeats; rep++) {
                    List<List<Integer>> repAllL = new ArrayList<>(userCount);

                    for (int uIdx = 0; uIdx < userCount; uIdx++) {
                        EvalCase c = evalCases.get(uIdx);
                        Set<Integer> rNew = relNewList.get(uIdx);

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
                        sumNewLutHit += EvalMetrics.newLutHit(sub, c.newLutIds(), k);
                        if (!rNew.isEmpty()) {
                            sumNewLutRecall += EvalMetrics.newLutRecall(sub, rNew, k);
                        }
                    }

                    sumCov += EvalMetrics.coverage(repAllL, totalLuts, k);
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
                double avgNewHit = totalUserEvals > 0 ? (sumNewLutHit / totalUserEvals) : 0.0;
                double totalNewUserEvals = (double) newLutUserCount * (double) repeats;
                double avgNewRecall = totalNewUserEvals > 0 ? (sumNewLutRecall / totalNewUserEvals) : 0.0;

                metricsByK.put(String.valueOf(k), new EvalMetricSet(
                        avgP, avgR, avgNdcg, avgHit, avgIld, avgStyles, avgCov, avgNov, avgNewHit, avgNewRecall
                ));
            }
        } else {
            EvalAlgorithm algo = createAlgorithm(algoCode, ix, tuningM, tuningB3);

            List<List<Integer>> allRanked = new ArrayList<>(userCount);
            for (EvalCase c : evalCases) {
                allRanked.add(algo.rank(c, maxK));
            }

            for (int k : p.getKValues()) {
                double sumP = 0.0, sumR = 0.0, sumNdcg = 0.0, sumHit = 0.0;
                double sumIld = 0.0, sumStyles = 0.0, sumNov = 0.0;
                double sumNewLutHit = 0.0, sumNewLutRecall = 0.0;
                List<List<Integer>> allL = new ArrayList<>(userCount);

                for (int uIdx = 0; uIdx < userCount; uIdx++) {
                    EvalCase c = evalCases.get(uIdx);
                    Set<Integer> rNew = relNewList.get(uIdx);

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
                    sumNewLutHit += EvalMetrics.newLutHit(sub, c.newLutIds(), k);
                    if (!rNew.isEmpty()) {
                        sumNewLutRecall += EvalMetrics.newLutRecall(sub, rNew, k);
                    }
                }

                double avgP = userCount > 0 ? (sumP / userCount) : 0.0;
                double avgR = userCount > 0 ? (sumR / userCount) : 0.0;
                double avgNdcg = userCount > 0 ? (sumNdcg / userCount) : 0.0;
                double avgHit = userCount > 0 ? (sumHit / userCount) : 0.0;
                double avgIld = userCount > 0 ? (sumIld / userCount) : 0.0;
                double avgStyles = userCount > 0 ? (sumStyles / userCount) : 0.0;
                double avgNov = userCount > 0 ? (sumNov / userCount) : 0.0;
                double cov = EvalMetrics.coverage(allL, totalLuts, k);
                double avgNewHit = userCount > 0 ? (sumNewLutHit / userCount) : 0.0;
                double avgNewRecall = newLutUserCount > 0 ? (sumNewLutRecall / newLutUserCount) : 0.0;

                metricsByK.put(String.valueOf(k), new EvalMetricSet(
                        avgP, avgR, avgNdcg, avgHit, avgIld, avgStyles, cov, avgNov, avgNewHit, avgNewRecall
                ));
            }
        }

        long elapsedMs = System.currentTimeMillis() - startTime;

        // Xây dựng params đúng thứ tự §5.1
        Map<String, Object> params = buildParams(
                algoCode,
                scenario,
                p,
                seed,
                userCount,
                newLutUserCount,
                historyEvents,
                elapsedMs,
                tuningM,
                tuningB3
        );

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
            inner.put("newLutHit", StatsCalculator.round4(ms.newLutHit()));
            inner.put("newLutRecall", StatsCalculator.round4(ms.newLutRecall()));
            metricsMap.put(kStr, inner);
        }

        return RecEvalRun.builder()
                .batchCode(batchCode)
                .dataset("D1-sim")
                .algorithm(algoCode)
                .scenario(scenario)
                .params(params)
                .metrics(metricsMap)
                .userCount(userCount)
                .createdTime(createdTime)
                .build();
    }

    private EvalAlgorithm createAlgorithm(String algoCode,
                                          LutVectorIndex ix,
                                          TuningResult tuningM,
                                          TuningResult tuningB3) {
        return switch (algoCode) {
            case "popular" -> new PopularAlgorithm();
            case "popular-dd" -> new PopularDdAlgorithm(this.recommendProperties);
            case "cbf-tag" -> {
                EvalVariants.VariantConfig vc = EvalVariants.props("cbf-tag", tuningM, tuningB3, this.recommendProperties);
                yield new ConfiguredCbfAlgorithm("cbf-tag", ix, vc.props(), vc.useDeclared());
            }
            case "cbf-full" -> {
                EvalVariants.VariantConfig vc = EvalVariants.props("cbf-full", tuningM, tuningB3, this.recommendProperties);
                yield new ConfiguredCbfAlgorithm("cbf-full", ix, vc.props(), vc.useDeclared());
            }
            case "m-mau", "m-the", "m-giam", "m-mmr", "m-kb", "m-tron", "m-mac-dinh" -> {
                EvalVariants.VariantConfig vc = EvalVariants.props(algoCode, tuningM, tuningB3, this.recommendProperties);
                yield new ConfiguredCbfAlgorithm(algoCode, ix, vc.props(), vc.useDeclared());
            }
            default -> throw new IllegalArgumentException("Unknown algorithm: " + algoCode);
        };
    }

    private Map<String, Object> buildParams(String algoCode,
                                            String scenario,
                                            EvalProperties p,
                                            long seed,
                                            int userCount,
                                            int newLutUserCount,
                                            Integer historyEvents,
                                            long elapsedMs,
                                            TuningResult tuningM,
                                            TuningResult tuningB3) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("seed", seed);
        params.put("phase", historyEvents != null ? "cold-user" : p.getPhase());
        params.put("lutCount", p.getLuts());
        params.put("simUserCount", p.getUsers());
        params.put("kValues", new ArrayList<>(p.getKValues()));
        params.put("generatorVersion", 1);
        params.put("catalogStart", "2026-01-01T00:00:00");
        params.put("excludeSeen", p.isExcludeSeen());
        params.put("newLutDays", p.getNewLutDays());
        params.put("newLutUserCount", newLutUserCount);
        if (historyEvents != null) {
            params.put("historyEvents", historyEvents);
        }
        params.put("elapsedMs", elapsedMs);

        switch (algoCode) {
            case "random" -> params.put("repeats", p.getRandomRepeats());
            case "popular" -> params.put("popularWindow", "before-t0");
            case "popular-dd" -> params.put("popularDays", this.recommendProperties.getPopularDays());
            case "cbf-tag" -> {
                EvalVariants.VariantConfig vc = EvalVariants.props("cbf-tag", tuningM, tuningB3, this.recommendProperties);
                fillCbfParams(params, vc, "cbf-tag", scenario, p.isTune(), tuningB3);
            }
            case "cbf-full" -> {
                EvalVariants.VariantConfig vc = EvalVariants.props("cbf-full", tuningM, tuningB3, this.recommendProperties);
                fillCbfParams(params, vc, "cbf-full", scenario, p.isTune(), tuningM);
            }
            case "m-mau", "m-the", "m-giam", "m-mmr", "m-kb", "m-tron", "m-mac-dinh" -> {
                EvalVariants.VariantConfig vc = EvalVariants.props(algoCode, tuningM, tuningB3, this.recommendProperties);
                fillCbfParams(params, vc, algoCode, scenario, p.isTune(), null);
            }
        }

        return params;
    }

    private void fillCbfParams(Map<String, Object> params,
                               EvalVariants.VariantConfig vc,
                               String algoCode,
                               String scenario,
                               boolean tuneEnabled,
                               TuningResult tr) {
        RecommendProperties props = vc.props();
        params.put("weights", buildWeightsMap(props.normalizedWeights()));
        params.put("eventWeights", buildEventWeightsMap(props.getEvent()));
        params.put("halfLifeDays", props.getHalfLifeDays());
        params.put("coldStartK", props.getColdStartK());
        params.put("mmrLambda", props.getMmrLambda());
        params.put("candidateTop", props.getCandidateTop());
        params.put("historyDays", props.getHistoryDays());
        params.put("historyMaxPairs", props.getHistoryMaxPairs());
        params.put("popularDays", props.getPopularDays());
        params.put("useDeclared", vc.useDeclared());

        boolean tuned = tuneEnabled && !"m-mac-dinh".equals(algoCode);
        params.put("tuned", tuned);

        if (tuned && "standard".equals(scenario) && tr != null && ("cbf-tag".equals(algoCode) || "cbf-full".equals(algoCode))) {
            params.put("tuning", tr.getTuningParams());
        }
    }

    private Map<String, Double> buildWeightsMap(RecommendProperties.Weights w) {
        Map<String, Double> map = new LinkedHashMap<>();
        map.put("tag", StatsCalculator.round4(w.getTag()));
        map.put("color", StatsCalculator.round4(w.getColor()));
        map.put("category", StatsCalculator.round4(w.getCategory()));
        map.put("style", StatsCalculator.round4(w.getStyle()));
        map.put("text", StatsCalculator.round4(w.getText()));
        map.put("creator", StatsCalculator.round4(w.getCreator()));
        return map;
    }

    private Map<String, Double> buildEventWeightsMap(RecommendProperties.EventWeights ew) {
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
