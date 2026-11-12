package vn.aeoc.business.recommend.eval.metric;

public record EvalMetricSet(
        double precision,
        double recall,
        double ndcg,
        double hitRate,
        double ild,
        double styles,
        double coverage,
        double novelty,
        double newLutHit,
        double newLutRecall
) {
    public EvalMetricSet(
            double precision,
            double recall,
            double ndcg,
            double hitRate,
            double ild,
            double styles,
            double coverage,
            double novelty
    ) {
        this(precision, recall, ndcg, hitRate, ild, styles, coverage, novelty, 0.0, 0.0);
    }
}
