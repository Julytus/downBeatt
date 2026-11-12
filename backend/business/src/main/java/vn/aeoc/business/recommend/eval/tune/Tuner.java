package vn.aeoc.business.recommend.eval.tune;

import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.eval.algo.CbfTagAlgorithm;
import vn.aeoc.business.recommend.eval.metric.EvalMetrics;
import vn.aeoc.business.recommend.eval.split.EvalCase;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.profile.ProfileBuilder;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.business.recommend.stats.StatsCalculator;

import java.util.*;

public class Tuner {

    private static final double[] LAMBDA_CANDIDATES = {0.5, 0.6, 0.7, 0.8, 0.9, 1.0};
    private static final double[] HALF_LIFE_CANDIDATES = {7.0, 14.0, 30.0, 60.0, 0.0};
    private static final double[] COLD_START_K_CANDIDATES = {2.0, 5.0, 10.0};

    public static TuningResult tuneM(List<EvalCase> validCases,
                                     LutVectorIndex ix,
                                     ItemSimMatrix simMatrix,
                                     RecommendProperties defaultProps,
                                     SplittableRandom tuneRng,
                                     int tuneTrials) {
        long startTime = System.currentTimeMillis();
        int validUserCount = validCases != null ? validCases.size() : 0;
        if (validUserCount == 0) {
            return emptyResult(defaultProps, 0, 0);
        }

        RecommendProperties.Weights defaultWeights = defaultProps.normalizedWeights();
        int candidateTop = defaultProps.getCandidateTop();

        // Bước 1 — Lấy mẫu và đánh giá trọng số
        List<RecommendProperties.Weights> sampledWeights = WeightSampler.sample(defaultWeights, tuneTrials, tuneRng);
        int actualTrials = sampledWeights.size();

        // Dựng hồ sơ mặc định (halfLife 30, k 5) cho các ca valid
        RecommendProperties step1Props = CbfTagAlgorithm.copyProperties(defaultProps);
        step1Props.setHalfLifeDays(30.0);
        step1Props.setColdStartK(5.0);

        List<UserBlockSims> step1Sims = new ArrayList<>(validUserCount);
        for (EvalCase c : validCases) {
            UserProfile profile = ProfileBuilder.build(ix, c.signals(), c.declaredSlugs(), c.t0(), step1Props);
            step1Sims.add(UserBlockSims.build(c, profile));
        }

        double[] weightNdcgs = new double[actualTrials];
        double validNdcgDefault = 0.0;
        double bestWeightNdcg = -1.0;
        int bestWeightIndex = 0;

        for (int i = 0; i < actualTrials; i++) {
            RecommendProperties.Weights w = sampledWeights.get(i);
            double sumNdcg = 0.0;
            for (UserBlockSims u : step1Sims) {
                List<Integer> ranked = FastCbfRanker.rank(u, simMatrix, w, 0.7, candidateTop, 10);
                sumNdcg += EvalMetrics.ndcg(ranked, u.evalCase().relMap(), 10);
            }
            double avgNdcg = sumNdcg / validUserCount;
            weightNdcgs[i] = avgNdcg;
            if (i == 0) {
                validNdcgDefault = avgNdcg;
                bestWeightNdcg = avgNdcg;
                bestWeightIndex = 0;
            } else if (avgNdcg > bestWeightNdcg + 1e-12) {
                bestWeightNdcg = avgNdcg;
                bestWeightIndex = i;
            }
        }

        double validNdcgWeights = bestWeightNdcg;
        RecommendProperties.Weights chosenWeights = sampledWeights.get(bestWeightIndex);

        // Bảng 5 bộ trọng số tốt nhất + bộ mặc định
        List<TuningResult.WeightReportEntry> allEntries = new ArrayList<>(actualTrials);
        for (int i = 0; i < actualTrials; i++) {
            RecommendProperties.Weights w = sampledWeights.get(i);
            String label = (i == 0) ? "mặc định" : String.valueOf(i);
            allEntries.add(new TuningResult.WeightReportEntry(
                    label, w.getTag(), w.getColor(), w.getCategory(),
                    w.getStyle(), w.getText(), w.getCreator(), weightNdcgs[i]
            ));
        }

        // Sắp xếp tìm top 5
        List<TuningResult.WeightReportEntry> sortedWeights = new ArrayList<>(allEntries);
        sortedWeights.sort((a, b) -> {
            int cmp = Double.compare(b.ndcg(), a.ndcg());
            if (Math.abs(b.ndcg() - a.ndcg()) > 1e-12) return cmp;
            // Bằng nhau thì theo index nhỏ hơn ("mặc định" = 0)
            int idxA = "mặc định".equals(a.label()) ? 0 : Integer.parseInt(a.label());
            int idxB = "mặc định".equals(b.label()) ? 0 : Integer.parseInt(b.label());
            return Integer.compare(idxA, idxB);
        });

        List<TuningResult.WeightReportEntry> top5Weights = sortedWeights.subList(0, Math.min(5, sortedWeights.size()));
        TuningResult.WeightReportEntry defaultEntry = allEntries.get(0);

        // Bước 2 — Chọn λ
        Step2Result step2 = runStep2(validCases, step1Sims, ix, simMatrix, chosenWeights, candidateTop);

        // Bước 3 — Chọn (halfLife, k)
        Step3Result step3 = runStep3(validCases, ix, simMatrix, defaultProps, chosenWeights, step2.chosenLambda, candidateTop);

        long elapsedMs = System.currentTimeMillis() - startTime;

        Map<String, Object> tuningParams = buildTuningParamsMap(
                validUserCount, actualTrials, validNdcgDefault, validNdcgWeights,
                step2.validNdcgLambda, step3.validNdcgFinal, step2.ildBase, elapsedMs
        );

        return TuningResult.builder()
                .weights(chosenWeights)
                .mmrLambda(step2.chosenLambda)
                .halfLifeDays(step3.chosenHalfLife)
                .coldStartK(step3.chosenColdStartK)
                .validUserCount(validUserCount)
                .weightTrials(actualTrials)
                .validNdcgDefault(validNdcgDefault)
                .validNdcgWeights(validNdcgWeights)
                .validNdcgLambda(step2.validNdcgLambda)
                .validNdcgFinal(step3.validNdcgFinal)
                .validIldBase(step2.ildBase)
                .elapsedMs(elapsedMs)
                .tuningParams(tuningParams)
                .topWeights(top5Weights)
                .defaultWeightEntry(defaultEntry)
                .lambdaEntries(step2.lambdaEntries)
                .gridEntries(step3.gridEntries)
                .build();
    }

