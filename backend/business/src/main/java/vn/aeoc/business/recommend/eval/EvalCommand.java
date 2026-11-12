package vn.aeoc.business.recommend.eval;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import vn.aeoc.business.recommend.eval.tune.TuningResult;
import vn.aeoc.business.recommend.service.RecEvalRunService;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@Profile("eval")
public class EvalCommand implements ApplicationRunner {

    private static final Map<String, String> BASELINE_LABELS = Map.of(
            "random", "B1 Ngẫu nhiên",
            "popular", "B2 Phổ biến",
            "popular-dd", "B2-dd Phổ biến xen kẽ",
            "cbf-tag", "B3 CBF chỉ thẻ",
            "cbf-full", "M CBF đủ đặc trưng"
    );

    private static final Map<String, String> ABLATION_LABELS = Map.of(
            "cbf-full", "M",
            "m-mau", "M-mau",
            "m-the", "M-the",
            "m-giam", "M-giam",
            "m-mmr", "M-mmr",
            "m-kb", "M-kb",
            "m-tron", "M-tron",
            "m-mac-dinh", "M-mac-dinh"
    );

    private static final Map<String, String> COLD_LABELS = Map.of(
            "popular", "B2 Phổ biến",
            "cbf-tag", "B3 CBF chỉ thẻ",
            "cbf-full", "M CBF đủ đặc trưng",
            "m-kb", "M-kb Bỏ sở thích khai báo"
    );

    private final EvalProperties evalProperties;
    private final EvalRunner evalRunner;
    private final RecEvalRunService recEvalRunService;
    private final ApplicationContext applicationContext;

    public EvalCommand(EvalProperties evalProperties,
                       EvalRunner evalRunner,
                       RecEvalRunService recEvalRunService,
                       ApplicationContext applicationContext) {
        this.evalProperties = evalProperties;
        this.evalRunner = evalRunner;
        this.recEvalRunService = recEvalRunService;
        this.applicationContext = applicationContext;
    }

    @Override
    public void run(ApplicationArguments args) {
        Optional<String> invalidKey = evalProperties.validate();
        if (invalidKey.isPresent()) {
            String msg = "Tham số đánh giá không hợp lệ: " + invalidKey.get();
            System.err.println(msg);
            System.out.println(msg);
            int exitCode = 2;
            System.exit(SpringApplication.exit(applicationContext, () -> exitCode));
            return;
        }

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");
        String batchCode = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).format(dtf);

