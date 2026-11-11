package vn.aeoc.business.recommend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.account.event.UserSignalChangedEvent;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.repository.UserEventRepository;
import vn.aeoc.entity.data.mysql.recommend.UserEvent;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.text.Normalizer;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class EventService extends BaseService<UserEventRepository, UserEvent, Long> {

    private static final Logger log = LoggerFactory.getLogger(EventService.class);
    private static final Pattern UUID_PATTERN = Pattern.compile("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final LutService lutService;
    private final RecommendProperties properties;
    private final ApplicationEventPublisher publisher;
    private final Clock clock;

    @Autowired
    public EventService(UserEventRepository repository,
                        LutService lutService,
                        RecommendProperties properties,
                        ApplicationEventPublisher publisher,
                        QueryExecutor queryExecutor) {
        this(repository, lutService, properties, publisher, Clock.system(DEFAULT_ZONE), queryExecutor);
    }

    public EventService(UserEventRepository repository,
                        LutService lutService,
                        RecommendProperties properties,
                        ApplicationEventPublisher publisher,
                        Clock clock,
                        QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutService = lutService;
        this.properties = properties;
        this.publisher = publisher;
        this.clock = clock;
    }

    public static boolean isValidUuid(String id) {
        return id != null && UUID_PATTERN.matcher(id.trim()).matches();
    }

    public boolean record(Integer userId, UserEvent body) {
        return record(userId, body, LocalDateTime.now(clock));
    }

    public boolean record(Integer userId, UserEvent body, LocalDateTime now) {
        if (body == null) {
            return false;
        }

        // 1. Danh tính
        Integer actualUserId;
        String actualAnonId;
        if (userId != null && userId > 0) {
            actualUserId = userId;
            actualAnonId = isValidUuid(body.getAnonId()) ? body.getAnonId().trim().toLowerCase(Locale.ROOT) : null;
        } else {
            actualUserId = null;
            if (!isValidUuid(body.getAnonId())) {
                return false;
            }
            actualAnonId = body.getAnonId().trim().toLowerCase(Locale.ROOT);
        }

        // 2. Type
        String type = body.getEventType();
        if (type == null) {
            return false;
        }
        if (!type.equals("VIEW") && !type.equals("PREVIEW") && !type.equals("SEARCH") && !type.equals("FILTER_STYLE")) {
            return false;
        }

        // 3, 4, 5. Field checks
        Integer finalLutId = null;
        String finalValue = null;

        if ("VIEW".equals(type) || "PREVIEW".equals(type)) {
            if (body.getLutId() == null || !lutService.isPublished(body.getLutId())) {
                return false;
            }
            finalLutId = body.getLutId();
        } else if ("SEARCH".equals(type)) {
            if (body.getValue() == null) {
                return false;
            }
            String nfc = Normalizer.normalize(body.getValue(), Normalizer.Form.NFC);
            String trimmed = nfc.toLowerCase(Locale.ROOT).trim();
            String collapsed = trimmed.replaceAll("\\s+", " ");
            if (collapsed.length() > 100) {
                collapsed = collapsed.substring(0, 100).trim();
            }
            if (collapsed.isEmpty()) {
                return false;
            }
            finalValue = collapsed;
        } else { // FILTER_STYLE
            if (body.getValue() == null) {
                return false;
            }
            String style = body.getValue().trim().toLowerCase(Locale.ROOT);
            if (style.isEmpty() || !lutService.existsPublishedStyle(style)) {
                return false;
            }
            finalValue = style;
        }

        // 6. Impression ID
        Long impressionId = (body.getImpressionId() != null && body.getImpressionId() > 0) ? body.getImpressionId() : null;

        // 7. Dedup
        boolean skipDedup = "VIEW".equals(type) && impressionId != null && impressionId > 0;
        if (!skipDedup) {
            int dedupMinutes = properties != null ? properties.getEventDedupMinutes() : 30;
            LocalDateTime since = now.minusMinutes(dedupMinutes);
            if (repository.existsRecent(actualUserId, actualAnonId, type, finalLutId, finalValue, since)) {
                return false;
            }
        }

        // 8. INSERT
        UserEvent toInsert = new UserEvent();
        toInsert.setId(null);
        toInsert.setUserId(actualUserId);
        toInsert.setAnonId(actualAnonId);
        toInsert.setEventType(type);
        toInsert.setLutId(finalLutId);
        toInsert.setValue(finalValue);
        toInsert.setImpressionId(impressionId);
        toInsert.setCreatedTime(now);
        repository.insert(toInsert);
        return true;
    }

    @Transactional
    public boolean dismiss(Integer userId, UserEvent body) {
        return dismiss(userId, body, LocalDateTime.now(clock));
    }

    @Transactional
    public boolean dismiss(Integer userId, UserEvent body, LocalDateTime now) {
        if (body == null || body.getLutId() == null || !lutService.isPublished(body.getLutId())) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
        }
        if (userId == null || userId <= 0) {
            return false;
        }
        if (repository.existsDismiss(userId, body.getLutId())) {
            return false;
        }

        Long impressionId = (body.getImpressionId() != null && body.getImpressionId() > 0)
                ? body.getImpressionId()
                : null;

        UserEvent event = new UserEvent();
        event.setId(null);
        event.setUserId(userId);
        event.setAnonId(null);
        event.setEventType("DISMISS");
        event.setLutId(body.getLutId());
        event.setValue(null);
        event.setImpressionId(impressionId);
        event.setCreatedTime(now);
        repository.insert(event);

        publisher.publishEvent(new UserSignalChangedEvent(userId, null, "không quan tâm"));
        return true;
    }

    @Transactional
    public int mergeAnon(Integer userId, String anonId) {
        if (userId == null || userId <= 0 || !isValidUuid(anonId)) {
            return 0;
        }
        String cleanAnon = anonId.trim().toLowerCase(Locale.ROOT);
        int count = repository.mergeAnon(userId, cleanAnon);
        publisher.publishEvent(new UserSignalChangedEvent(userId, cleanAnon, "gộp phiên"));
        return count;
    }

    @Transactional
    public int clearHistory(Integer userId, String anonId) {
        if (userId == null || userId <= 0) {
            return 0;
        }
        int count = repository.deleteByUser(userId);
        String cleanAnon = null;
        if (isValidUuid(anonId)) {
            cleanAnon = anonId.trim().toLowerCase(Locale.ROOT);
            count += repository.deleteAnon(cleanAnon);
        }
        publisher.publishEvent(new UserSignalChangedEvent(userId, cleanAnon, "xoá lịch sử"));
        return count;
    }

    @Scheduled(cron = "${recommend.event-cleanup-cron:0 30 0 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void scheduledCleanup() {
        cleanup(LocalDateTime.now(clock));
    }

    public int cleanup(LocalDateTime now) {
        int historyDays = properties != null ? properties.getHistoryDays() : 180;
        LocalDateTime cutoff = now.minusDays(historyDays);
        int deleted = repository.deleteOlderThan(cutoff);
        log.info("Đã dọn dẹp {} sự kiện cũ hơn {} ngày", deleted, historyDays);
        return deleted;
    }

    public List<UserSignal> signalsByUser(Integer userId, LocalDateTime since) {
        if (userId == null || userId <= 0) {
            return List.of();
        }
        return repository.signalsByUser(userId, since);
    }

    public List<UserSignal> signalsByAnon(String anonId, LocalDateTime since) {
        if (!isValidUuid(anonId)) {
            return List.of();
        }
        return repository.signalsByAnon(anonId.trim().toLowerCase(Locale.ROOT), since);
    }
}
