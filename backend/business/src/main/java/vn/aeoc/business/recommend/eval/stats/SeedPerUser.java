package vn.aeoc.business.recommend.eval.stats;

import java.util.Map;

public class SeedPerUser {
    private final long seed;
    private final int[] userIds;
    private final Map<String, int[]> userIdsByAlgorithm;
    private final Map<String, double[]> ndcgByAlgorithm;
    private final int k;

    public SeedPerUser(long seed, int[] userIds, Map<String, double[]> ndcgByAlgorithm, int k) {
        this.seed = seed;
        this.userIds = userIds;
        this.userIdsByAlgorithm = null;
        this.ndcgByAlgorithm = ndcgByAlgorithm;
        this.k = k;
    }

    public SeedPerUser(long seed, Map<String, int[]> userIdsByAlgorithm, Map<String, double[]> ndcgByAlgorithm, int k) {
        this.seed = seed;
        this.userIds = (userIdsByAlgorithm != null && !userIdsByAlgorithm.isEmpty())
                ? userIdsByAlgorithm.values().iterator().next()
                : new int[0];
        this.userIdsByAlgorithm = userIdsByAlgorithm;
        this.ndcgByAlgorithm = ndcgByAlgorithm;
        this.k = k;
    }

    public long seed() { return seed; }
    public int[] userIds() { return userIds; }
    public Map<String, int[]> userIdsByAlgorithm() { return userIdsByAlgorithm; }
    public Map<String, double[]> ndcgByAlgorithm() { return ndcgByAlgorithm; }
    public int k() { return k; }
}
