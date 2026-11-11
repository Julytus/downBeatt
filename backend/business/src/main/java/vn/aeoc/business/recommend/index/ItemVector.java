package vn.aeoc.business.recommend.index;

import java.time.LocalDateTime;
import java.util.Map;

public record ItemVector(
        int id,
        String style,
        Integer creatorId,
        boolean premium,
        int downloadCount,
        LocalDateTime publishedTime,
        Map<String, Double> tag,
        Map<String, Double> category,
        Map<String, Double> text,
        double[] color
) {
}
