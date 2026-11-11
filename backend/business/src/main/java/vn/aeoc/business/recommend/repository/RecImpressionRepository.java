package vn.aeoc.business.recommend.repository;

import org.jooq.DSLContext;
import org.jooq.JSON;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.business.recommend.stats.ImpressionRow;
import vn.aeoc.entity.data.mysql.recommend.RecImpression;
import vn.entity.backend.tables.records.RecImpressionRecord;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import static vn.entity.backend.tables.RecImpression.REC_IMPRESSION;

@Repository
public class RecImpressionRepository extends AbsMysqlRepository<RecImpressionRecord, RecImpression, Long> {

    public RecImpressionRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<RecImpressionRecord> getTable() {
        return REC_IMPRESSION;
    }

    @Override
    public RecImpression insertReturning(RecImpression pojo) {
        if (pojo == null) {
            return null;
        }
        String jsonPayload = (pojo.getLutIds() != null && !pojo.getLutIds().isEmpty())
                ? "[" + pojo.getLutIds().stream().map(String::valueOf).collect(Collectors.joining(",")) + "]"
                : "[]";

        RecImpressionRecord record = dslContext.insertInto(REC_IMPRESSION)
                .set(REC_IMPRESSION.USER_ID, pojo.getUserId())
                .set(REC_IMPRESSION.ANON_ID, pojo.getAnonId())
                .set(REC_IMPRESSION.PLACEMENT, pojo.getPlacement())
                .set(REC_IMPRESSION.VARIANT, pojo.getVariant())
                .set(REC_IMPRESSION.STRATEGY, pojo.getStrategy())
                .set(REC_IMPRESSION.LUT_IDS, JSON.valueOf(jsonPayload))
                .set(REC_IMPRESSION.CREATED_TIME, pojo.getCreatedTime() != null ? pojo.getCreatedTime() : LocalDateTime.now())
                .returning()
                .fetchOne();

        if (record == null) {
            return null;
        }
        return record.into(RecImpression.class);
    }

    public List<ImpressionRow> listForStats(LocalDateTime from, LocalDateTime toExclusive) {
        return dslContext.select(
                        REC_IMPRESSION.ID,
                        REC_IMPRESSION.VARIANT,
                        REC_IMPRESSION.STRATEGY,
                        REC_IMPRESSION.LUT_IDS)
                .from(REC_IMPRESSION)
                .where(REC_IMPRESSION.PLACEMENT.eq("FOR_YOU")
                        .and(REC_IMPRESSION.CREATED_TIME.ge(from))
                        .and(REC_IMPRESSION.CREATED_TIME.lt(toExclusive)))
                .fetch(r -> new ImpressionRow(
                        r.get(REC_IMPRESSION.ID),
                        r.get(REC_IMPRESSION.VARIANT),
                        r.get(REC_IMPRESSION.STRATEGY),
                        RecImpression.parseIntegerList(r.get(REC_IMPRESSION.LUT_IDS))
                ));
    }
}
