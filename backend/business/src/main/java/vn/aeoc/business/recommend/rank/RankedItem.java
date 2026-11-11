package vn.aeoc.business.recommend.rank;

import java.util.Map;

public record RankedItem(
        int id,
        double score,
        Map<String, Double> contributions,
        boolean premium,
        int downloadCount
) {
}
