package vn.aeoc.business.recommend.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.JSON;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;
import vn.entity.backend.tables.records.RecEvalRunRecord;

import java.time.LocalDateTime;
import java.util.List;

import static vn.entity.backend.tables.RecEvalRun.REC_EVAL_RUN;

@Repository
public class RecEvalRunRepository extends AbsMysqlRepository<RecEvalRunRecord, RecEvalRun, Integer> {

    private final ObjectMapper objectMapper;

    public RecEvalRunRepository(DSLContext dslContext, ObjectMapper objectMapper) {
        super(dslContext);
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    @Override
    protected TableImpl<RecEvalRunRecord> getTable() {
        return REC_EVAL_RUN;
    }

    private Condition getWhereCondition(String algorithm, String batch) {
        Condition condition = DSL.noCondition();
        if (algorithm != null && !algorithm.trim().isEmpty()) {
            condition = condition.and(REC_EVAL_RUN.ALGORITHM.eq(algorithm.trim()));
        }
        if (batch != null && !batch.trim().isEmpty()) {
            condition = condition.and(REC_EVAL_RUN.BATCH_CODE.eq(batch.trim()));
        }
        return condition;
    }

    public List<RecEvalRun> list(String algorithm, String batch, Pageable pageable) {
        return dslContext
                .select(getFiled())
                .from(getTable())
                .where(getWhereCondition(algorithm, batch))
                .orderBy(REC_EVAL_RUN.BATCH_CODE.desc(), REC_EVAL_RUN.ID.asc())
                .limit(pageable.getLimit())
                .offset(pageable.getOffset())
                .fetchInto(pojoClass);
    }

    public Long count(String algorithm, String batch) {
        return getCountWithCriteria(getWhereCondition(algorithm, batch));
    }

    public void insertAll(List<RecEvalRun> runs) {
        if (runs == null || runs.isEmpty()) {
            return;
        }
        int batchSize = 1000;
        for (int i = 0; i < runs.size(); i += batchSize) {
            int end = Math.min(i + batchSize, runs.size());
            List<RecEvalRun> subList = runs.subList(i, end);

            var step = dslContext.insertInto(REC_EVAL_RUN,
                    REC_EVAL_RUN.BATCH_CODE,
                    REC_EVAL_RUN.DATASET,
                    REC_EVAL_RUN.ALGORITHM,
                    REC_EVAL_RUN.PARAMS,
                    REC_EVAL_RUN.METRICS,
                    REC_EVAL_RUN.USER_COUNT,
                    REC_EVAL_RUN.CREATED_TIME);

            for (RecEvalRun r : subList) {
                step = step.values(
                        r.getBatchCode(),
                        r.getDataset(),
                        r.getAlgorithm(),
                        JSON.valueOf(toJson(r.getParams())),
                        JSON.valueOf(toJson(r.getMetrics())),
                        r.getUserCount(),
                        r.getCreatedTime() != null ? r.getCreatedTime() : LocalDateTime.now()
                );
            }
            step.execute();
        }
    }

    private String toJson(Object obj) {
        if (obj == null) {
            return "{}";
        }
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}
