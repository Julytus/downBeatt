package vn.aeoc.business.recommend.stats;

import java.time.LocalDateTime;

public record EventRow(long impressionId, String type, Integer userId, int lutId, LocalDateTime time) {
}
