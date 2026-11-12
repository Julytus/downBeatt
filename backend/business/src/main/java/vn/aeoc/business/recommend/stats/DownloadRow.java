package vn.aeoc.business.recommend.stats;

import java.time.LocalDateTime;

public record DownloadRow(int userId, int lutId, LocalDateTime time) {
}
