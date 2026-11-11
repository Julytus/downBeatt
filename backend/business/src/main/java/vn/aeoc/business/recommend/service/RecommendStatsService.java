package vn.aeoc.business.recommend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.download.repository.DownloadLogRepository;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.repository.RecImpressionRepository;
import vn.aeoc.business.recommend.repository.UserEventRepository;
import vn.aeoc.business.recommend.stats.DownloadRow;
import vn.aeoc.business.recommend.stats.EventRow;
import vn.aeoc.business.recommend.stats.ImpressionRow;
import vn.aeoc.business.recommend.stats.StatsCalculator;
import vn.aeoc.entity.data.mysql.recommend.RecImpression;
import vn.aeoc.entity.data.mysql.recommend.RecommendStats;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class RecommendStatsService extends BaseService<RecImpressionRepository, RecImpression, Long> {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter STRICT_FORMATTER = DateTimeFormatter.ofPattern("uuuu-MM-dd")
            .withResolverStyle(ResolverStyle.STRICT);

    private final UserEventRepository userEventRepository;
    private final DownloadLogRepository downloadLogRepository;
    private final RecommendProperties properties;
    private final Clock clock;

    @Autowired
    public RecommendStatsService(RecImpressionRepository repository,
                                 UserEventRepository userEventRepository,
                                 DownloadLogRepository downloadLogRepository,
                                 RecommendProperties properties,
                                 QueryExecutor queryExecutor) {
        this(repository, userEventRepository, downloadLogRepository, properties, Clock.system(DEFAULT_ZONE), queryExecutor);
    }

    public RecommendStatsService(RecImpressionRepository repository,
                                 UserEventRepository userEventRepository,
                                 DownloadLogRepository downloadLogRepository,
                                 RecommendProperties properties,
                                 Clock clock,
                                 QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.userEventRepository = userEventRepository;
        this.downloadLogRepository = downloadLogRepository;
        this.properties = properties != null ? properties : new RecommendProperties();
        this.clock = clock;
    }

    public RecommendStats stats(String from, String to) {
        LocalDate toDate;
        if (to == null || to.isBlank()) {
            toDate = LocalDate.now(clock);
        } else {
            try {
                toDate = LocalDate.parse(to.trim(), STRICT_FORMATTER);
            } catch (DateTimeParseException e) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Ngày không hợp lệ");
            }
        }

        LocalDate fromDate;
        if (from == null || from.isBlank()) {
            fromDate = toDate.minusDays(29);
        } else {
            try {
                fromDate = LocalDate.parse(from.trim(), STRICT_FORMATTER);
            } catch (DateTimeParseException e) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Ngày không hợp lệ");
            }
        }

        if (fromDate.isAfter(toDate)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
        }

        long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
        int maxDays = properties.getStatsMaxDays() > 0 ? properties.getStatsMaxDays() : 366;
        if (days > maxDays) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Khoảng thời gian tối đa 366 ngày");
        }

        LocalDateTime fromDateTime = fromDate.atStartOfDay();
        LocalDateTime toExclusive = toDate.plusDays(1).atStartOfDay();

        int windowMinutes = properties.getStatsDownloadWindowMinutes() > 0 ? properties.getStatsDownloadWindowMinutes() : 30;

        List<ImpressionRow> impressions = repository.listForStats(fromDateTime, toExclusive);
        if (impressions == null || impressions.isEmpty()) {
            RecommendStats emptyStats = StatsCalculator.compute(List.of(), List.of(), List.of(), windowMinutes);
            emptyStats.setFrom(fromDate.toString());
            emptyStats.setTo(toDate.toString());
            return emptyStats;
        }

        List<Long> impressionIds = impressions.stream().map(ImpressionRow::id).toList();
        List<EventRow> events = userEventRepository.listByImpressionIds(impressionIds);

        List<DownloadRow> downloads = List.of();
        if (events != null && !events.isEmpty()) {
            Set<Integer> userIds = new HashSet<>();
            LocalDateTime minClickTime = null;
            LocalDateTime maxClickTime = null;

            for (EventRow ev : events) {
                if ("VIEW".equalsIgnoreCase(ev.type()) && ev.userId() != null) {
                    userIds.add(ev.userId());
                    if (minClickTime == null || ev.time().isBefore(minClickTime)) {
                        minClickTime = ev.time();
                    }
                    if (maxClickTime == null || ev.time().isAfter(maxClickTime)) {
                        maxClickTime = ev.time();
                    }
                }
            }

            if (!userIds.isEmpty() && minClickTime != null && maxClickTime != null) {
                LocalDateTime dlTo = maxClickTime.plusMinutes(windowMinutes);
                downloads = downloadLogRepository.listForStats(new ArrayList<>(userIds), minClickTime.minusSeconds(StatsCalculator.CLOCK_SKEW_SECONDS), dlTo);
            }
        }

        RecommendStats stats = StatsCalculator.compute(impressions, events, downloads, windowMinutes);
        stats.setFrom(fromDate.toString());
        stats.setTo(toDate.toString());
        return stats;
    }
}
