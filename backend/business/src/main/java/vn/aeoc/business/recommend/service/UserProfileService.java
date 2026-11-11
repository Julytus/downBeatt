package vn.aeoc.business.recommend.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.aeoc.business.account.service.PreferenceService;
import vn.aeoc.business.billing.service.OrderService;
import vn.aeoc.business.collection.service.CollectionService;
import vn.aeoc.business.download.service.LutDownloadService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.profile.ProfileBuilder;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.entity.data.mysql.recommend.ProfileTerm;
import vn.aeoc.entity.data.mysql.recommend.RecommendProfile;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class UserProfileService {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final EventService eventService;
    private final CollectionService collectionService;
    private final LutDownloadService downloadService;
    private final OrderService orderService;
    private final PreferenceService preferenceService;
    private final LutIndexService lutIndexService;
    private final RecommendProperties properties;
    private final Clock clock;

    private final Cache<String, UserProfile> cache;

    @Autowired
    public UserProfileService(EventService eventService,
                              CollectionService collectionService,
                              LutDownloadService downloadService,
                              OrderService orderService,
                              PreferenceService preferenceService,
                              LutIndexService lutIndexService,
                              RecommendProperties properties) {
        this(eventService, collectionService, downloadService, orderService, preferenceService, lutIndexService, properties, Clock.system(DEFAULT_ZONE));
    }

    public UserProfileService(EventService eventService,
                              CollectionService collectionService,
                              LutDownloadService downloadService,
                              OrderService orderService,
                              PreferenceService preferenceService,
                              LutIndexService lutIndexService,
                              RecommendProperties properties,
                              Clock clock) {
        this.eventService = eventService;
        this.collectionService = collectionService;
        this.downloadService = downloadService;
        this.orderService = orderService;
        this.preferenceService = preferenceService;
        this.lutIndexService = lutIndexService;
        this.properties = properties;
        this.clock = clock;

        int cacheMinutes = properties != null ? properties.getProfileCacheMinutes() : 5;
        this.cache = Caffeine.newBuilder()
                .expireAfterWrite(cacheMinutes, TimeUnit.MINUTES)
                .maximumSize(10_000)
                .build();
    }

    public UserProfile profileOf(Integer userId, String anonId) {
        LocalDateTime now = LocalDateTime.now(clock);

        if (userId != null && userId > 0) {
            String cacheKey = "u:" + userId;
            UserProfile cached = cache.getIfPresent(cacheKey);
            LutVectorIndex currentIndex = lutIndexService.current();
            if (cached != null && cached.index() == currentIndex) {
                return cached;
            }
            UserProfile fresh = computeUser(userId, now, currentIndex);
            if (!"POPULAR".equalsIgnoreCase(fresh.strategy())) {
                cache.put(cacheKey, fresh);
            }
            return fresh;
        }

        if (EventService.isValidUuid(anonId)) {
            String cleanAnon = anonId.trim().toLowerCase(Locale.ROOT);
            String cacheKey = "a:" + cleanAnon;
            UserProfile cached = cache.getIfPresent(cacheKey);
            LutVectorIndex currentIndex = lutIndexService.current();
            if (cached != null && cached.index() == currentIndex) {
                return cached;
            }
            UserProfile fresh = computeAnon(cleanAnon, now, currentIndex);
            if (!"POPULAR".equalsIgnoreCase(fresh.strategy())) {
                cache.put(cacheKey, fresh);
            }
            return fresh;
        }

        return UserProfile.empty();
    }

    private UserProfile computeUser(Integer userId, LocalDateTime now, LutVectorIndex index) {
        int historyDays = properties != null ? properties.getHistoryDays() : 180;
        LocalDateTime since = now.minusDays(historyDays);

        List<UserSignal> allSignals = new ArrayList<>();
        allSignals.addAll(eventService.signalsByUser(userId, since));
        allSignals.addAll(collectionService.favoriteSignals(userId, since));
        allSignals.addAll(downloadService.downloadSignals(userId, since));
        allSignals.addAll(orderService.purchaseSignals(userId, since));

        List<String> prefs = preferenceService.slugs(userId);
        return ProfileBuilder.build(index, allSignals, prefs, now, properties);
    }

    private UserProfile computeAnon(String anonId, LocalDateTime now, LutVectorIndex index) {
        int historyDays = properties != null ? properties.getHistoryDays() : 180;
        LocalDateTime since = now.minusDays(historyDays);

        List<UserSignal> allSignals = new ArrayList<>(eventService.signalsByAnon(anonId, since));
        return ProfileBuilder.build(index, allSignals, List.of(), now, properties);
    }

    public void evict(Integer userId, String anonId) {
        if (userId != null && userId > 0) {
            cache.invalidate("u:" + userId);
        }
        if (EventService.isValidUuid(anonId)) {
            cache.invalidate("a:" + anonId.trim().toLowerCase(Locale.ROOT));
        }
    }

    public RecommendProfile summary(UserProfile profile) {
        if (profile == null) {
            return RecommendProfile.empty();
        }

        List<UserSignal> sortedSignals = profile.signals().stream()
                .sorted((s1, s2) -> {
                    double w1 = s1.getWeight() != null ? Math.abs(s1.getWeight()) : 0.0;
                    double w2 = s2.getWeight() != null ? Math.abs(s2.getWeight()) : 0.0;
                    int cmp = Double.compare(w2, w1);
                    if (cmp != 0) return cmp;
                    LocalDateTime t1 = s1.getLastTime();
                    LocalDateTime t2 = s2.getLastTime();
                    if (t1 == null && t2 == null) return 0;
                    if (t1 == null) return 1;
                    if (t2 == null) return -1;
                    return t2.compareTo(t1);
                })
                .toList();

        return RecommendProfile.builder()
                .strategy(profile.strategy())
                .alpha(ProfileBuilder.round4(profile.alpha()))
                .positiveLutCount(profile.positiveLutCount())
                .preference(profile.preferenceSlugs() != null ? profile.preferenceSlugs() : List.of())
                .topStyles(extractTop(profile.mixed().style(), 3))
                .topCategories(extractTop(profile.mixed().category(), 3))
                .topTags(extractTop(profile.mixed().tag(), 5))
                .signals(sortedSignals)
                .build();
    }

    private List<ProfileTerm> extractTop(Map<String, Double> map, int limit) {
        if (map == null || map.isEmpty()) {
            return List.of();
        }
        return map.entrySet().stream()
                .filter(e -> e.getValue() != null && e.getValue() > 0)
                .sorted((e1, e2) -> {
                    int cmp = Double.compare(e2.getValue(), e1.getValue());
                    if (cmp != 0) return cmp;
                    return e1.getKey().compareTo(e2.getKey());
                })
                .limit(limit)
                .map(e -> new ProfileTerm(e.getKey(), ProfileBuilder.round4(e.getValue())))
                .toList();
    }
}
