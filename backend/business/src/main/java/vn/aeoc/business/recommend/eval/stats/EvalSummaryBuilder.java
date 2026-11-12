package vn.aeoc.business.recommend.eval.stats;

import vn.aeoc.business.recommend.eval.EvalProperties;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;
import vn.aeoc.entity.data.mysql.recommend.RecEvalSummary;
import vn.aeoc.entity.data.mysql.recommend.RecEvalTest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

public final class EvalSummaryBuilder {

    private EvalSummaryBuilder() {}

    public static RecEvalSummary build(List<RecEvalRun> runs, List<RecEvalTest> tests) {
        if (runs == null || runs.isEmpty()) {
            return RecEvalSummary.builder()
                    .seeds(List.of())
                    .kValues(List.of())
                    .scenarios(List.of())
                    .tests(tests != null ? tests : List.of())
                    .build();
        }

        // Sắp xếp runs theo id nếu có, nếu chưa có id (dòng lệnh) thì giữ nguyên thứ tự
        List<RecEvalRun> sortedRuns = new ArrayList<>(runs);
        boolean hasId = sortedRuns.stream().anyMatch(r -> r.getId() != null);
        if (hasId) {
            sortedRuns.sort(Comparator.comparing(r -> r.getId() != null ? r.getId() : Integer.MAX_VALUE));
        }

        RecEvalRun firstRun = sortedRuns.get(0);
        String batchCode = firstRun.getBatchCode();
        String dataset = firstRun.getDataset();

        // seeds theo thứ tự xuất hiện
        LinkedHashSet<Long> seedSet = new LinkedHashSet<>();
        Integer lutCount = null;
        Integer simUserCount = null;

        for (RecEvalRun r : sortedRuns) {
            if (r.getParams() != null) {
                Object sObj = r.getParams().get("seed");
                if (sObj instanceof Number n) {
                    seedSet.add(n.longValue());
                }
                if (lutCount == null && r.getParams().get("lutCount") instanceof Number n) {
                    lutCount = n.intValue();
                }
                if (simUserCount == null && r.getParams().get("simUserCount") instanceof Number n) {
                    simUserCount = n.intValue();
                }
            }
        }
        List<Long> seeds = new ArrayList<>(seedSet);

        // newLutDays từ dòng standard đầu tiên
        Integer newLutDays = null;
        for (RecEvalRun r : sortedRuns) {
            if ("standard".equals(r.getScenario()) && r.getParams() != null) {
                Object dObj = r.getParams().get("newLutDays");
                if (dObj instanceof Number n) {
                    newLutDays = n.intValue();
                    break;
                }
            }
        }

        // kValues
        Set<Integer> allK = new HashSet<>();
        for (RecEvalRun r : sortedRuns) {
            if (r.getMetrics() != null) {
                for (String kStr : r.getMetrics().keySet()) {
                    try {
                        allK.add(Integer.parseInt(kStr));
                    } catch (NumberFormatException ignored) {}
                }
            }
        }
        List<Integer> kValues = new ArrayList<>(allK);
        Collections.sort(kValues);

        // Phân nhóm theo scenario
        Map<String, List<RecEvalRun>> runsByScenario = new LinkedHashMap<>();
        for (RecEvalRun r : sortedRuns) {
            String sc = r.getScenario() != null ? r.getScenario() : "standard";
            runsByScenario.computeIfAbsent(sc, k -> new ArrayList<>()).add(r);
        }

        List<String> sortedScenarioNames = new ArrayList<>(runsByScenario.keySet());
        sortedScenarioNames.sort(EvalSummaryBuilder::compareScenarios);

        List<RecEvalSummary.ScenarioSummary> scenarioSummaries = new ArrayList<>();
        for (String sc : sortedScenarioNames) {
            List<RecEvalRun> scRuns = runsByScenario.get(sc);

            // userCounts theo thứ tự seeds
            List<Integer> userCounts = new ArrayList<>();
            for (Long seed : seeds) {
                RecEvalRun matched = null;
                for (RecEvalRun r : scRuns) {
                    if (r.getParams() != null) {
                        Object sObj = r.getParams().get("seed");
                        if (sObj instanceof Number n && n.longValue() == seed) {
                            matched = r;
                            break;
                        }
                    }
                }
                if (matched != null && matched.getUserCount() != null) {
                    userCounts.add(matched.getUserCount());
                }
            }

            // Phân nhóm theo algorithm
            Map<String, List<RecEvalRun>> runsByAlgo = new LinkedHashMap<>();
            for (RecEvalRun r : scRuns) {
                String algo = r.getAlgorithm();
                runsByAlgo.computeIfAbsent(algo, k -> new ArrayList<>()).add(r);
            }

            List<String> sortedAlgos = new ArrayList<>(runsByAlgo.keySet());
            sortedAlgos.sort(EvalSummaryBuilder::compareAlgorithms);

            List<RecEvalSummary.AlgorithmSummary> rows = new ArrayList<>();
            for (String algo : sortedAlgos) {
                List<RecEvalRun> algoRuns = runsByAlgo.get(algo);
                int seedCount = algoRuns.size();

                // Các K mà mọi dòng đều có
                Set<String> commonK = new HashSet<>(algoRuns.get(0).getMetrics() != null ? algoRuns.get(0).getMetrics().keySet() : Set.of());
                for (RecEvalRun ar : algoRuns) {
                    if (ar.getMetrics() == null) {
                        commonK.clear();
                        break;
                    }
                    commonK.retainAll(ar.getMetrics().keySet());
                }

                List<String> sortedKList = new ArrayList<>(commonK);
                sortedKList.sort((k1, k2) -> {
                    try {
                        return Integer.compare(Integer.parseInt(k1), Integer.parseInt(k2));
                    } catch (NumberFormatException e) {
                        return k1.compareTo(k2);
                    }
                });

                Map<String, Map<String, RecEvalSummary.MetricStat>> metricsMap = new LinkedHashMap<>();
                for (String kStr : sortedKList) {
                    Set<String> commonFields = new HashSet<>(algoRuns.get(0).getMetrics().get(kStr).keySet());
                    for (RecEvalRun ar : algoRuns) {
                        commonFields.retainAll(ar.getMetrics().get(kStr).keySet());
                    }

                    List<String> orderedFields = new ArrayList<>();
                    for (String mf : RecEvalRun.CANONICAL_METRIC_ORDER) {
                        if (commonFields.contains(mf)) {
                            orderedFields.add(mf);
                        }
                    }
                    for (String cf : commonFields) {
                        if (!orderedFields.contains(cf)) {
                            orderedFields.add(cf);
                        }
                    }

                    Map<String, RecEvalSummary.MetricStat> innerMap = new LinkedHashMap<>();
                    for (String field : orderedFields) {
                        List<Double> vals = new ArrayList<>();
                        for (RecEvalRun ar : algoRuns) {
                            Double v = ar.getMetrics().get(kStr).get(field);
                            if (v != null) {
                                vals.add(v);
                            }
                        }

                        Double meanRaw = SeedStats.mean(vals);
                        Double stdRaw = SeedStats.sampleStd(vals);

                        Double mean = meanRaw != null ? round4(meanRaw) : null;
                        Double std = (seedCount > 1 && stdRaw != null) ? round4(stdRaw) : null;

                        innerMap.put(field, new RecEvalSummary.MetricStat(mean, std));
                    }
                    metricsMap.put(kStr, innerMap);
                }

                rows.add(RecEvalSummary.AlgorithmSummary.builder()
                        .algorithm(algo)
                        .seedCount(seedCount)
                        .metrics(metricsMap)
                        .build());
            }

            scenarioSummaries.add(RecEvalSummary.ScenarioSummary.builder()
                    .scenario(sc)
                    .userCounts(userCounts)
                    .rows(rows)
                    .build());
        }

        return RecEvalSummary.builder()
                .batchCode(batchCode)
                .dataset(dataset)
                .seeds(seeds)
                .lutCount(lutCount)
                .simUserCount(simUserCount)
                .kValues(kValues)
                .newLutDays(newLutDays)
                .scenarios(scenarioSummaries)
                .tests(tests != null ? tests : List.of())
                .build();
    }

