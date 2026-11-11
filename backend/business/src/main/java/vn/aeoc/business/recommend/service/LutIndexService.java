package vn.aeoc.business.recommend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.repository.LutSimilarityRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.IndexStatus;
import vn.aeoc.entity.data.mysql.recommend.LutSimilarity;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
public class LutIndexService extends BaseService<LutSimilarityRepository, LutSimilarity, Integer> {

    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final LutService lutService;
    private final SimilarityService similarityService;
    private final RecommendProperties properties;
    private final Clock clock;

    private final AtomicReference<LutVectorIndex> currentIndex = new AtomicReference<>();
    private final AtomicReference<IndexStatus> currentStatus = new AtomicReference<>();
    private final ReentrantLock rebuildLock = new ReentrantLock();

    @Autowired
    public LutIndexService(LutSimilarityRepository repository,
                           LutService lutService,
                           SimilarityService similarityService,
                           RecommendProperties properties,
                           QueryExecutor queryExecutor) {
        this(repository, lutService, similarityService, properties, Clock.system(DEFAULT_ZONE), queryExecutor);
    }

    public LutIndexService(LutSimilarityRepository repository,
                           LutService lutService,
                           SimilarityService similarityService,
                           RecommendProperties properties,
                           Clock clock,
                           QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutService = lutService;
        this.similarityService = similarityService;
        this.properties = properties;
        this.clock = clock;
    }

    public LutVectorIndex current() {
        return currentIndex.get();
    }

    public IndexStatus status() {
        IndexStatus cur = currentStatus.get();
        if (cur == null) {
            return null;
        }
        return IndexStatus.builder()
                .lutCount(cur.getLutCount())
                .similarityRows(cur.getSimilarityRows())
                .builtTime(cur.getBuiltTime())
                .elapsedMs(cur.getElapsedMs())
                .reason(cur.getReason())
                .lastError(cur.getLastError())
                .lastErrorTime(cur.getLastErrorTime())
                .build();
    }

    public IndexStatus rebuildOrThrow(String reason) {
        rebuildLock.lock();
        try {
            long start = System.currentTimeMillis();
            List<Lut> luts = lutService.listPublishedForIndex();
            LutVectorIndex newIndex = LutVectorIndex.build(luts, properties);
            List<LutSimilarity> rows = similarityService.topSimilar(newIndex);
            repository.replaceAll(rows);
            currentIndex.set(newIndex);
            long ms = System.currentTimeMillis() - start;
            IndexStatus newStatus = IndexStatus.builder()
                    .lutCount(newIndex.size())
                    .similarityRows(rows.size())
                    .builtTime(LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS))
                    .elapsedMs(ms)
                    .reason(reason)
                    .build();
            currentStatus.set(newStatus);
            log.info("Chỉ mục gợi ý: {} LUT, {} dòng lut_similarity, {} ms ({})",
                    newIndex.size(), rows.size(), ms, reason);
            return status();
        } catch (Exception e) {
            IndexStatus prev = currentStatus.get();
            String errMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName();
            LocalDateTime errTime = LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
            if (prev != null) {
                currentStatus.set(IndexStatus.builder()
                        .lutCount(prev.getLutCount())
                        .similarityRows(prev.getSimilarityRows())
                        .builtTime(prev.getBuiltTime())
                        .elapsedMs(prev.getElapsedMs())
                        .reason(prev.getReason())
                        .lastError(errMsg)
                        .lastErrorTime(errTime)
                        .build());
            } else {
                currentStatus.set(IndexStatus.builder()
                        .lastError(errMsg)
                        .lastErrorTime(errTime)
                        .build());
            }
            log.error("Lỗi khi dựng chỉ mục gợi ý ({}): {}", reason, e.getMessage(), e);
            if (e instanceof RuntimeException re) {
                throw re;
            }
            throw new RuntimeException(e);
        } finally {
            rebuildLock.unlock();
        }
    }

    public void rebuild(String reason) {
        try {
            rebuildOrThrow(reason);
        } catch (Exception e) {
            // Error has been recorded in status and logged
        }
    }
}
