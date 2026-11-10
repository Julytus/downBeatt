package vn.aeoc.business.billing.repository;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.billing.Subscription;
import vn.entity.backend.tables.records.SubscriptionRecord;

import java.time.LocalDate;

import static vn.entity.backend.Tables.SUBSCRIPTION;

@Repository
public class SubscriptionRepository extends AbsMysqlRepository<SubscriptionRecord, Subscription, Integer> {
    public SubscriptionRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<SubscriptionRecord> getTable() {
        return SUBSCRIPTION;
    }

    public Subscription findActiveByUserId(Integer userId, LocalDate today) {
        if (userId == null) {
            return null;
        }
        return dslContext.select(getFiled())
                .from(SUBSCRIPTION)
                .where(SUBSCRIPTION.USER_ID.eq(userId)
                        .and(SUBSCRIPTION.STATUS.eq("ACTIVE"))
                        .and(SUBSCRIPTION.END_DATE.ge(today)))
                .fetchOptionalInto(pojoClass)
                .orElse(null);
    }

    public Subscription findActiveForUpdate(Integer userId) {
        if (userId == null) {
            return null;
        }
        return dslContext.select(getFiled())
                .from(SUBSCRIPTION)
                .where(SUBSCRIPTION.USER_ID.eq(userId)
                        .and(SUBSCRIPTION.STATUS.eq("ACTIVE")))
                .forUpdate()
                .fetchOptionalInto(pojoClass)
                .orElse(null);
    }

    public int updateStatus(Integer id, String status) {
        return dslContext.update(SUBSCRIPTION)
                .set(SUBSCRIPTION.STATUS, status)
                .where(SUBSCRIPTION.ID.eq(id))
                .execute();
    }

    public int expireOverdue(LocalDate today) {
        return dslContext.update(SUBSCRIPTION)
                .set(SUBSCRIPTION.STATUS, "EXPIRED")
                .where(SUBSCRIPTION.STATUS.eq("ACTIVE").and(SUBSCRIPTION.END_DATE.lt(today)))
                .execute();
    }
}
