package vn.aeoc.business.recommend.eval.sim;

import java.time.LocalDateTime;

public record SimEvent(
        int userId,
        String type,
        int lutId,
        LocalDateTime time,
        int order
) {}
