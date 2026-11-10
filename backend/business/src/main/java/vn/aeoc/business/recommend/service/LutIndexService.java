package vn.aeoc.business.recommend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.lut.service.LutService;
import vn.aeoc.business.recommend.config.RecommendProperties;
import vn.aeoc.business.recommend.index.LutVectorIndex;
import vn.aeoc.business.recommend.repository.LutSimilarityRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.LutSimilarity;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Service
public class LutIndexService extends BaseService<LutSimilarityRepository, LutSimilarity, Integer> {

    private final LutService lutService;
    private final SimilarityService similarityService;
    private final RecommendProperties properties;

    private final AtomicReference<LutVectorIndex> currentIndex = new AtomicReference<>();
    private final ReentrantLock rebuildLock = new ReentrantLock();

    public LutIndexService(LutSimilarityRepository repository,
                           LutService lutService,
                           SimilarityService similarityService,
                           RecommendProperties properties,
                           QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutService = lutService;
        this.similarityService = similarityService;
        this.properties = properties;
    }

    public LutVectorIndex current() {
        return currentIndex.get();
    }

    public void rebuild(String reason) {
        rebuildLock.lock();
        try {
            long start = System.currentTimeMillis();
            List<Lut> luts = lutService.listPublishedForIndex();
            LutVectorIndex newIndex = LutVectorIndex.build(luts, properties);
            List<LutSimilarity> rows = similarityService.topSimilar(newIndex);
            repository.replaceAll(rows);
            currentIndex.set(newIndex);
            long ms = System.currentTimeMillis() - start;
            log.info("Chỉ mục gợi ý: {} LUT, {} dòng lut_similarity, {} ms ({})",
                    newIndex.size(), rows.size(), ms, reason);
        } catch (Exception e) {
            log.error("Lỗi khi dựng chỉ mục gợi ý ({}): {}", reason, e.getMessage(), e);
        } finally {
            rebuildLock.unlock();
        }
    }
}