    public static TuningResult tuneB3(List<EvalCase> validCases,
                                      LutVectorIndex ix,
                                      ItemSimMatrix simMatrix,
                                      RecommendProperties defaultProps) {
        long startTime = System.currentTimeMillis();
        int validUserCount = validCases != null ? validCases.size() : 0;
        if (validUserCount == 0) {
            return emptyResult(defaultProps, 0, 0);
        }

        RecommendProperties.Weights tagOnlyWeights = new RecommendProperties.Weights(1.0, 0.0, 0.0, 0.0, 0.0, 0.0);
        int candidateTop = defaultProps.getCandidateTop();

        // Bước 1 mặc định cho B3
        RecommendProperties step1Props = CbfTagAlgorithm.copyProperties(defaultProps);
        step1Props.setHalfLifeDays(30.0);
        step1Props.setColdStartK(5.0);

        List<UserBlockSims> step1Sims = new ArrayList<>(validUserCount);
        for (EvalCase c : validCases) {
            UserProfile profile = ProfileBuilder.build(ix, c.signals(), c.declaredSlugs(), c.t0(), step1Props);
            step1Sims.add(UserBlockSims.build(c, profile));
        }

        double sumNdcg = 0.0;
        for (UserBlockSims u : step1Sims) {
            List<Integer> ranked = FastCbfRanker.rank(u, simMatrix, tagOnlyWeights, 0.7, candidateTop, 10);
            sumNdcg += EvalMetrics.ndcg(ranked, u.evalCase().relMap(), 10);
        }
        double validNdcgDefault = sumNdcg / validUserCount;
        double validNdcgWeights = validNdcgDefault;

        // Bước 2 — Chọn λ
        Step2Result step2 = runStep2(validCases, step1Sims, ix, simMatrix, tagOnlyWeights, candidateTop);

        // Bước 3 — Chọn (halfLife, k)
        Step3Result step3 = runStep3(validCases, ix, simMatrix, defaultProps, tagOnlyWeights, step2.chosenLambda, candidateTop);

        long elapsedMs = System.currentTimeMillis() - startTime;

        Map<String, Object> tuningParams = buildTuningParamsMap(
                validUserCount, 0, validNdcgDefault, validNdcgWeights,
                step2.validNdcgLambda, step3.validNdcgFinal, step2.ildBase, elapsedMs
        );

        return TuningResult.builder()
                .weights(tagOnlyWeights)
                .mmrLambda(step2.chosenLambda)
                .halfLifeDays(step3.chosenHalfLife)
                .coldStartK(step3.chosenColdStartK)
                .validUserCount(validUserCount)
                .weightTrials(0)
                .validNdcgDefault(validNdcgDefault)
                .validNdcgWeights(validNdcgWeights)
                .validNdcgLambda(step2.validNdcgLambda)
                .validNdcgFinal(step3.validNdcgFinal)
                .validIldBase(step2.ildBase)
                .elapsedMs(elapsedMs)
                .tuningParams(tuningParams)
                .topWeights(List.of())
                .defaultWeightEntry(null)
                .lambdaEntries(step2.lambdaEntries)
                .gridEntries(step3.gridEntries)
                .build();
    }

