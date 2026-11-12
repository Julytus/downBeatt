package vn.aeoc.business.recommend.eval.tune;

import lombok.Builder;
import lombok.Data;
import vn.aeoc.business.recommend.config.RecommendProperties;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class TuningResult {

    public record WeightReportEntry(
            String label,
            double tag,
            double color,
            double category,
            double style,
            double text,
            double creator,
            double ndcg
    ) {}

    public record LambdaReportEntry(
            double lambda,
            double ndcg,
            double ild,
            boolean passed
    ) {}

    public record GridReportEntry(
            double halfLifeDays,
            Map<Integer, Double> ndcgByK
    ) {}

    private RecommendProperties.Weights weights;
    private double mmrLambda;
    private double halfLifeDays;
    private double coldStartK;

    private int validUserCount;
    private int weightTrials;
    private double validNdcgDefault;
    private double validNdcgWeights;
    private double validNdcgLambda;
    private double validNdcgFinal;
    private double validIldBase;
    private long elapsedMs;

    private Map<String, Object> tuningParams;

    private List<WeightReportEntry> topWeights;
    private WeightReportEntry defaultWeightEntry;
    private List<LambdaReportEntry> lambdaEntries;
    private List<GridReportEntry> gridEntries;
}
