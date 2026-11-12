package vn.aeoc.business.recommend.eval;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.*;

@Data
@Component
@ConfigurationProperties(prefix = "eval")
public class EvalProperties {

    public static final Set<String> ALLOWED_ALGORITHMS = Set.of(
            "random", "popular", "popular-dd", "cbf-tag", "cbf-full"
    );

    private List<Long> seeds = new ArrayList<>(List.of(42L));
    private int luts = 300;
    private int users = 500;
    private List<Integer> kValues = new ArrayList<>(List.of(5, 10, 20));
    private List<String> algorithms = new ArrayList<>(List.of(
            "random", "popular", "popular-dd", "cbf-tag", "cbf-full"
    ));
    private int randomRepeats = 20;
    private String phase = "test";
    private String dataset = "D1-sim";

    public Optional<String> validate() {
        if (seeds == null || seeds.isEmpty()) {
            return Optional.of("eval.seeds");
        }
        if (luts < 40 || luts > 2000) {
            return Optional.of("eval.luts");
        }
        if (users < 20 || users > 5000) {
            return Optional.of("eval.users");
        }
        if (kValues == null || kValues.isEmpty()) {
            return Optional.of("eval.k-values");
        }
        for (Integer k : kValues) {
            if (k == null || k < 1 || k > 50) {
                return Optional.of("eval.k-values");
            }
        }
        if (new HashSet<>(kValues).size() != kValues.size()) {
            return Optional.of("eval.k-values");
        }
        if (algorithms == null || algorithms.isEmpty()) {
            return Optional.of("eval.algorithms");
        }
        for (String algo : algorithms) {
            if (algo == null || !ALLOWED_ALGORITHMS.contains(algo.trim())) {
                return Optional.of("eval.algorithms");
            }
        }
        if (randomRepeats < 1 || randomRepeats > 100) {
            return Optional.of("eval.random-repeats");
        }
        if (phase == null || (!"test".equals(phase.trim()) && !"valid".equals(phase.trim()))) {
            return Optional.of("eval.phase");
        }
        if (dataset == null || !"D1-sim".equals(dataset.trim())) {
            return Optional.of("eval.dataset");
        }
        return Optional.empty();
    }
}