    private static record Step2Result(
            double chosenLambda,
            double validNdcgLambda,
            double ildBase,
            List<TuningResult.LambdaReportEntry> lambdaEntries
    ) {}

    private static Step2Result runStep2(List<EvalCase> validCases,
                                        List<UserBlockSims> step1Sims,
                                        LutVectorIndex ix,
                                        ItemSimMatrix simMatrix,
                                        RecommendProperties.Weights weights,
                                        int candidateTop) {
        int validUserCount = validCases.size();
        double[] lambdaNdcgs = new double[LAMBDA_CANDIDATES.length];
        double[] lambdaIlds = new double[LAMBDA_CANDIDATES.length];
        double ildBase = 0.0;

        for (int i = 0; i < LAMBDA_CANDIDATES.length; i++) {
            double lam = LAMBDA_CANDIDATES[i];
            double sumNdcg = 0.0;
            double sumIld = 0.0;

            for (UserBlockSims u : step1Sims) {
                List<Integer> ranked = FastCbfRanker.rank(u, simMatrix, weights, lam, candidateTop, 10);
                sumNdcg += EvalMetrics.ndcg(ranked, u.evalCase().relMap(), 10);
                sumIld += EvalMetrics.ild(ranked, ix, 10);
            }

            lambdaNdcgs[i] = sumNdcg / validUserCount;
            lambdaIlds[i] = sumIld / validUserCount;
            if (Math.abs(lam - 0.7) < 1e-9) {
                ildBase = lambdaIlds[i];
            }
        }

        double threshold = 0.95 * ildBase - 1e-12;
        List<TuningResult.LambdaReportEntry> lambdaEntries = new ArrayList<>(LAMBDA_CANDIDATES.length);

        record Candidate(double lambda, double ndcg, double ild, boolean passed) {}
        List<Candidate> qualified = new ArrayList<>();

        for (int i = 0; i < LAMBDA_CANDIDATES.length; i++) {
            double lam = LAMBDA_CANDIDATES[i];
            boolean passed = (lambdaIlds[i] >= threshold);
            lambdaEntries.add(new TuningResult.LambdaReportEntry(lam, lambdaNdcgs[i], lambdaIlds[i], passed));
            if (passed) {
                qualified.add(new Candidate(lam, lambdaNdcgs[i], lambdaIlds[i], true));
            }
        }

        // Quy tắc chọn λ:
        // 1. NDCG cao nhất
        // 2. Bằng nhau: gần 0.7 hơn
        // 3. Vẫn bằng: λ nhỏ hơn
        qualified.sort((a, b) -> {
            if (Math.abs(b.ndcg - a.ndcg) > 1e-12) {
                return Double.compare(b.ndcg, a.ndcg);
            }
            double distA = Math.abs(a.lambda - 0.7);
            double distB = Math.abs(b.lambda - 0.7);
            if (Math.abs(distA - distB) > 1e-12) {
                return Double.compare(distA, distB);
            }
            return Double.compare(a.lambda, b.lambda);
        });

        Candidate best = qualified.get(0);
        return new Step2Result(best.lambda, best.ndcg, ildBase, lambdaEntries);
    }

    private static record Step3Result(
            double chosenHalfLife,
            double chosenColdStartK,
            double validNdcgFinal,
            List<TuningResult.GridReportEntry> gridEntries
    ) {}

