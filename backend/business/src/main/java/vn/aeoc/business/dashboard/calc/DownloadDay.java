package vn.aeoc.business.dashboard.calc;

import java.time.LocalDate;

public record DownloadDay(LocalDate day, long downloads, long premium) {
}
