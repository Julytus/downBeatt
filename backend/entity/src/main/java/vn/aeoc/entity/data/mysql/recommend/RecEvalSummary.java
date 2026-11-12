package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecEvalSummary {
    private String batchCode;
    private String dataset;
    private List<Long> seeds;
    private Integer lutCount;
    private Integer simUserCount;

    @com.fasterxml.jackson.annotation.JsonProperty("kValues")
    private List<Integer> kValues;

    private Integer newLutDays;
    private List<ScenarioSummary> scenarios;
    private List<RecEvalTest> tests;

    @com.fasterxml.jackson.annotation.JsonProperty("kValues")
    public List<Integer> getKValues() {
        return kValues;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("kValues")
    public void setKValues(List<Integer> kValues) {
        this.kValues = kValues;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ScenarioSummary {
        private String scenario;
        private List<Integer> userCounts;
        private List<AlgorithmSummary> rows;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AlgorithmSummary {
        private String algorithm;
        private Integer seedCount;
        private Map<String, Map<String, MetricStat>> metrics;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MetricStat {
        private Double mean;
        private Double std;
    }
}