        try {
            List<RecEvalRun> allRuns = new ArrayList<>();
            for (Long seed : evalProperties.getSeeds()) {
                long seedStart = System.currentTimeMillis();
                EvalRunner.EvalSeedResult seedResult = evalRunner.runWithReport(seed, evalProperties, batchCode);
                allRuns.addAll(seedResult.runs());
                long seedElapsed = System.currentTimeMillis() - seedStart;

                printSeedReport(seedResult, seed, batchCode, evalProperties, seedElapsed);
            }

            recEvalRunService.saveBatch(allRuns);
            System.exit(SpringApplication.exit(applicationContext, () -> 0));
        } catch (Throwable t) {
            t.printStackTrace();
            int exitCode = 1;
            System.exit(SpringApplication.exit(applicationContext, () -> exitCode));
        }
    }

    private void printSeedReport(EvalRunner.EvalSeedResult seedResult,
                                 long seed,
                                 String batchCode,
                                 EvalProperties p,
                                 long seedElapsed) {
        List<RecEvalRun> runs = seedResult.runs();
        TuningResult tuningM = seedResult.tuningM();
        TuningResult tuningB3 = seedResult.tuningB3();

        int printK = p.getKValues().contains(10) ? 10 : p.getKValues().stream().max(Integer::compareTo).orElse(10);
        String kKey = String.valueOf(printK);

        // Header
        System.out.println(String.format("== Đánh giá gợi ý · lô %s · %s · hạt giống %d ==", batchCode, p.getDataset(), seed));
        int calculatedUsers = 0;
        for (RecEvalRun r : runs) {
            if ("standard".equals(r.getScenario())) {
                calculatedUsers = r.getUserCount();
                break;
            }
        }
        if (calculatedUsers == 0 && !runs.isEmpty()) {
            calculatedUsers = runs.get(0).getUserCount();
        }
        double elapsedSec = seedElapsed / 1000.0;
        System.out.println(String.format(Locale.US, "%d LUT · %d người mô phỏng · %d người được tính · %.1f giây",
                p.getLuts(), p.getUsers(), calculatedUsers, elapsedSec));
        System.out.println();

        // 1. Tinh chỉnh M trên tập kiểm định
        if (tuningM != null && tuningM.getValidUserCount() > 0) {
            System.out.println(String.format("-- Tinh chỉnh M trên tập kiểm định (%d người) --", tuningM.getValidUserCount()));
            System.out.println(String.format("Trọng số khối: %d bộ, 5 bộ tốt nhất", tuningM.getWeightTrials()));
            System.out.println("| # | Thẻ | Màu | Danh mục | Phong cách | Văn bản | Tác giả | NDCG@10 |");
            System.out.println("|---|---|---|---|---|---|---|---|");

            for (TuningResult.WeightReportEntry we : tuningM.getTopWeights()) {
                System.out.println(String.format(Locale.US,
                        "| %s | %.2f | %.2f | %.2f | %.2f | %.2f | %.2f | %.4f |",
                        we.label(), we.tag(), we.color(), we.category(), we.style(), we.text(), we.creator(), we.ndcg()));
            }
            if (tuningM.getDefaultWeightEntry() != null) {
                TuningResult.WeightReportEntry de = tuningM.getDefaultWeightEntry();
                System.out.println(String.format(Locale.US,
                        "| %s | %.2f | %.2f | %.2f | %.2f | %.2f | %.2f | %.4f |",
                        de.label(), de.tag(), de.color(), de.category(), de.style(), de.text(), de.creator(), de.ndcg()));
            }

            double ildThreshold = 0.95 * tuningM.getValidIldBase();
            System.out.println(String.format(Locale.US,
                    "λ của MMR (ILD@10 tối thiểu %.4f = 95%% của λ 0.7)", ildThreshold));
            System.out.println("| λ | NDCG@10 | ILD@10 | Đạt |");
            System.out.println("|---|---|---|---|");
            for (TuningResult.LambdaReportEntry le : tuningM.getLambdaEntries()) {
                System.out.println(String.format(Locale.US,
                        "| %.1f | %.4f | %.4f | %s |",
                        le.lambda(), le.ndcg(), le.ild(), le.passed() ? "có" : "không"));
            }

            System.out.println("Chu kỳ bán rã × k (NDCG@10)");
            System.out.println("| Chu kỳ bán rã | k = 2 | k = 5 | k = 10 |");
            System.out.println("|---|---|---|---|");
            for (TuningResult.GridReportEntry ge : tuningM.getGridEntries()) {
                String hlStr = (ge.halfLifeDays() <= 0.0) ? "∞" : String.valueOf((int) ge.halfLifeDays());
                double ndcg2 = ge.ndcgByK().getOrDefault(2, 0.0);
                double ndcg5 = ge.ndcgByK().getOrDefault(5, 0.0);
                double ndcg10 = ge.ndcgByK().getOrDefault(10, 0.0);
                System.out.println(String.format(Locale.US,
                        "| %s | %.4f | %.4f | %.4f |", hlStr, ndcg2, ndcg5, ndcg10));
            }

            String chosenHl = (tuningM.getHalfLifeDays() <= 0.0) ? "∞" : String.valueOf((int) tuningM.getHalfLifeDays());
            int chosenK = (int) tuningM.getColdStartK();
            var mw = tuningM.getWeights();
            System.out.println(String.format(Locale.US,
                    "Chọn: trọng số thẻ %.2f · màu %.2f · danh mục %.2f · phong cách %.2f · văn bản %.2f · tác giả %.2f · λ %.1f · chu kỳ bán rã %s · k %d · NDCG@10 kiểm định %.4f → %.4f",
                    mw.getTag(), mw.getColor(), mw.getCategory(), mw.getStyle(), mw.getText(), mw.getCreator(),
                    tuningM.getMmrLambda(), chosenHl, chosenK, tuningM.getValidNdcgDefault(), tuningM.getValidNdcgFinal()));
        }

        // 2. Tinh chỉnh B3 trên tập kiểm định
        if (tuningB3 != null && tuningB3.getValidUserCount() > 0) {
            System.out.println("-- Tinh chỉnh B3 trên tập kiểm định --");
            String chosenHl = (tuningB3.getHalfLifeDays() <= 0.0) ? "∞" : String.valueOf((int) tuningB3.getHalfLifeDays());
            int chosenK = (int) tuningB3.getColdStartK();
            System.out.println(String.format(Locale.US,
                    "Chọn: λ %.1f · chu kỳ bán rã %s · k %d · NDCG@10 kiểm định %.4f → %.4f",
                    tuningB3.getMmrLambda(), chosenHl, chosenK, tuningB3.getValidNdcgDefault(), tuningB3.getValidNdcgFinal()));
            System.out.println();
        }

        // 3. So sánh với baseline (K = printK)
        List<String> baselineAlgos = List.of("random", "popular", "popular-dd", "cbf-tag", "cbf-full");
        Map<String, RecEvalRun> standardRuns = new HashMap<>();
        for (RecEvalRun r : runs) {
            if ("standard".equals(r.getScenario())) {
                standardRuns.put(r.getAlgorithm(), r);
            }
        }

        boolean hasBaseline = baselineAlgos.stream().anyMatch(standardRuns::containsKey);
        if (hasBaseline) {
            System.out.println(String.format("-- So sánh với baseline (K = %d) --", printK));
            System.out.println(String.format("| Thuật toán | P@%d | R@%d | NDCG@%d | HitRate@%d | ILD@%d | Phong cách / %d | Coverage@%d | Novelty@%d |",
                    printK, printK, printK, printK, printK, printK, printK, printK));
            System.out.println("|---|---|---|---|---|---|---|---|---|");

            for (String algo : baselineAlgos) {
                RecEvalRun r = standardRuns.get(algo);
                if (r == null) continue;
                String label = BASELINE_LABELS.getOrDefault(algo, algo);
                Map<String, Double> m = r.getMetrics() != null ? r.getMetrics().get(kKey) : null;
                double pVal = m != null ? m.getOrDefault("precision", 0.0) : 0.0;
                double rVal = m != null ? m.getOrDefault("recall", 0.0) : 0.0;
                double ndcgVal = m != null ? m.getOrDefault("ndcg", 0.0) : 0.0;
                double hitVal = m != null ? m.getOrDefault("hitRate", 0.0) : 0.0;
                double ildVal = m != null ? m.getOrDefault("ild", 0.0) : 0.0;
                double stylesVal = m != null ? m.getOrDefault("styles", 0.0) : 0.0;
                double covVal = m != null ? m.getOrDefault("coverage", 0.0) : 0.0;
                double novVal = m != null ? m.getOrDefault("novelty", 0.0) : 0.0;

                System.out.println(String.format(Locale.US,
                        "| %s | %.4f | %.4f | %.4f | %.4f | %.4f | %.2f | %.4f | %.2f |",
                        label, pVal, rVal, ndcgVal, hitVal, ildVal, stylesVal, covVal, novVal));
            }
            System.out.println();
        }

        // 4. Bỏ bớt thành phần (K = printK)
        List<String> ablationAlgos = List.of(
                "cbf-full", "m-mau", "m-the", "m-giam", "m-mmr", "m-kb", "m-tron", "m-mac-dinh"
        );
        boolean hasAblation = ablationAlgos.stream().anyMatch(standardRuns::containsKey);
        if (hasAblation) {
            System.out.println(String.format("-- Bỏ bớt thành phần (K = %d) --", printK));
            System.out.println(String.format("| Biến thể | NDCG@%d | Thay đổi so với M | ILD@%d |", printK, printK));
            System.out.println("|---|---|---|---|");

            RecEvalRun mRun = standardRuns.get("cbf-full");
            double mNdcg = (mRun != null && mRun.getMetrics() != null && mRun.getMetrics().get(kKey) != null)
                    ? mRun.getMetrics().get(kKey).getOrDefault("ndcg", 0.0)
                    : 0.0;

            for (String algo : ablationAlgos) {
                RecEvalRun r = standardRuns.get(algo);
                if (r == null) continue;
                String label = ABLATION_LABELS.getOrDefault(algo, algo);
                Map<String, Double> m = r.getMetrics() != null ? r.getMetrics().get(kKey) : null;
                double ndcgVal = m != null ? m.getOrDefault("ndcg", 0.0) : 0.0;
                double ildVal = m != null ? m.getOrDefault("ild", 0.0) : 0.0;

                String changeStr;
                if ("cbf-full".equals(algo)) {
                    changeStr = "—";
                } else if (mNdcg <= 0.0) {
                    changeStr = "—";
                } else {
                    double pct = (ndcgVal - mNdcg) / mNdcg * 100.0;
                    changeStr = String.format(Locale.US, "%+.1f%%", pct);
                }

                System.out.println(String.format(Locale.US,
                        "| %s | %.4f | %s | %.4f |", label, ndcgVal, changeStr, ildVal));
            }
            System.out.println();
        }

        // 5. Người mới: NDCG@printK theo số sự kiện n
        Map<String, RecEvalRun> coldRuns = new HashMap<>();
        int coldUserCount = 0;
        for (RecEvalRun r : runs) {
            if (r.getScenario() != null && r.getScenario().startsWith("cold-user-")) {
                coldRuns.put(r.getScenario() + ":" + r.getAlgorithm(), r);
                coldUserCount = r.getUserCount();
            }
        }

        if (!coldRuns.isEmpty()) {
            List<Integer> nVals = p.getColdUserEvents().stream().distinct().sorted().toList();
            System.out.println(String.format("-- Người mới: NDCG@%d theo số sự kiện n (%d người có khai báo) --",
                    printK, coldUserCount));

            StringBuilder header = new StringBuilder("| Thuật toán |");
            StringBuilder sep = new StringBuilder("|---|");
            for (int n : nVals) {
                header.append(String.format(" n = %d |", n));
                sep.append("---|");
            }
            System.out.println(header);
            System.out.println(sep);

            List<String> coldAlgos = List.of("popular", "cbf-tag", "cbf-full", "m-kb");
            for (String algo : coldAlgos) {
                String label = COLD_LABELS.getOrDefault(algo, algo);
                StringBuilder row = new StringBuilder(String.format("| %s |", label));
                for (int n : nVals) {
                    RecEvalRun cr = coldRuns.get("cold-user-" + n + ":" + algo);
                    double ndcgVal = 0.0;
                    if (cr != null && cr.getMetrics() != null && cr.getMetrics().get(kKey) != null) {
                        ndcgVal = cr.getMetrics().get(kKey).getOrDefault("ndcg", 0.0);
                    }
                    row.append(String.format(Locale.US, " %.4f |", ndcgVal));
                }
                System.out.println(row);
            }
            System.out.println();
        }

        // 6. LUT mới
        if (hasBaseline) {
            int newLutUserCount = 0;
            for (RecEvalRun r : runs) {
                if ("standard".equals(r.getScenario()) && r.getParams() != null && r.getParams().containsKey("newLutUserCount")) {
                    Object countObj = r.getParams().get("newLutUserCount");
                    if (countObj instanceof Number n) {
                        newLutUserCount = n.intValue();
                        break;
                    }
                }
            }

            System.out.println(String.format("-- LUT mới: xuất bản trong %d ngày trước t0 (%d người có LUT mới liên quan) --",
                    p.getNewLutDays(), newLutUserCount));
            System.out.println(String.format("| Thuật toán | Tỉ lệ danh sách có LUT mới | Recall@%d trên LUT mới |", printK));
            System.out.println("|---|---|---|");

            for (String algo : baselineAlgos) {
                RecEvalRun r = standardRuns.get(algo);
                if (r == null) continue;
                String label = BASELINE_LABELS.getOrDefault(algo, algo);
                Map<String, Double> m = r.getMetrics() != null ? r.getMetrics().get(kKey) : null;
                double newHit = m != null ? m.getOrDefault("newLutHit", 0.0) : 0.0;
                double newRec = m != null ? m.getOrDefault("newLutRecall", 0.0) : 0.0;

                System.out.println(String.format(Locale.US,
                        "| %s | %.4f | %.4f |", label, newHit, newRec));
            }
        }
    }
}
