package vn.aeoc.business.recommend.stats;

import vn.aeoc.entity.data.mysql.recommend.PositionStat;
import vn.aeoc.entity.data.mysql.recommend.RecommendStats;
import vn.aeoc.entity.data.mysql.recommend.StatsRow;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public final class StatsCalculator {

    // DATETIME chỉ tới giây, hai đường ghi làm tròn khác nhau nên lượt tải có thể ghi sớm hơn lượt bấm tối đa 1 giây.
    public static final int CLOCK_SKEW_SECONDS = 2;

    private StatsCalculator() {
    }

    public static RecommendStats compute(List<ImpressionRow> impressions,
                                         List<EventRow> events,
                                         List<DownloadRow> downloads,
                                         int windowMinutes) {
        if (impressions == null || impressions.isEmpty()) {
            StatsRow emptySummary = StatsRow.builder()
                    .impressions(0L)
                    .clicked(0L)
                    .ctr(0.0)
                    .downloaded(0L)
                    .downloadRate(0.0)
                    .dismissals(0L)
                    .dismissRate(0.0)
                    .build();
            return RecommendStats.builder()
                    .summary(emptySummary)
                    .byVariant(List.of())
                    .byPosition(List.of())
                    .build();
        }

        Map<Long, ImpressionRow> impressionMap = new HashMap<>();
        for (ImpressionRow imp : impressions) {
            impressionMap.put(imp.id(), imp);
        }

        Map<Long, Set<Integer>> clickedLutsByImpression = new HashMap<>();
        Map<Long, List<EventRow>> validViewEventsByImpression = new HashMap<>();
        Map<Long, Long> dismissalsByImpression = new HashMap<>();
        Map<Integer, Long> clicksByPosition = new HashMap<>();

        if (events != null) {
            for (EventRow ev : events) {
                ImpressionRow imp = impressionMap.get(ev.impressionId());
                if (imp == null) {
                    continue;
                }

                if ("DISMISS".equalsIgnoreCase(ev.type())) {
                    dismissalsByImpression.merge(ev.impressionId(), 1L, Long::sum);
                } else if ("VIEW".equalsIgnoreCase(ev.type())) {
                    List<Integer> lutIds = imp.lutIds();
                    if (lutIds != null && lutIds.contains(ev.lutId())) {
                        Set<Integer> clicked = clickedLutsByImpression.computeIfAbsent(ev.impressionId(), k -> new HashSet<>());
                        boolean firstTime = clicked.add(ev.lutId());
                        if (firstTime) {
                            int position = lutIds.indexOf(ev.lutId()) + 1;
                            clicksByPosition.merge(position, 1L, Long::sum);
                        }
                        validViewEventsByImpression.computeIfAbsent(ev.impressionId(), k -> new ArrayList<>()).add(ev);
                    }
                }
            }
        }

        Set<Long> downloadedImpressions = new HashSet<>();
        if (downloads != null && !downloads.isEmpty()) {
            for (Map.Entry<Long, List<EventRow>> entry : validViewEventsByImpression.entrySet()) {
                long impId = entry.getKey();
                for (EventRow viewEv : entry.getValue()) {
                    if (viewEv.userId() == null) {
                        continue;
                    }
                    boolean matched = downloads.stream().anyMatch(d ->
                            d.userId() == viewEv.userId()
                                    && d.lutId() == viewEv.lutId()
                                    && !d.time().isBefore(viewEv.time().minusSeconds(CLOCK_SKEW_SECONDS))
                                    && !d.time().isAfter(viewEv.time().plusMinutes(windowMinutes))
                    );
                    if (matched) {
                        downloadedImpressions.add(impId);
                        break;
                    }
                }
            }
        }

        long totalImpressions = impressions.size();
        long totalClicked = impressions.stream().filter(imp -> clickedLutsByImpression.containsKey(imp.id())).count();
        long totalDownloaded = impressions.stream().filter(imp -> downloadedImpressions.contains(imp.id())).count();
        long totalDismissals = impressions.stream().mapToLong(imp -> dismissalsByImpression.getOrDefault(imp.id(), 0L)).sum();

        StatsRow summary = StatsRow.builder()
                .impressions(totalImpressions)
                .clicked(totalClicked)
                .ctr(rate(totalClicked, totalImpressions))
                .downloaded(totalDownloaded)
                .downloadRate(rate(totalDownloaded, totalImpressions))
                .dismissals(totalDismissals)
                .dismissRate(rate(totalDismissals, totalImpressions))
                .build();

        record VariantKey(String variant, String strategy) {}
        Map<VariantKey, List<ImpressionRow>> grouped = new LinkedHashMap<>();
        for (ImpressionRow imp : impressions) {
            grouped.computeIfAbsent(new VariantKey(imp.variant(), imp.strategy()), k -> new ArrayList<>()).add(imp);
        }

        List<StatsRow> byVariant = new ArrayList<>();
        for (Map.Entry<VariantKey, List<ImpressionRow>> entry : grouped.entrySet()) {
            VariantKey key = entry.getKey();
            List<ImpressionRow> groupList = entry.getValue();
            long groupImpCount = groupList.size();
            long groupClicked = groupList.stream().filter(imp -> clickedLutsByImpression.containsKey(imp.id())).count();
            long groupDownloaded = groupList.stream().filter(imp -> downloadedImpressions.contains(imp.id())).count();
            long groupDismissals = groupList.stream().mapToLong(imp -> dismissalsByImpression.getOrDefault(imp.id(), 0L)).sum();

            byVariant.add(StatsRow.builder()
                    .variant(key.variant())
                    .strategy(key.strategy())
                    .impressions(groupImpCount)
                    .clicked(groupClicked)
                    .ctr(rate(groupClicked, groupImpCount))
                    .downloaded(groupDownloaded)
                    .downloadRate(rate(groupDownloaded, groupImpCount))
                    .dismissals(groupDismissals)
                    .dismissRate(rate(groupDismissals, groupImpCount))
                    .build());
        }

        byVariant.sort(Comparator
                .comparing((StatsRow r) -> r.getVariant() != null ? r.getVariant() : "")
                .thenComparingInt(r -> strategyOrder(r.getStrategy()))
        );

        int maxLen = impressions.stream()
                .mapToInt(imp -> imp.lutIds() != null ? imp.lutIds().size() : 0)
                .max()
                .orElse(0);

        List<PositionStat> byPosition = new ArrayList<>();
        for (int k = 1; k <= maxLen; k++) {
            final int pos = k;
            long posImpressions = impressions.stream()
                    .filter(imp -> imp.lutIds() != null && imp.lutIds().size() >= pos)
                    .count();
            if (posImpressions > 0) {
                long posClicks = clicksByPosition.getOrDefault(pos, 0L);
                byPosition.add(PositionStat.builder()
                        .position(pos)
                        .impressions(posImpressions)
                        .clicks(posClicks)
                        .ctr(rate(posClicks, posImpressions))
                        .build());
            }
        }

        return RecommendStats.builder()
                .summary(summary)
                .byVariant(byVariant)
                .byPosition(byPosition)
                .build();
    }

    private static int strategyOrder(String strategy) {
        if (strategy == null) return 99;
        return switch (strategy.toUpperCase(Locale.ROOT)) {
            case "PROFILE" -> 0;
            case "PREFERENCE" -> 1;
            case "POPULAR" -> 2;
            default -> 3;
        };
    }

    private static double rate(long numerator, long denominator) {
        if (denominator <= 0) {
            return 0.0;
        }
        return round4((double) numerator / (double) denominator);
    }

    public static double round4(double val) {
        if (Double.isNaN(val) || Double.isInfinite(val)) {
            return 0.0;
        }
        return BigDecimal.valueOf(val).setScale(4, RoundingMode.HALF_UP).doubleValue();
    }
}
