package vn.aeoc.business.recommend.eval.stats;

import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;
import vn.aeoc.entity.data.mysql.recommend.RecEvalSummary;
import vn.aeoc.entity.data.mysql.recommend.RecEvalTest;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

public final class EvalReportWriter {

    public static final Map<String, String> BASELINE_FULL_LABELS = Map.of(
            "random", "B1 Ngẫu nhiên",
            "popular", "B2 Phổ biến",
            "popular-dd", "B2-dd Phổ biến xen kẽ",
            "cbf-tag", "B3 CBF chỉ thẻ",
            "cbf-full", "M CBF đủ đặc trưng"
    );

    public static final Map<String, String> SHORT_LABELS = Map.ofEntries(
            Map.entry("random", "B1"),
            Map.entry("popular", "B2"),
            Map.entry("popular-dd", "B2-dd"),
            Map.entry("cbf-tag", "B3"),
            Map.entry("cbf-full", "M"),
            Map.entry("m-mau", "M-mau"),
            Map.entry("m-the", "M-the"),
            Map.entry("m-giam", "M-giam"),
            Map.entry("m-mmr", "M-mmr"),
            Map.entry("m-kb", "M-kb"),
            Map.entry("m-tron", "M-tron"),
            Map.entry("m-mac-dinh", "M-mac-dinh")
    );

    private EvalReportWriter() {}

