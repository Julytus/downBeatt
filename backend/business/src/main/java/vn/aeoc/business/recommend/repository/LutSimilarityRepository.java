package vn.aeoc.business.recommend.repository;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.recommend.LutSimilarity;
import vn.entity.backend.tables.records.LutSimilarityRecord;

import java.util.List;

import static vn.entity.backend.tables.LutSimilarity.LUT_SIMILARITY;

@Repository
public class LutSimilarityRepository extends AbsMysqlRepository<LutSimilarityRecord, LutSimilarity, Integer> {

    public LutSimilarityRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<LutSimilarityRecord> getTable() {
        return LUT_SIMILARITY;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void replaceAll(List<LutSimilarity> rows) {
        dslContext.deleteFrom(LUT_SIMILARITY).execute();
        if (rows == null || rows.isEmpty()) {
            return;
        }
        int batchSize = 1000;
        for (int i = 0; i < rows.size(); i += batchSize) {
            int end = Math.min(i + batchSize, rows.size());
            List<LutSimilarity> batch = rows.subList(i, end);
            var step = dslContext.insertInto(LUT_SIMILARITY,
                    LUT_SIMILARITY.LUT_ID,
                    LUT_SIMILARITY.SIMILAR_LUT_ID,
                    LUT_SIMILARITY.SCORE);
            for (LutSimilarity row : batch) {
                step = step.values(row.getLutId(), row.getSimilarLutId(), row.getScore());
            }
            step.execute();
        }
    }
}