    public static int compareScenarios(String s1, String s2) {
        if (s1.equals(s2)) return 0;
        if ("standard".equals(s1)) return -1;
        if ("standard".equals(s2)) return 1;
        boolean c1 = s1.startsWith("cold-user-");
        boolean c2 = s2.startsWith("cold-user-");
        if (c1 && c2) {
            try {
                int n1 = Integer.parseInt(s1.substring("cold-user-".length()));
                int n2 = Integer.parseInt(s2.substring("cold-user-".length()));
                return Integer.compare(n1, n2);
            } catch (NumberFormatException ignored) {}
        }
        if (c1) return -1;
        if (c2) return 1;
        return s1.compareTo(s2);
    }

    public static int compareAlgorithms(String a1, String a2) {
        if (a1.equals(a2)) return 0;
        int idx1 = EvalProperties.ALGORITHM_ORDER.indexOf(a1);
        int idx2 = EvalProperties.ALGORITHM_ORDER.indexOf(a2);
        if (idx1 >= 0 && idx2 >= 0) return Integer.compare(idx1, idx2);
        if (idx1 >= 0) return -1;
        if (idx2 >= 0) return 1;
        return a1.compareTo(a2);
    }

    private static double round4(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) return 0.0;
        return BigDecimal.valueOf(val).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }
}
