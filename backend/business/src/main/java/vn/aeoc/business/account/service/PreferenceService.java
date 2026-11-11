package vn.aeoc.business.account.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.account.event.UserSignalChangedEvent;
import vn.aeoc.business.account.repository.UserPreferenceRepository;
import vn.aeoc.business.lut.service.LutCategoryService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.entity.data.mysql.account.UserPreference;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;

@Service
public class PreferenceService extends BaseService<UserPreferenceRepository, UserPreference, Integer> {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final LutCategoryService lutCategoryService;
    private final RecommendProperties properties;
    private final ApplicationEventPublisher publisher;
    private final Clock clock;

    @Autowired
    public PreferenceService(UserPreferenceRepository repository,
                             LutCategoryService lutCategoryService,
                             RecommendProperties properties,
                             ApplicationEventPublisher publisher,
                             QueryExecutor queryExecutor) {
        this(repository, lutCategoryService, properties, publisher, Clock.system(DEFAULT_ZONE), queryExecutor);
    }

    public PreferenceService(UserPreferenceRepository repository,
                             LutCategoryService lutCategoryService,
                             RecommendProperties properties,
                             ApplicationEventPublisher publisher,
                             Clock clock,
                             QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutCategoryService = lutCategoryService;
        this.properties = properties;
        this.publisher = publisher;
        this.clock = clock;
    }

    public UserPreference get(Integer userId) {
        return new UserPreference(slugs(userId));
    }

    public List<String> slugs(Integer userId) {
        if (userId == null || userId <= 0) {
            return List.of();
        }
        return repository.slugsByUser(userId);
    }

    @Transactional
    public UserPreference save(Integer userId, UserPreference request) {
        return save(userId, request, LocalDateTime.now(clock));
    }

    @Transactional
    public UserPreference save(Integer userId, UserPreference request, LocalDateTime now) {
        if (request == null || request.getCategorySlugs() == null) {
            throw new AppException(ErrorCode.PREFERENCE_INVALID);
        }

        List<String> cleanedSlugs = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String s : request.getCategorySlugs()) {
            if (s != null) {
                String trimmed = s.trim().toLowerCase(Locale.ROOT);
                if (!trimmed.isEmpty() && seen.add(trimmed)) {
                    cleanedSlugs.add(trimmed);
                }
            }
        }

        int max = properties != null ? properties.getPreferenceMax() : 12;
        if (cleanedSlugs.size() > max) {
            throw new AppException(ErrorCode.PREFERENCE_INVALID);
        }

        Map<String, Integer> activeMap = lutCategoryService.activeIdsBySlugs(cleanedSlugs);
        for (String slug : cleanedSlugs) {
            if (!activeMap.containsKey(slug)) {
                throw new AppException(ErrorCode.PREFERENCE_INVALID);
            }
        }

        repository.deleteByUser(userId);
        if (!cleanedSlugs.isEmpty()) {
            List<Integer> categoryIds = cleanedSlugs.stream().map(activeMap::get).toList();
            repository.insertAll(userId, categoryIds, now);
        }

        publisher.publishEvent(new UserSignalChangedEvent(userId, "lưu sở thích"));
        return new UserPreference(repository.slugsByUser(userId));
    }
}
