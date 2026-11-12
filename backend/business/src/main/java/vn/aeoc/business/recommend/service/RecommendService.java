package vn.aeoc.business.recommend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.billing.service.SubscriptionService;
import vn.aeoc.business.download.service.LutDownloadService;
import vn.aeoc.business.lut.service.LutCategoryService;
import vn.aeoc.business.lut.service.LutQuerySupport;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.ItemVector;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.profile.ProfileVector;
import vn.aeoc.business.recommend.profile.UserProfile;
import vn.aeoc.business.recommend.rank.RankedItem;
import vn.aeoc.business.recommend.rank.ReasonBuilder;
import vn.aeoc.business.recommend.rank.Recommender;
import vn.aeoc.business.recommend.rank.ScoreCalculator;
import vn.aeoc.business.recommend.repository.RecImpressionRepository;
import vn.aeoc.business.recommend.repository.RecommendCustomerRepository;
import vn.aeoc.business.recommend.stats.StatsCalculator;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutCategory;
import vn.aeoc.entity.data.mysql.recommend.ColorTerm;
import vn.aeoc.entity.data.mysql.recommend.CustomerOption;
import vn.aeoc.entity.data.mysql.recommend.RecImpression;
import vn.aeoc.entity.data.mysql.recommend.RecommendProfile;
import vn.aeoc.entity.data.mysql.recommend.RecommendResult;
import vn.aeoc.entity.data.mysql.recommend.TryProfileRequest;
import vn.aeoc.entity.data.mysql.recommend.TryProfileResult;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class RecommendService extends BaseService<RecImpressionRepository, RecImpression, Long> {

    private static final Logger log = LoggerFactory.getLogger(RecommendService.class);
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final UserProfileService userProfileService;
    private final LutIndexService lutIndexService;
    private final SubscriptionService subscriptionService;
    private final LutDownloadService downloadService;
    private final LutService lutService;
    private final LutCategoryService lutCategoryService;
    private final RecommendCustomerRepository customerRepository;
    private final RecommendProperties properties;
    private final Clock clock;

    @Autowired
    public RecommendService(RecImpressionRepository repository,
                            QueryExecutor queryExecutor,
                            UserProfileService userProfileService,
                            LutIndexService lutIndexService,
                            SubscriptionService subscriptionService,
                            LutDownloadService downloadService,
                            LutService lutService,
                            LutCategoryService lutCategoryService,
                            RecommendCustomerRepository customerRepository,
                            RecommendProperties properties) {
        this(repository, queryExecutor, userProfileService, lutIndexService, subscriptionService, downloadService,
                lutService, lutCategoryService, customerRepository, properties, Clock.system(DEFAULT_ZONE));
    }

    public RecommendService(RecImpressionRepository repository,
                            QueryExecutor queryExecutor,
                            UserProfileService userProfileService,
                            LutIndexService lutIndexService,
                            SubscriptionService subscriptionService,
                            LutDownloadService downloadService,
                            LutService lutService,
                            LutCategoryService lutCategoryService,
                            RecommendProperties properties,
                            Clock clock) {
        this(repository, queryExecutor, userProfileService, lutIndexService, subscriptionService, downloadService,
                lutService, lutCategoryService, null, properties, clock);
    }

    public RecommendService(RecImpressionRepository repository,
                            QueryExecutor queryExecutor,
                            UserProfileService userProfileService,
                            LutIndexService lutIndexService,
                            SubscriptionService subscriptionService,
                            LutDownloadService downloadService,
                            LutService lutService,
                            LutCategoryService lutCategoryService,
                            RecommendCustomerRepository customerRepository,
                            RecommendProperties properties,
                            Clock clock) {
        super(repository, queryExecutor);
        this.userProfileService = userProfileService;
        this.lutIndexService = lutIndexService;
        this.subscriptionService = subscriptionService;
        this.downloadService = downloadService;
        this.lutService = lutService;
        this.lutCategoryService = lutCategoryService;
        this.customerRepository = customerRepository;
        this.properties = properties != null ? properties : new RecommendProperties();
        this.clock = clock;
    }

    public RecommendResult forYou(Integer userId, RecImpression body) {
        long startTime = System.currentTimeMillis();
        LocalDateTime now = LocalDateTime.now(clock);

        // 1. Limit
        int defaultLimit = properties.getForYouLimit() > 0 ? properties.getForYouLimit() : 12;
        int maxLimit = properties.getForYouMaxLimit() > 0 ? properties.getForYouMaxLimit() : 24;
        int limit = defaultLimit;
        if (body != null && body.getLimit() != null && body.getLimit() > 0) {
            limit = Math.min(body.getLimit(), maxLimit);
        }

        // 2. Identity
        Integer actualUserId = (userId != null && userId > 0) ? userId : null;
        String actualAnonId = (body != null && EventService.isValidUuid(body.getAnonId()))
                ? body.getAnonId().trim().toLowerCase(Locale.ROOT)
                : null;

        UserProfile profile = actualUserId != null
                ? userProfileService.profileOf(actualUserId, null)
                : userProfileService.profileOf(null, actualAnonId);

        // 3. Rank
        Ranking ranking = rank(actualUserId, actualAnonId, profile, limit);

        if (ranking.items().isEmpty()) {
            return new RecommendResult(null, ranking.strategy(), List.of());
        }

        // 4. Insert rec_impression
        List<Integer> finalIds = ranking.items().stream().map(Lut::getId).toList();
        RecImpression imp = new RecImpression();
        imp.setUserId(actualUserId);
        imp.setAnonId(actualAnonId);
        imp.setPlacement("FOR_YOU");
        imp.setVariant(properties.getVariant() != null ? properties.getVariant() : "cbf-full");
        imp.setStrategy(ranking.strategy());
        imp.setLutIds(finalIds);
        imp.setCreatedTime(now);

        RecImpression saved = repository.insertReturning(imp);
        Long impressionId = saved != null ? saved.getId() : null;

        long elapsedMs = System.currentTimeMillis() - startTime;
        log.debug("for-you {} LUT, {} ms", ranking.items().size(), elapsedMs);

        return new RecommendResult(impressionId, ranking.strategy(), ranking.items());
    }

    public TryProfileResult tryProfile(TryProfileRequest request) {
        // Validate request according to §5.5 & §5.6
        if (request == null || ((request.getUserId() == null || request.getUserId() <= 0)
                && (request.getAnonId() == null || request.getAnonId().isBlank()))) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Chọn một khách hàng hoặc nhập mã ẩn danh");
        }

        Integer actualUserId = null;
        String actualAnonId = null;
        CustomerOption customer = null;

        if (request.getUserId() != null && request.getUserId() > 0) {
            if (customerRepository == null) {
                throw new AppException(ErrorCode.INTERNAL_ERROR, "Customer repository chưa được cấu hình");
            }
            customer = customerRepository.findById(request.getUserId());
            if (customer == null) {
                throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy khách hàng");
            }
            actualUserId = request.getUserId();
        } else {
            String anonId = request.getAnonId();
            if (!EventService.isValidUuid(anonId)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Mã ẩn danh không hợp lệ");
            }
            actualAnonId = anonId.trim().toLowerCase(Locale.ROOT);
        }

        int defaultLimit = properties.getForYouLimit() > 0 ? properties.getForYouLimit() : 12;
        int maxLimit = properties.getForYouMaxLimit() > 0 ? properties.getForYouMaxLimit() : 24;
        int limit = defaultLimit;
        if (request.getLimit() != null && request.getLimit() > 0) {
            limit = Math.min(request.getLimit(), maxLimit);
        }

        // Profile: compute fresh (no cache read/write)
        UserProfile profile = userProfileService.computeFresh(actualUserId, actualAnonId);
        RecommendProfile summaryProfile = userProfileService.summary(profile);

        // Rank
        Ranking ranking = rank(actualUserId, actualAnonId, profile, limit);

        // Add contributions to items
        boolean isPopular = "POPULAR".equalsIgnoreCase(ranking.strategy());
        if (!isPopular) {
            for (Lut lut : ranking.items()) {
                RankedItem ri = ranking.ranked().get(lut.getId());
                if (ri != null && ri.contributions() != null) {
                    Map<String, Double> contMap = new LinkedHashMap<>();
                    for (String key : List.of("tag", "color", "category", "style", "text", "creator")) {
                        Double val = ri.contributions().get(key);
                        contMap.put(key, val != null ? StatsCalculator.round4(val) : 0.0);
                    }
                    lut.setContributions(contMap);
                }
            }
        } else {
            for (Lut lut : ranking.items()) {
                lut.setScore(null);
                lut.setContributions(null);
            }
        }

        // Color terms
        List<ColorTerm> colorTerms = new ArrayList<>();
        if (profile != null && profile.mixed() != null && profile.mixed().color() != null) {
            double[] colorVec = profile.mixed().color();
            String[] colorKeys = {
                    "brightness", "contrast", "saturation", "warmth", "tint",
                    "shadowA", "shadowB", "highlightA", "highlightB", "isMono"
            };
            for (int i = 0; i < colorKeys.length && i < colorVec.length; i++) {
                colorTerms.add(new ColorTerm(colorKeys[i], StatsCalculator.round4(colorVec[i])));
            }
        }

        // Category names
        Map<String, String> allCategoryNames = new HashMap<>();
        List<LutCategory> pubCats = lutCategoryService.listPublic();
        if (pubCats != null) {
            for (LutCategory c : pubCats) {
                if (c.getSlug() != null && c.getName() != null) {
                    allCategoryNames.put(c.getSlug(), c.getName());
                }
            }
        }

        Set<String> neededSlugs = new LinkedHashSet<>();
        if (summaryProfile != null) {
            if (summaryProfile.getPreference() != null) {
                neededSlugs.addAll(summaryProfile.getPreference());
            }
            if (summaryProfile.getTopStyles() != null) {
                for (var term : summaryProfile.getTopStyles()) {
                    if (term.getKey() != null) {
                        neededSlugs.add(term.getKey());
                    }
                }
            }
            if (summaryProfile.getTopCategories() != null) {
                for (var term : summaryProfile.getTopCategories()) {
                    if (term.getKey() != null) {
                        neededSlugs.add(term.getKey());
                    }
                }
            }
        }
        if (ranking.items() != null) {
            for (Lut item : ranking.items()) {
                if (item.getStyle() != null && !item.getStyle().isBlank()) {
                    neededSlugs.add(item.getStyle());
                }
            }
        }

        Map<String, String> categoryNames = new LinkedHashMap<>();
        for (String slug : neededSlugs) {
            String name = allCategoryNames.get(slug);
            if (name != null) {
                categoryNames.put(slug, name);
            }
        }

        Integer premiumQuota = ranking.premiumLimited()
                ? Recommender.premiumQuota(limit, properties.getPremiumMaxRatio())
                : null;

        return TryProfileResult.builder()
                .customer(customer)
                .anonId(actualAnonId)
                .strategy(ranking.strategy())
                .premiumLimited(ranking.premiumLimited())
                .premiumQuota(premiumQuota)
                .profile(summaryProfile)
                .color(colorTerms)
                .categoryNames(categoryNames)
                .items(ranking.items())
                .build();
    }

    private Ranking rank(Integer userId, String anonId, UserProfile profile, int limit) {
        String strategy = (profile != null && profile.strategy() != null) ? profile.strategy() : "POPULAR";

        LutVectorIndex ix = lutIndexService.current();
        if (ix == null || ix.size() == 0) {
            return new Ranking(strategy, List.of(), true, Map.of());
        }

        boolean premiumLimited = true;
        if (userId != null && userId > 0 && subscriptionService != null) {
            LocalDate today = LocalDate.now(clock);
            if (subscriptionService.findActiveByUserId(userId, today) != null) {
                premiumLimited = false;
            }
        }

        Map<Integer, Integer> recentDownloads = Map.of();
        if ("POPULAR".equalsIgnoreCase(strategy)) {
            int popDays = properties.getPopularDays() > 0 ? properties.getPopularDays() : 30;
            recentDownloads = downloadService.recentDownloadCounts(LocalDateTime.now(clock).minusDays(popDays));
        }

        List<RankedItem> rankedItems = Recommender.recommend(
                profile, ix.items(), recentDownloads, limit, premiumLimited, properties);

        if (rankedItems.isEmpty()) {
            return new Ranking(strategy, List.of(), premiumLimited, Map.of());
        }

        List<Integer> orderedIds = rankedItems.stream().map(RankedItem::id).toList();
        List<Lut> items = lutService.listPublishedByIds(orderedIds);
        if (items.isEmpty()) {
            return new Ranking(strategy, List.of(), premiumLimited, Map.of());
        }

        Map<Integer, RankedItem> rankedMap = new HashMap<>(rankedItems.size());
        for (RankedItem ri : rankedItems) {
            rankedMap.put(ri.id(), ri);
        }

        Map<String, String> categoryNames = new HashMap<>();
        List<LutCategory> pubCats = lutCategoryService.listPublic();
        if (pubCats != null) {
            for (LutCategory c : pubCats) {
                if (c.getSlug() != null && c.getName() != null) {
                    categoryNames.put(c.getSlug(), c.getName());
                }
            }
        }

        ReasonBuilder reasonBuilder = new ReasonBuilder(
                ix::item,
                ix::title,
                categoryNames,
                properties
        );

        for (Lut lut : items) {
            ItemVector iv = ix.item(lut.getId());
            RankedItem ri = rankedMap.get(lut.getId());
            Map<String, Double> cont = ri != null ? ri.contributions() : null;
            int rCount = recentDownloads.getOrDefault(lut.getId(), 0);
            String reason = reasonBuilder.reason(profile, iv, cont, lut.getCreatorName(), rCount);
            lut.setReason(reason);

            if (!"POPULAR".equalsIgnoreCase(strategy) && ri != null) {
                lut.setScore(Math.round(ri.score() * 10000.0) / 10000.0);
            }
        }

        return new Ranking(strategy, items, premiumLimited, rankedMap);
    }

    private record Ranking(String strategy, List<Lut> items, boolean premiumLimited, Map<Integer, RankedItem> ranked) {}

    public Page<Lut> related(Integer userId, String anonId, String slug, Integer page, Integer limit) {
        Integer actualUserId = (userId != null && userId > 0) ? userId : null;
        String cleanAnonId = EventService.isValidUuid(anonId) ? anonId.trim().toLowerCase(Locale.ROOT) : null;

        UserProfile profile = actualUserId != null
                ? userProfileService.profileOf(actualUserId, null)
                : userProfileService.profileOf(null, cleanAnonId);

        if (profile == null || "POPULAR".equalsIgnoreCase(profile.strategy())) {
            return lutService.related(slug, page, limit);
        }

        List<Lut> similarAll = lutService.similarAll(slug);
        if (similarAll == null || similarAll.isEmpty()) {
            return lutService.related(slug, page, limit);
        }

        LutVectorIndex ix = lutIndexService.current();
        ProfileVector p = profile.mixed();
        double r = properties.getRelatedPersonalRatio();
        RecommendProperties.Weights w = properties.normalizedWeights();

        List<LutWithRelatedScore> scored = new ArrayList<>(similarAll.size());
        for (Lut lut : similarAll) {
            double sim = lut.getSimilarity() != null ? lut.getSimilarity() : 0.0;
            ItemVector iv = ix != null ? ix.item(lut.getId()) : null;
            double scoreUJ = (iv != null && p != null) ? ScoreCalculator.score(p, iv, w) : 0.0;
            double related = (1.0 - r) * sim + r * scoreUJ;

            lut.setSimilarity(Math.round(sim * 10000.0) / 10000.0);
            lut.setScore(Math.round(related * 10000.0) / 10000.0);
            scored.add(new LutWithRelatedScore(lut, related));
        }

        scored.sort((a, b) -> {
            int cmp = Double.compare(b.related(), a.related());
            if (cmp != 0) return cmp;
            int dcA = a.lut().getDownloadCount() != null ? a.lut().getDownloadCount() : 0;
            int dcB = b.lut().getDownloadCount() != null ? b.lut().getDownloadCount() : 0;
            cmp = Integer.compare(dcB, dcA);
            if (cmp != 0) return cmp;
            return Integer.compare(a.lut().getId(), b.lut().getId());
        });

        int pNum = LutQuerySupport.page(page);
        int pLimit = LutQuerySupport.limit(limit);
        int total = scored.size();
        int offset = (pNum - 1) * pLimit;

        List<Lut> pageItems;
        if (offset >= total) {
            pageItems = List.of();
        } else {
            int toIndex = Math.min(offset + pLimit, total);
            pageItems = scored.subList(offset, toIndex).stream()
                    .map(LutWithRelatedScore::lut)
                    .toList();
        }

        Pageable pageable = new Pageable();
        pageable.setPage(pNum);
        pageable.setLimit(pLimit);
        pageable.setTotal((long) total);
        return new Page<>(pageable, pageItems);
    }

    private record LutWithRelatedScore(Lut lut, double related) {}
}
