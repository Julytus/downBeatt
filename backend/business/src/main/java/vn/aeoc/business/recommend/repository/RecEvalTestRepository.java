package vn.aeoc.business.recommend.repository;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.jooq.DSLContext;
import org.jooq.JSON;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.recommend.RecEvalTest;
import vn.entity.backend.tables.records.RecEvalTestRecord;

import java.time.LocalDateTime;
import java.util.*;

import static vn.entity.backend.tables.RecEvalTest.REC_EVAL_TEST;

@Repository
public class RecEvalTestRepository extends AbsMysqlRepository<RecEvalTestRecord, RecEvalTest, Integer> {

    private final ObjectMapper objectMapper;

    public RecEvalTestRepository(DSLContext dslContext, ObjectMapper objectMapper) {
        super(dslContext);
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    @Override
    protected TableImpl<RecEvalTestRecord> getTable() {
        return REC_EVAL_TEST;
    }

    public List<RecEvalTest> listByBatch(String batchCode) {
        if (batchCode == null || batchCode.trim().isEmpty()) {
            return List.of();
        }
        return dslContext
                .select(getFiled())
                .from(getTable())
                .where(REC_EVAL_TEST.BATCH_CODE.eq(batchCode.trim()))
                .orderBy(REC_EVAL_TEST.ID.asc())
                .fetchInto(pojoClass);
    }

    public Set<String> batchesWithTests(Collection<String> batchCodes) {
        if (batchCodes == null || batchCodes.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(dslContext
                .selectDistinct(REC_EVAL_TEST.BATCH_CODE)
                .from(getTable())
                .where(REC_EVAL_TEST.BATCH_CODE.in(batchCodes))
                .fetchSet(REC_EVAL_TEST.BATCH_CODE));
    }

    public void insertAll(List<RecEvalTest> tests) {
        if (tests == null || tests.isEmpty()) {
            return;
        }
        int batchSize = 1000;
        for (int i = 0; i < tests.size(); i += batchSize) {
            int end = Math.min(i + batchSize, tests.size());
            List<RecEvalTest> subList = tests.subList(i, end);

            var step = dslContext.insertInto(REC_EVAL_TEST,
                    REC_EVAL_TEST.BATCH_CODE,
                    REC_EVAL_TEST.SCENARIO,
                    REC_EVAL_TEST.METRIC,
                    REC_EVAL_TEST.K,
                    REC_EVAL_TEST.ALGORITHM_A,
                    REC_EVAL_TEST.ALGORITHM_B,
                    REC_EVAL_TEST.SEED_COUNT,
                    REC_EVAL_TEST.PAIR_COUNT,
                    REC_EVAL_TEST.NONZERO_COUNT,
                    REC_EVAL_TEST.MEAN_A,
                    REC_EVAL_TEST.MEAN_B,
                    REC_EVAL_TEST.MEAN_DIFF,
                    REC_EVAL_TEST.CI_LOW,
                    REC_EVAL_TEST.CI_HIGH,
                    REC_EVAL_TEST.REL_CHANGE,
                    REC_EVAL_TEST.W_PLUS,
                    REC_EVAL_TEST.Z,
                    REC_EVAL_TEST.P_VALUE,
                    REC_EVAL_TEST.P_HOLM,
                    REC_EVAL_TEST.CONCLUSION,
                    REC_EVAL_TEST.PARAMS,
                    REC_EVAL_TEST.CREATED_TIME);

            for (RecEvalTest t : subList) {
                step = step.values(
                        t.getBatchCode(),
                        t.getScenario(),
                        t.getMetric(),
                        t.getK(),
                        t.getAlgorithmA(),
                        t.getAlgorithmB(),
                        t.getSeedCount(),
                        t.getPairCount(),
                        t.getNonZeroCount(),
                        t.getMeanA(),
                        t.getMeanB(),
                        t.getMeanDiff(),
                        t.getCiLow(),
                        t.getCiHigh(),
                        t.getRelChange(),
                        t.getWPlus(),
                        t.getZ(),
                        t.getPValue(),
                        t.getPHolm(),
                        t.getConclusion(),
                        JSON.valueOf(toJson(t.getParams())),
                        t.getCreatedTime() != null ? t.getCreatedTime() : LocalDateTime.now()
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