    public static String render(List<RecEvalRun> runs, List<RecEvalTest> tests) {
        RecEvalSummary summary = EvalSummaryBuilder.build(runs, tests);
        StringBuilder sb = new StringBuilder();

        int k = (summary.getKValues() != null && summary.getKValues().contains(10))
                ? 10
                : (summary.getKValues() != null && !summary.getKValues().isEmpty()
                ? Collections.max(summary.getKValues())
                : 10);
        String kStr = String.valueOf(k);

        int n = summary.getSeeds() != null ? summary.getSeeds().size() : 0;
        String seedsStr = summary.getSeeds() != null
                ? summary.getSeeds().stream().map(String::valueOf).collect(Collectors.joining(", "))
                : "";

        // Header
        sb.append("# Kết quả đánh giá gợi ý · lô ").append(summary.getBatchCode()).append("\n\n");
        sb.append(summary.getDataset()).append(" · ")
                .append(summary.getLutCount()).append(" LUT · ")
                .append(summary.getSimUserCount()).append(" người mô phỏng · ")
                .append(n).append(" hạt giống (").append(seedsStr).append(") · K = ").append(k).append("\n\n");

        if (n >= 2) {
            sb.append("Số liệu là trung bình trên các hạt giống, độ lệch chuẩn trong ngoặc.\n\n");
        } else {
            sb.append("Lô chỉ có 1 hạt giống nên không có độ lệch chuẩn.\n\n");
        }

        // Bảng 8.1. So sánh với baseline (K = {K})
        RecEvalSummary.ScenarioSummary standardSc = null;
        if (summary.getScenarios() != null) {
            for (RecEvalSummary.ScenarioSummary sc : summary.getScenarios()) {
                if ("standard".equals(sc.getScenario())) {
                    standardSc = sc;
                    break;
                }
            }
        }

        List<String> baselineAlgos = List.of("random", "popular", "popular-dd", "cbf-tag", "cbf-full");
        if (standardSc != null) {
            Map<String, RecEvalSummary.AlgorithmSummary> rowMap = new HashMap<>();
            for (RecEvalSummary.AlgorithmSummary row : standardSc.getRows()) {
                rowMap.put(row.getAlgorithm(), row);
            }

            boolean hasBaseline = baselineAlgos.stream().anyMatch(rowMap::containsKey);
            if (hasBaseline) {
                sb.append("## Bảng 8.1. So sánh với baseline (K = ").append(k).append(")\n\n");
                sb.append(String.format(
                        "| Thuật toán | P@%d | R@%d | NDCG@%d | HitRate@%d | ILD@%d | Phong cách / %d | Coverage@%d | Novelty@%d |\n",
                        k, k, k, k, k, k, k, k
                ));
                sb.append("|---|---|---|---|---|---|---|---|---|\n");

                for (String algo : baselineAlgos) {
                    RecEvalSummary.AlgorithmSummary row = rowMap.get(algo);
                    if (row == null) continue;
                    String label = BASELINE_FULL_LABELS.getOrDefault(algo, algo);
                    Map<String, RecEvalSummary.MetricStat> m = row.getMetrics() != null ? row.getMetrics().get(kStr) : null;

                    sb.append(String.format(
                            "| %s | %s | %s | %s | %s | %s | %s | %s | %s |\n",
                            label,
                            formatCell(m != null ? m.get("precision") : null, 4),
                            formatCell(m != null ? m.get("recall") : null, 4),
                            formatCell(m != null ? m.get("ndcg") : null, 4),
                            formatCell(m != null ? m.get("hitRate") : null, 4),
                            formatCell(m != null ? m.get("ild") : null, 4),
                            formatCell(m != null ? m.get("styles") : null, 2),
                            formatCell(m != null ? m.get("coverage") : null, 4),
                            formatCell(m != null ? m.get("novelty") : null, 2)
                    ));
                }

                sb.append("\n");
                String usersStr = standardSc.getUserCounts() != null
                        ? standardSc.getUserCounts().stream().map(String::valueOf).collect(Collectors.joining(", "))
                        : "";
                sb.append("Người được tính mỗi hạt giống: ").append(usersStr).append(".\n\n");
            }
        }

        // Bảng 8.2. Kiểm định (NDCG@{k của test})
        if (tests != null && !tests.isEmpty()) {
            RecEvalTest t0 = tests.get(0);
            int testK = t0.getK() != null ? t0.getK() : 10;
            sb.append("## Bảng 8.2. Kiểm định (NDCG@").append(testK).append(")\n\n");

            int pairCount = t0.getPairCount() != null ? t0.getPairCount() : 0;
            int holmFamilySize = t0.getParams() != null && t0.getParams().get("holmFamilySize") instanceof Number nH
                    ? nH.intValue() : tests.size();
            double alpha = t0.getParams() != null && t0.getParams().get("alpha") instanceof Number nA
                    ? nA.doubleValue() : 0.05;
            int bootstrap = t0.getParams() != null && t0.getParams().get("bootstrap") instanceof Number nB
                    ? nB.intValue() : 1000;
            String alphaStr = String.format(Locale.US, "%.2f", alpha).replace('.', ',');

            sb.append(String.format(
                    "Wilcoxon có dấu theo cặp trên %d cặp (hạt giống, người dùng), hiệu chỉnh Holm cho %d phép so sánh, mức ý nghĩa %s; khoảng tin cậy 95%% bằng bootstrap %d lần.\n\n",
                    pairCount, holmFamilySize, alphaStr, bootstrap
            ));

            sb.append("| So sánh | Chênh lệch trung bình | Khoảng tin cậy 95% | Thay đổi tương đối | p (Wilcoxon, đã hiệu chỉnh Holm) | Kết luận |\n");
            sb.append("|---|---|---|---|---|---|\n");

            for (RecEvalTest t : tests) {
                String comp = "M với " + SHORT_LABELS.getOrDefault(t.getAlgorithmB(), t.getAlgorithmB());
                String diffStr = formatSignedDiff(t.getMeanDiff(), 4);
                String ciStr = "[" + formatSignedDiff(t.getCiLow(), 4) + "; " + formatSignedDiff(t.getCiHigh(), 4) + "]";
                String relStr = formatSignedPercent(t.getRelChange());
                String pStr = formatP(t.getPHolm());
                String concl = switch (t.getConclusion() != null ? t.getConclusion() : "") {
                    case "better" -> "M tốt hơn";
                    case "worse" -> "M kém hơn";
                    default -> "Không khác biệt có ý nghĩa";
                };

                sb.append(String.format("| %s | %s | %s | %s | %s | %s |\n",
                        comp, diffStr, ciStr, relStr, pStr, concl));
            }
            sb.append("\n");
        }

        // Bảng 8.3. Bỏ bớt thành phần (K = {K})
        List<String> ablationOrder = List.of(
                "m-mau", "m-the", "m-giam", "m-mmr", "m-kb", "m-tron", "m-mac-dinh"
        );
        if (standardSc != null) {
            Map<String, RecEvalSummary.AlgorithmSummary> rowMap = new HashMap<>();
            for (RecEvalSummary.AlgorithmSummary row : standardSc.getRows()) {
                rowMap.put(row.getAlgorithm(), row);
            }

            boolean hasAblation = ablationOrder.stream().anyMatch(rowMap::containsKey);
            if (hasAblation) {
                sb.append("## Bảng 8.3. Bỏ bớt thành phần (K = ").append(k).append(")\n\n");
                sb.append(String.format("| Biến thể | NDCG@%d | Thay đổi so với M | ILD@%d | p (Holm) |\n", k, k));
                sb.append("|---|---|---|---|---|\n");

                RecEvalSummary.AlgorithmSummary mRow = rowMap.get("cbf-full");
                Double mNdcg = (mRow != null && mRow.getMetrics() != null && mRow.getMetrics().get(kStr) != null
                        && mRow.getMetrics().get(kStr).get("ndcg") != null)
                        ? mRow.getMetrics().get(kStr).get("ndcg").getMean()
                        : null;
                RecEvalSummary.MetricStat mIldStat = (mRow != null && mRow.getMetrics() != null && mRow.getMetrics().get(kStr) != null)
                        ? mRow.getMetrics().get(kStr).get("ild")
                        : null;

                sb.append(String.format("| M | %s | — | %s | — |\n",
                        formatCell(mRow != null && mRow.getMetrics() != null && mRow.getMetrics().get(kStr) != null ? mRow.getMetrics().get(kStr).get("ndcg") : null, 4),
                        formatCell(mIldStat, 4)
                ));

                Map<String, RecEvalTest> testByAlgoB = new HashMap<>();
                if (tests != null) {
                    for (RecEvalTest t : tests) {
                        testByAlgoB.put(t.getAlgorithmB(), t);
                    }
                }

                for (String algo : ablationOrder) {
                    RecEvalSummary.AlgorithmSummary row = rowMap.get(algo);
                    if (row == null) continue;
                    String label = SHORT_LABELS.getOrDefault(algo, algo);
                    Map<String, RecEvalSummary.MetricStat> m = row.getMetrics() != null ? row.getMetrics().get(kStr) : null;
                    RecEvalSummary.MetricStat ndcgStat = m != null ? m.get("ndcg") : null;
                    RecEvalSummary.MetricStat ildStat = m != null ? m.get("ild") : null;

                    String changeStr = "—";
                    if (mNdcg != null && mNdcg > 0.0 && ndcgStat != null && ndcgStat.getMean() != null) {
                        double pct = (ndcgStat.getMean() - mNdcg) / mNdcg * 100.0;
                        changeStr = formatSignedPercent(pct);
                    }

                    RecEvalTest t = testByAlgoB.get(algo);
                    String pStr = (t != null) ? formatP(t.getPHolm()) : "—";

                    sb.append(String.format("| %s | %s | %s | %s | %s |\n",
                            label, formatCell(ndcgStat, 4), changeStr, formatCell(ildStat, 4), pStr));
                }
                sb.append("\n");
            }
        }

        // Bảng 8.4. Người mới (NDCG@{K} theo số sự kiện n)
        List<RecEvalSummary.ScenarioSummary> coldScs = new ArrayList<>();
        if (summary.getScenarios() != null) {
            for (RecEvalSummary.ScenarioSummary sc : summary.getScenarios()) {
                if (sc.getScenario() != null && sc.getScenario().startsWith("cold-user-")) {
                    coldScs.add(sc);
                }
            }
        }

        if (!coldScs.isEmpty()) {
            sb.append("## Bảng 8.4. Người mới (NDCG@").append(k).append(" theo số sự kiện n)\n\n");

            StringBuilder th = new StringBuilder("| Thuật toán |");
            StringBuilder sep = new StringBuilder("|---|");
            for (RecEvalSummary.ScenarioSummary sc : coldScs) {
                String nStr = sc.getScenario().substring("cold-user-".length());
                th.append(" n = ").append(nStr).append(" |");
                sep.append("---|");
            }
            sb.append(th).append("\n").append(sep).append("\n");

            List<String> coldAlgos = List.of("popular", "cbf-tag", "cbf-full", "m-kb");
            for (String algo : coldAlgos) {
                String label = SHORT_LABELS.getOrDefault(algo, algo);
                StringBuilder tr = new StringBuilder("| " + label + " |");
                for (RecEvalSummary.ScenarioSummary sc : coldScs) {
                    RecEvalSummary.AlgorithmSummary row = null;
                    for (RecEvalSummary.AlgorithmSummary r : sc.getRows()) {
                        if (algo.equals(r.getAlgorithm())) {
                            row = r;
                            break;
                        }
                    }
                    RecEvalSummary.MetricStat ndcgStat = (row != null && row.getMetrics() != null && row.getMetrics().get(kStr) != null)
                            ? row.getMetrics().get(kStr).get("ndcg")
                            : null;
                    tr.append(" ").append(formatCell(ndcgStat, 4)).append(" |");
                }
                sb.append(tr).append("\n");
            }

            sb.append("\n");
            RecEvalSummary.ScenarioSummary minColdSc = coldScs.get(0);
            String coldUsersStr = minColdSc.getUserCounts() != null
                    ? minColdSc.getUserCounts().stream().map(String::valueOf).collect(Collectors.joining(", "))
                    : "";
            sb.append("Người có khai báo được tính mỗi hạt giống: ").append(coldUsersStr).append(".\n\n");
        }

        // Bảng 8.5. LUT mới (K = {K})
        if (standardSc != null) {
            Map<String, RecEvalSummary.AlgorithmSummary> rowMap = new HashMap<>();
            for (RecEvalSummary.AlgorithmSummary row : standardSc.getRows()) {
                rowMap.put(row.getAlgorithm(), row);
            }

            boolean hasNewLut = false;
            for (String algo : baselineAlgos) {
                RecEvalSummary.AlgorithmSummary row = rowMap.get(algo);
                if (row != null && row.getMetrics() != null && row.getMetrics().get(kStr) != null
                        && row.getMetrics().get(kStr).containsKey("newLutHit")) {
                    hasNewLut = true;
                    break;
                }
            }

            if (hasNewLut) {
                sb.append("## Bảng 8.5. LUT mới (K = ").append(k).append(")\n\n");
                sb.append("| Thuật toán | Tỉ lệ danh sách có LUT mới | Recall@").append(k).append(" trên LUT mới |\n");
                sb.append("|---|---|---|\n");

                for (String algo : baselineAlgos) {
                    RecEvalSummary.AlgorithmSummary row = rowMap.get(algo);
                    if (row == null) continue;
                    String label = BASELINE_FULL_LABELS.getOrDefault(algo, algo);
                    Map<String, RecEvalSummary.MetricStat> m = row.getMetrics() != null ? row.getMetrics().get(kStr) : null;

                    sb.append(String.format("| %s | %s | %s |\n",
                            label,
                            formatCell(m != null ? m.get("newLutHit") : null, 4),
                            formatCell(m != null ? m.get("newLutRecall") : null, 4)
                    ));
                }
                sb.append("\n");
            }
        }

        // Tinh chỉnh theo hạt giống
        List<RecEvalRun> cbfFullRuns = new ArrayList<>();
        Map<Long, RecEvalRun> mMacDinhRunsBySeed = new HashMap<>();
        for (RecEvalRun r : runs) {
            if ("standard".equals(r.getScenario())) {
                Object sObj = r.getParams() != null ? r.getParams().get("seed") : null;
                Long s = sObj instanceof Number nS ? nS.longValue() : null;
                if ("cbf-full".equals(r.getAlgorithm()) && r.getParams() != null && r.getParams().containsKey("tuning")) {
                    cbfFullRuns.add(r);
                } else if ("m-mac-dinh".equals(r.getAlgorithm()) && s != null) {
                    mMacDinhRunsBySeed.put(s, r);
                }
            }
        }

        if (!cbfFullRuns.isEmpty()) {
            sb.append("## Tinh chỉnh theo hạt giống\n\n");
            sb.append("| Hạt giống | Thẻ | Màu | Danh mục | Phong cách | Văn bản | Tác giả | λ | Chu kỳ bán rã | k | NDCG@10 kiểm định (mặc định → cuối) | NDCG@10 phần kiểm: M | NDCG@10 phần kiểm: M-mac-dinh |\n");
            sb.append("|---|---|---|---|---|---|---|---|---|---|---|---|---|\n");

            for (RecEvalRun r : cbfFullRuns) {
                Map<String, Object> p = r.getParams();
                long seed = p.get("seed") instanceof Number nS ? nS.longValue() : 0L;

                @SuppressWarnings("unchecked")
                Map<String, Object> w = p.get("weights") instanceof Map<?, ?> mw ? (Map<String, Object>) mw : Map.of();
                String tag = formatWeight(w.get("tag"));
                String color = formatWeight(w.get("color"));
                String cat = formatWeight(w.get("category"));
                String style = formatWeight(w.get("style"));
                String text = formatWeight(w.get("text"));
                String creator = formatWeight(w.get("creator"));

                double lambda = p.get("mmrLambda") instanceof Number nL ? nL.doubleValue() : 0.7;
                String lambdaStr = String.format(Locale.US, "%.1f", lambda).replace('.', ',');

                double halfLife = p.get("halfLifeDays") instanceof Number nH ? nH.doubleValue() : 0.0;
                String hlStr = (halfLife <= 0.0) ? "∞" : String.valueOf((int) halfLife);

                int coldK = p.get("coldStartK") instanceof Number nK ? nK.intValue() : 0;

                @SuppressWarnings("unchecked")
                Map<String, Object> tuning = p.get("tuning") instanceof Map<?, ?> mt ? (Map<String, Object>) mt : Map.of();
                double defNdcg = tuning.get("validNdcgDefault") instanceof Number nV ? nV.doubleValue() : 0.0;
                double finNdcg = tuning.get("validNdcgFinal") instanceof Number nV ? nV.doubleValue() : 0.0;
                String validNdcgStr = String.format(Locale.US, "%.4f → %.4f", defNdcg, finNdcg).replace('.', ',');

                double mTestNdcg = (r.getMetrics() != null && r.getMetrics().get("10") != null
                        && r.getMetrics().get("10").get("ndcg") != null)
                        ? r.getMetrics().get("10").get("ndcg")
                        : 0.0;
                String mTestStr = String.format(Locale.US, "%.4f", mTestNdcg).replace('.', ',');

                RecEvalRun macDinhRun = mMacDinhRunsBySeed.get(seed);
                double macDinhTestNdcg = (macDinhRun != null && macDinhRun.getMetrics() != null
                        && macDinhRun.getMetrics().get("10") != null
                        && macDinhRun.getMetrics().get("10").get("ndcg") != null)
                        ? macDinhRun.getMetrics().get("10").get("ndcg")
                        : 0.0;
                String macDinhTestStr = String.format(Locale.US, "%.4f", macDinhTestNdcg).replace('.', ',');

                sb.append(String.format(
                        "| %d | %s | %s | %s | %s | %s | %s | %s | %s | %d | %s | %s | %s |\n",
                        seed, tag, color, cat, style, text, creator, lambdaStr, hlStr, coldK, validNdcgStr, mTestStr, macDinhTestStr
                ));
            }
            sb.append("\n");
        }

        // Kết thúc bằng đúng một \n
        while (sb.length() > 0 && sb.charAt(sb.length() - 1) == '\n') {
            sb.deleteCharAt(sb.length() - 1);
        }
        sb.append('\n');

        return sb.toString();
    }