    private static Step3Result runStep3(List<EvalCase> validCases,
                                        LutVectorIndex ix,
                                        ItemSimMatrix simMatrix,
                                        RecommendProperties defaultProps,
                                        RecommendProperties.Weights chosenWeights,
                                        double chosenLambda,
                                        int candidateTop) {
        int validUserCount = validCases.size();

        record GridCell(double halfLife, double coldStartK, double ndcg) {}
        List<GridCell> allCells = new ArrayList<>();
        List<TuningResult.GridReportEntry> gridEntries = new ArrayList<>();

        double maxNdcg = -1.0;

        for (double halfLife : HALF_LIFE_CANDIDATES) {
            Map<Integer, Double> ndcgByK = new LinkedHashMap<>();

            for (double coldStartK : COLD_START_K_CANDIDATES) {
                RecommendProperties pCopy = CbfTagAlgorithm.copyProperties(defaultProps);
                pCopy.setHalfLifeDays(halfLife);
                pCopy.setColdStartK(coldStartK);

                double sumNdcg = 0.0;
                for (EvalCase c : validCases) {
                    UserProfile profile = ProfileBuilder.build(ix, c.signals(), c.declaredSlugs(), c.t0(), pCopy);
                    UserBlockSims sims = UserBlockSims.build(c, profile);
                    List<Integer> ranked = FastCbfRanker.rank(sims, simMatrix, chosenWeights, chosenLambda, candidateTop, 10);
                    sumNdcg += EvalMetrics.ndcg(ranked, c.relMap(), 10);
                }
                double avgNdcg = sumNdcg / validUserCount;
                ndcgByK.put((int) coldStartK, avgNdcg);
                allCells.add(new GridCell(halfLife, coldStartK, avgNdcg));
                if (avgNdcg > maxNdcg) {
                    maxNdcg = avgNdcg;
                }
            }

            gridEntries.add(new TuningResult.GridReportEntry(halfLife, ndcgByK));
        }

        // Quy tắc chọn:
        // Lấy nhóm bằng nhau cao nhất (|Δ| < 1e-12).
        // Ưu tiên (30, 5) nếu nằm trong nhóm, ngược lại lấy ô đầu theo thứ tự lưới.
        List<GridCell> topGroup = new ArrayList<>();
        for (GridCell cell : allCells) {
            if (maxNdcg - cell.ndcg < 1e-12) {
                topGroup.add(cell);
            }
        }

        GridCell chosen = null;
        for (GridCell cell : topGroup) {
            if (Math.abs(cell.halfLife - 30.0) < 1e-9 && Math.abs(cell.coldStartK - 5.0) < 1e-9) {
                chosen = cell;
                break;
            }
        }
        if (chosen == null) {
            chosen = topGroup.get(0);
        }

        return new Step3Result(chosen.halfLife, chosen.coldStartK, chosen.ndcg, gridEntries);
    }

    private static Map<String, Object> buildTuningParamsMap(
            int validUserCount, int weightTrials, double validNdcgDefault,
            double validNdcgWeights, double validNdcgLambda, double validNdcgFinal,
            double validIldBase, long elapsedMs
    ) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("validUserCount", validUserCount);
        map.put("weightTrials", weightTrials);
        map.put("validNdcgDefault", StatsCalculator.round4(validNdcgDefault));
        map.put("validNdcgWeights", StatsCalculator.round4(validNdcgWeights));
        map.put("validNdcgLambda", StatsCalculator.round4(validNdcgLambda));
        map.put("validNdcgFinal", StatsCalculator.round4(validNdcgFinal));
        map.put("validIldBase", StatsCalculator.round4(validIldBase));
        map.put("elapsedMs", elapsedMs);
        return map;
    }

    private static TuningResult emptyResult(RecommendProperties defaultProps, int trials, long elapsedMs) {
        RecommendProperties.Weights nw = defaultProps != null ? defaultProps.normalizedWeights()
                : new RecommendProperties.Weights(0.30, 0.25, 0.15, 0.15, 0.10, 0.05);
        double lam = defaultProps != null ? defaultProps.getMmrLambda() : 0.7;
        double hl = defaultProps != null ? defaultProps.getHalfLifeDays() : 30.0;
        double ck = defaultProps != null ? defaultProps.getColdStartK() : 5.0;

        Map<String, Object> tuningParams = buildTuningParamsMap(0, trials, 0.0, 0.0, 0.0, 0.0, 0.0, elapsedMs);

        return TuningResult.builder()
                .weights(nw)
                .mmrLambda(lam)
                .halfLifeDays(hl)
                .coldStartK(ck)
                .validUserCount(0)
                .weightTrials(trials)
                .validNdcgDefault(0.0)
                .validNdcgWeights(0.0)
                .validNdcgLambda(0.0)
                .validNdcgFinal(0.0)
                .validIldBase(0.0)
                .elapsedMs(elapsedMs)
                .tuningParams(tuningParams)
                .topWeights(List.of())
                .defaultWeightEntry(null)
                .lambdaEntries(List.of())
                .gridEntries(List.of())
                .build();
    }
}
