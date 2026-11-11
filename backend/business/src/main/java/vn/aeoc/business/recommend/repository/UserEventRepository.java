package vn.aeoc.business.recommend.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.recommend.UserEvent;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;
import vn.entity.backend.tables.records.UserEventRecord;

import java.time.LocalDateTime;
import java.util.List;

import static vn.entity.backend.tables.UserEvent.USER_EVENT;

@Repository
public class UserEventRepository extends AbsMysqlRepository<UserEventRecord, UserEvent, Long> {

    public UserEventRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<UserEventRecord> getTable() {
        return USER_EVENT;
    }

    public boolean existsRecent(Integer userId, String anonId, String type, Integer lutId, String value, LocalDateTime since) {
        Condition cond = DSL.noCondition();
        if (userId != null && userId > 0) {
            cond = cond.and(USER_EVENT.USER_ID.eq(userId));
        } else {
            cond = cond.and(USER_EVENT.ANON_ID.eq(anonId).and(USER_EVENT.USER_ID.isNull()));
        }
        cond = cond.and(USER_EVENT.EVENT_TYPE.eq(type));
        if ("VIEW".equals(type) || "PREVIEW".equals(type)) {
            cond = cond.and(USER_EVENT.LUT_ID.eq(lutId));
        } else {
            cond = cond.and(USER_EVENT.VALUE.eq(value));
        }
        cond = cond.and(USER_EVENT.CREATED_TIME.ge(since));
        return exists(cond);
    }

    public boolean existsDismiss(Integer userId, Integer lutId) {
        if (userId == null || lutId == null) {
            return false;
        }
        return exists(USER_EVENT.USER_ID.eq(userId)
                .and(USER_EVENT.EVENT_TYPE.eq("DISMISS"))
                .and(USER_EVENT.LUT_ID.eq(lutId)));
    }

    public int mergeAnon(Integer userId, String anonId) {
        if (userId == null || anonId == null) {
            return 0;
        }
        return dslContext.update(USER_EVENT)
                .set(USER_EVENT.USER_ID, userId)
                .where(USER_EVENT.ANON_ID.eq(anonId).and(USER_EVENT.USER_ID.isNull()))
                .execute();
    }

    public int deleteByUser(Integer userId) {
        if (userId == null) {
            return 0;
        }
        return delete(USER_EVENT.USER_ID.eq(userId));
    }

    public int deleteAnon(String anonId) {
        if (anonId == null) {
            return 0;
        }
        return delete(USER_EVENT.ANON_ID.eq(anonId).and(USER_EVENT.USER_ID.isNull()));
    }

    public int deleteOlderThan(LocalDateTime cutoff) {
        if (cutoff == null) {
            return 0;
        }
        return delete(USER_EVENT.CREATED_TIME.lt(cutoff));
    }

    public List<UserSignal> signalsByUser(Integer userId, LocalDateTime since) {
        if (userId == null) {
            return List.of();
        }
        var countField = DSL.count().as("count");
        var maxTimeField = DSL.max(USER_EVENT.CREATED_TIME).as("last_time");

        return dslContext.select(USER_EVENT.EVENT_TYPE, USER_EVENT.LUT_ID, USER_EVENT.VALUE, countField, maxTimeField)
                .from(USER_EVENT)
                .where(USER_EVENT.USER_ID.eq(userId).and(USER_EVENT.CREATED_TIME.ge(since)))
                .groupBy(USER_EVENT.EVENT_TYPE, USER_EVENT.LUT_ID, USER_EVENT.VALUE)
                .fetch(r -> new UserSignal(
                        r.get(USER_EVENT.EVENT_TYPE),
                        r.get(USER_EVENT.LUT_ID),
                        null,
                        r.get(USER_EVENT.VALUE),
                        r.get(countField),
                        r.get(maxTimeField)
                ));
    }

    public List<UserSignal> signalsByAnon(String anonId, LocalDateTime since) {
        if (anonId == null) {
            return List.of();
        }
        var countField = DSL.count().as("count");
        var maxTimeField = DSL.max(USER_EVENT.CREATED_TIME).as("last_time");

        return dslContext.select(USER_EVENT.EVENT_TYPE, USER_EVENT.LUT_ID, USER_EVENT.VALUE, countField, maxTimeField)
                .from(USER_EVENT)
                .where(USER_EVENT.ANON_ID.eq(anonId)
                        .and(USER_EVENT.USER_ID.isNull())
                        .and(USER_EVENT.CREATED_TIME.ge(since)))
                .groupBy(USER_EVENT.EVENT_TYPE, USER_EVENT.LUT_ID, USER_EVENT.VALUE)
                .fetch(r -> new UserSignal(
                        r.get(USER_EVENT.EVENT_TYPE),
                        r.get(USER_EVENT.LUT_ID),
                        null,
                        r.get(USER_EVENT.VALUE),
                        r.get(countField),
                        r.get(maxTimeField)
                ));
    }
}