    private static String formatWeight(Object val) {
        if (val instanceof Number n) {
            return String.format(Locale.US, "%.2f", n.doubleValue()).replace('.', ',');
        }
        return "—";
    }

    public static String formatCell(RecEvalSummary.MetricStat stat, int digits) {
        if (stat == null || stat.getMean() == null) {
            return "—";
        }
        if (stat.getStd() != null) {
            return String.format(Locale.US, "%." + digits + "f (%." + digits + "f)", stat.getMean(), stat.getStd())
                    .replace('.', ',');
        } else {
            return String.format(Locale.US, "%." + digits + "f", stat.getMean()).replace('.', ',');
        }
    }

    public static String formatSignedDiff(Double val, int digits) {
        if (val == null || Double.isNaN(val)) return "—";
        double rounded = BigDecimal.valueOf(val).setScale(digits, RoundingMode.HALF_UP).doubleValue();
        if (rounded == 0.0) {
            return String.format(Locale.US, "%." + digits + "f", 0.0).replace('.', ',');
        } else if (rounded > 0.0) {
            return ("+" + String.format(Locale.US, "%." + digits + "f", rounded)).replace('.', ',');
        } else {
            return String.format(Locale.US, "%." + digits + "f", rounded).replace('.', ',');
        }
    }

    public static String formatSignedPercent(Double val) {
        if (val == null || Double.isNaN(val)) return "—";
        double rounded = BigDecimal.valueOf(val).setScale(1, RoundingMode.HALF_UP).doubleValue();
        if (rounded == 0.0) {
            return "0,0%";
        } else if (rounded > 0.0) {
            return ("+" + String.format(Locale.US, "%.1f%%", rounded)).replace('.', ',');
        } else {
            return String.format(Locale.US, "%.1f%%", rounded).replace('.', ',');
        }
    }

    public static String formatP(Double p) {
        if (p == null || Double.isNaN(p)) return "—";
        if (p < 0.001) {
            return "< 0,001";
        }
        return String.format(Locale.US, "%.3f", p).replace('.', ',');
    }
}
