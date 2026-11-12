package vn.aeoc.business.recommend.eval;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import vn.aeoc.business.recommend.service.RecEvalRunService;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Component
@Profile("eval")
public class EvalCommand implements ApplicationRunner {

    private static final Map<String, String> LABELS = Map.of(
            "random", "B1 Ngẫu nhiên",
            "popular", "B2 Phổ biến",
            "popular-dd", "B2-dd Phổ biến xen kẽ",
            "cbf-tag", "B3 CBF chỉ thẻ",
            "cbf-full", "M CBF đủ đặc trưng"
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
                List<RecEvalRun> runsForSeed = evalRunner.run(seed, evalProperties, batchCode);
                allRuns.addAll(runsForSeed);
                long seedElapsed = System.currentTimeMillis() - seedStart;

                printTable(runsForSeed, seed, batchCode, evalProperties, seedElapsed);
            }

            recEvalRunService.saveBatch(allRuns);
            System.exit(SpringApplication.exit(applicationContext, () -> 0));
        } catch (Throwable t) {
            t.printStackTrace();
            int exitCode = 1;
            System.exit(SpringApplication.exit(applicationContext, () -> exitCode));
        }
    }

    private void printTable(List<RecEvalRun> runsForSeed, long seed, String batchCode, EvalProperties p, long seedElapsed) {
        System.out.println(String.format("== Đánh giá gợi ý · lô %s · %s · hạt giống %d ==", batchCode, p.getDataset(), seed));
        int calculatedUsers = runsForSeed.isEmpty() ? 0 : runsForSeed.get(0).getUserCount();
        double elapsedSec = seedElapsed / 1000.0;
        System.out.println(String.format(Locale.US, "%d LUT · %d người mô phỏng · %d người được tính · %.1f giây",
                p.getLuts(), p.getUsers(), calculatedUsers, elapsedSec));

        int printK = p.getKValues().contains(10) ? 10 : p.getKValues().stream().max(Integer::compareTo).orElse(10);
        String kKey = String.valueOf(printK);

        System.out.println(String.format("| Thuật toán | P@%d | R@%d | NDCG@%d | HitRate@%d | ILD@%d | Phong cách / %d | Coverage@%d | Novelty@%d |",
                printK, printK, printK, printK, printK, printK, printK, printK));
        System.out.println("|---|---|---|---|---|---|---|---|---|");

        for (RecEvalRun run : runsForSeed) {
            String label = LABELS.getOrDefault(run.getAlgorithm(), run.getAlgorithm());
            Map<String, Double> m = run.getMetrics() != null ? run.getMetrics().get(kKey) : null;
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
    }
}
