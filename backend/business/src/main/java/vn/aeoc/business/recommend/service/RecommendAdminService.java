package vn.aeoc.business.recommend.service;

import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.business.lut.service.LutColorFeatureService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.repository.RecommendCustomerRepository;
import vn.aeoc.business.recommend.stats.StatsCalculator;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.CustomerOption;
import vn.aeoc.entity.data.mysql.recommend.FeatureFailure;
import vn.aeoc.entity.data.mysql.recommend.IndexStatus;
import vn.aeoc.entity.data.mysql.recommend.RebuildResult;
import vn.aeoc.entity.data.mysql.recommend.RecommendConfig;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecommendAdminService {

    private final RecommendProperties properties;
    private final LutIndexService lutIndexService;
    private final LutRepository lutRepository;
    private final LutColorFeatureService lutColorFeatureService;
    private final RecommendCustomerRepository customerRepository;

    public RecommendAdminService(RecommendProperties properties,
                                 LutIndexService lutIndexService,
                                 LutRepository lutRepository,
                                 LutColorFeatureService lutColorFeatureService,
                                 RecommendCustomerRepository customerRepository) {
        this.properties = properties != null ? properties : new RecommendProperties();
        this.lutIndexService = lutIndexService;
        this.lutRepository = lutRepository;
        this.lutColorFeatureService = lutColorFeatureService;
        this.customerRepository = customerRepository;
    }

    public RecommendConfig config() {
        String variant = properties.getVariant() != null ? properties.getVariant() : "cbf-full";

        RecommendProperties.Weights w = properties.getWeights();
        Map<String, Double> weights = new LinkedHashMap<>();
        weights.put("tag", StatsCalculator.round4(w != null ? w.getTag() : 0.30));
        weights.put("color", StatsCalculator.round4(w != null ? w.getColor() : 0.25));
        weights.put("category", StatsCalculator.round4(w != null ? w.getCategory() : 0.15));
        weights.put("style", StatsCalculator.round4(w != null ? w.getStyle() : 0.15));
        weights.put("text", StatsCalculator.round4(w != null ? w.getText() : 0.10));
        weights.put("creator", StatsCalculator.round4(w != null ? w.getCreator() : 0.05));

        RecommendProperties.Weights nw = properties.normalizedWeights();
        Map<String, Double> normalizedWeights = new LinkedHashMap<>();
        normalizedWeights.put("tag", StatsCalculator.round4(nw.getTag()));
        normalizedWeights.put("color", StatsCalculator.round4(nw.getColor()));
        normalizedWeights.put("category", StatsCalculator.round4(nw.getCategory()));
        normalizedWeights.put("style", StatsCalculator.round4(nw.getStyle()));
        normalizedWeights.put("text", StatsCalculator.round4(nw.getText()));
        normalizedWeights.put("creator", StatsCalculator.round4(nw.getCreator()));

        RecommendProperties.EventWeights ew = properties.getEvent();
        Map<String, Double> eventWeights = new LinkedHashMap<>();
        eventWeights.put("VIEW", ew != null ? ew.getView() : 1.0);
        eventWeights.put("PREVIEW", ew != null ? ew.getPreview() : 2.0);
        eventWeights.put("SEARCH", ew != null ? ew.getSearch() : 0.5);
        eventWeights.put("FILTER_STYLE", ew != null ? ew.getFilterStyle() : 0.5);
        eventWeights.put("FAVORITE", ew != null ? ew.getFavorite() : 4.0);
        eventWeights.put("DOWNLOAD", ew != null ? ew.getDownload() : 5.0);
        eventWeights.put("PURCHASE", ew != null ? ew.getPurchase() : 6.0);
        eventWeights.put("DISMISS", ew != null ? ew.getDismiss() : -4.0);

        Map<String, Object> params = new LinkedHashMap<>();
        params.put("similarity-top", properties.getSimilarityTop());
        params.put("half-life-days", properties.getHalfLifeDays());
        params.put("history-days", properties.getHistoryDays());
        params.put("history-max-pairs", properties.getHistoryMaxPairs());
        params.put("cold-start-k", properties.getColdStartK());
        params.put("mmr-lambda", properties.getMmrLambda());
        params.put("candidate-top", properties.getCandidateTop());
        params.put("premium-max-ratio", properties.getPremiumMaxRatio());
        params.put("related-personal-ratio", properties.getRelatedPersonalRatio());
        params.put("popular-days", properties.getPopularDays());
        params.put("for-you-limit", properties.getForYouLimit());
        params.put("for-you-max-limit", properties.getForYouMaxLimit());
        params.put("event-dedup-minutes", properties.getEventDedupMinutes());
        params.put("profile-cache-minutes", properties.getProfileCacheMinutes());
        params.put("preference-max", properties.getPreferenceMax());
        params.put("stats-download-window-minutes", properties.getStatsDownloadWindowMinutes());
        params.put("stats-max-days", properties.getStatsMaxDays());
        params.put("rebuild-cron", properties.getRebuildCron());
        params.put("event-cleanup-cron", properties.getEventCleanupCron());

        IndexStatus status = lutIndexService.status();

        return RecommendConfig.builder()
                .variant(variant)
                .weights(weights)
                .normalizedWeights(normalizedWeights)
                .eventWeights(eventWeights)
                .params(params)
                .index(status)
                .build();
    }

    public RebuildResult rebuild() {
        List<Integer> missingIds = lutRepository.idsMissingFeature();
        int featureMissing = missingIds != null ? missingIds.size() : 0;
        int featureComputed = 0;
        List<FeatureFailure> featureFailed = new ArrayList<>();

        if (missingIds != null && !missingIds.isEmpty()) {
            List<Lut> recomputed = lutColorFeatureService.recompute(missingIds);
            for (Lut lut : recomputed) {
                if (lut.getFeatureError() != null) {
                    featureFailed.add(new FeatureFailure(lut.getId(), lut.getTitle(), lut.getFeatureError()));
                } else {
                    featureComputed++;
                }
            }
        }

        IndexStatus status;
        try {
            status = lutIndexService.rebuildOrThrow("quản trị");
        } catch (Exception e) {
            throw new AppException(ErrorCode.INTERNAL_ERROR, "Không dựng được chỉ mục gợi ý");
        }

        return RebuildResult.builder()
                .featureMissing(featureMissing)
                .featureComputed(featureComputed)
                .featureFailed(featureFailed)
                .lutCount(status != null ? status.getLutCount() : 0)
                .similarityRows(status != null ? status.getSimilarityRows() : 0)
                .elapsedMs(status != null ? status.getElapsedMs() : 0L)
                .builtTime(status != null ? status.getBuiltTime() : null)
                .reason("quản trị")
                .build();
    }

    public List<CustomerOption> customers(String keyword, Integer limit) {
        String kw = (keyword == null || keyword.isBlank()) ? null : keyword.trim();
        int lim = (limit == null || limit <= 0) ? 10 : Math.min(limit, 20);
        return customerRepository.search(kw, lim);
    }
}
