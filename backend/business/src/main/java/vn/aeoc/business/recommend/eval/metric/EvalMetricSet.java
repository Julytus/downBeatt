package vn.aeoc.business.recommend.eval.metric;

public record EvalMetricSet(
        double precision,
        double recall,
        double ndcg,
        double hitRate,
        double ild,
        double styles,
        double coverage,
        double novelty
) {}
