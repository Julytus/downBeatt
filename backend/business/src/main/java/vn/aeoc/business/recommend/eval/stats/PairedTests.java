package vn.aeoc.business.recommend.eval.stats;

import vn.aeoc.business.recommend.eval.EvalProperties;
import vn.aeoc.entity.data.mysql.recommend.RecEvalTest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

public final class PairedTests {

    public static final List<String> COMPARISON_ORDER = List.of(
            "popular", "cbf-tag", "m-mau", "m-the", "m-giam", "m-mmr", "m-kb", "m-tron", "m-mac-dinh"
    );

    private PairedTests() {}

    public static List<RecEvalTest> build(List<SeedPerUser> seeds,
                                          EvalProperties p,
                                          String batchCode,
                                          LocalDateTime createdTime) {
        if (seeds == null || seeds.isEmpty() || p == null) {
            return List.of();
        }
        if (!p.getScenarios().contains("standard") || !p.getAlgorithms().contains("cbf-full")) {
            return List.of();
        }

        // Kiểm tra tính nhất quán của userIds trong từng hạt giống
        for (SeedPerUser s : seeds) {
            int[] baseUserIds = s.userIds();
            if (s.userIdsByAlgorithm() != null) {
                for (Map.Entry<String, int[]> entry : s.userIdsByAlgorithm().entrySet()) {
                    if (!Arrays.equals(entry.getValue(), baseUserIds)) {
                        throw new IllegalStateException("userIds mismatch for algorithm " + entry.getKey() + " in seed " + s.seed());
                    }
                }
            }
            if (s.ndcgByAlgorithm() != null) {
                for (Map.Entry<String, double[]> entry : s.ndcgByAlgorithm().entrySet()) {
                    if (entry.getValue().length != baseUserIds.length) {
                        throw new IllegalStateException("ndcg length mismatch for algorithm " + entry.getKey() + " in seed " + s.seed());
                    }
                }
            }
        }

        // Thứ tự hạt giống theo p.getSeeds()
        Map<Long, Integer> seedOrder = new HashMap<>();
        for (int i = 0; i < p.getSeeds().size(); i++) {
            seedOrder.put(p.getSeeds().get(i), i);
        }
        List<SeedPerUser> sortedSeeds = new ArrayList<>(seeds);
        sortedSeeds.sort(Comparator.comparingInt(s -> seedOrder.getOrDefault(s.seed(), Integer.MAX_VALUE)));

        // Xác định các thuật toán so sánh theo COMPARISON_ORDER
        List<String> toCompare = new ArrayList<>();
        for (String algo : COMPARISON_ORDER) {
            if (p.getAlgorithms().contains(algo)) {
                boolean allHaveAlgo = sortedSeeds.stream().allMatch(s -> s.ndcgByAlgorithm().containsKey(algo));
                if (allHaveAlgo) {
                    toCompare.add(algo);
                }
            }
        }

        if (toCompare.isEmpty()) {
            return List.of();
        }

        // Kiểm tra xem mọi hạt giống có cbf-full không
        boolean allHaveCbfFull = sortedSeeds.stream().allMatch(s -> s.ndcgByAlgorithm().containsKey("cbf-full"));
        if (!allHaveCbfFull) {
            return List.of();
        }

        int totalPairs = sortedSeeds.stream().mapToInt(s -> s.userIds().length).sum();
        int kTest = p.getKValues().contains(10) ? 10 : p.getKValues().stream().max(Integer::compareTo).orElse(10);
        int holmFamilySize = toCompare.size();

        record InterimTest(
                String algoB,
                double meanA,
                double meanB,
                double meanDiff,
                Double relChange,
                double ciLow,
                double ciHigh,
                int nonZeroCount,
                double wPlus,
                double z,
                double pValue
        ) {}

        List<InterimTest> interimList = new ArrayList<>();

        for (String algoB : toCompare) {
            double[] arrayA = new double[totalPairs];
            double[] arrayB = new double[totalPairs];
            double[] diff = new double[totalPairs];

            int offset = 0;
            for (SeedPerUser s : sortedSeeds) {
                double[] aVals = s.ndcgByAlgorithm().get("cbf-full");
                double[] bVals = s.ndcgByAlgorithm().get(algoB);
                int len = s.userIds().length;
                System.arraycopy(aVals, 0, arrayA, offset, len);
                System.arraycopy(bVals, 0, arrayB, offset, len);
                for (int i = 0; i < len; i++) {
                    diff[offset + i] = aVals[i] - bVals[i];
                }
                offset += len;
            }

            double sumA = 0.0;
            double sumB = 0.0;
            for (int i = 0; i < totalPairs; i++) {
                sumA += arrayA[i];
                sumB += arrayB[i];
            }
            double meanARaw = totalPairs > 0 ? (sumA / totalPairs) : 0.0;
            double meanBRaw = totalPairs > 0 ? (sumB / totalPairs) : 0.0;
            double meanDiffRaw = meanARaw - meanBRaw;

            double meanA = round4(meanARaw);
            double meanB = round4(meanBRaw);
            double meanDiff = round4(meanDiffRaw);

            Double relChange = null;
            if (meanBRaw != 0.0) {
                relChange = round1((meanARaw - meanBRaw) / meanBRaw * 100.0);
            }

            double[] ci = BootstrapCi.ci(diff, p.getBootstrap(), 42L);
            double ciLow = round4(ci[0]);
            double ciHigh = round4(ci[1]);

            WilcoxonSignedRank.Result wRes = WilcoxonSignedRank.test(arrayA, arrayB);
            double z = round4(wRes.z());

            interimList.add(new InterimTest(
                    algoB,
                    meanA,
                    meanB,
                    meanDiff,
                    relChange,
                    ciLow,
                    ciHigh,
                    wRes.nonZeroCount(),
                    wRes.wPlus(),
                    z,
                    wRes.pValue()
            ));
        }

        double[] rawPValues = new double[interimList.size()];
        for (int i = 0; i < interimList.size(); i++) {
            rawPValues[i] = interimList.get(i).pValue;
        }
        double[] pHolms = HolmCorrection.adjust(rawPValues);

        List<RecEvalTest> tests = new ArrayList<>();
        for (int i = 0; i < interimList.size(); i++) {
            InterimTest it = interimList.get(i);
            double pHolm = pHolms[i];

            String conclusion;
            if (pHolm < p.getAlpha() && it.z > 0.0) {
                conclusion = "better";
            } else if (pHolm < p.getAlpha() && it.z < 0.0) {
                conclusion = "worse";
            } else {
                conclusion = "no-diff";
            }

            Map<String, Object> params = new LinkedHashMap<>();
            params.put("method", "wilcoxon-signed-rank");
            params.put("zeroMethod", "wilcox");
            params.put("tieCorrection", true);
            params.put("continuityCorrection", false);
            params.put("holmFamilySize", holmFamilySize);
            params.put("alpha", p.getAlpha());
            params.put("bootstrap", p.getBootstrap());
            params.put("bootstrapSeed", 42);
            params.put("ciLevel", 0.95);

            RecEvalTest test = RecEvalTest.builder()
                    .batchCode(batchCode)
                    .scenario("standard")
                    .metric("ndcg")
                    .k(kTest)
                    .algorithmA("cbf-full")
                    .algorithmB(it.algoB)
                    .seedCount(sortedSeeds.size())
                    .pairCount(totalPairs)
                    .nonZeroCount(it.nonZeroCount)
                    .meanA(it.meanA)
                    .meanB(it.meanB)
                    .meanDiff(it.meanDiff)
                    .ciLow(it.ciLow)
                    .ciHigh(it.ciHigh)
                    .relChange(it.relChange)
                    .wPlus(it.wPlus)
                    .z(it.z)
                    .pValue(it.pValue)
                    .pHolm(pHolm)
                    .conclusion(conclusion)
                    .params(params)
                    .createdTime(createdTime != null ? createdTime : LocalDateTime.now())
                    .build();

            tests.add(test);
        }

        return tests;
    }

    private static double round4(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }

    private static double round1(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP).doubleValue();
    }
}
