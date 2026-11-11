package vn.aeoc.business.billing.repository;

import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.JSON;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;
import vn.entity.backend.tables.records.PaymentOrderRecord;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import static vn.entity.backend.Tables.LUT;
import static vn.entity.backend.Tables.PAYMENT_ORDER;
import static vn.entity.backend.Tables.PLAN;

@Repository
public class PaymentOrderRepository extends AbsMysqlRepository<PaymentOrderRecord, PaymentOrder, Integer> {
    private static final DateTimeFormatter CODE_DATE_FORMAT = DateTimeFormatter.ofPattern("yyMMdd");

    public PaymentOrderRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<PaymentOrderRecord> getTable() {
        return PAYMENT_ORDER;
    }

    private List<Field<?>> fields() {
        return mergeFields(
                PLAN.CODE.as("plan_code"),
                PLAN.NAME.as("plan_name"),
                LUT.SLUG.as("source_lut_slug"),
                LUT.TITLE.as("source_lut_title")
        );
    }

    private Table<?> joined() {
        return PAYMENT_ORDER
                .leftJoin(PLAN).on(PLAN.ID.eq(PAYMENT_ORDER.PLAN_ID))
                .leftJoin(LUT).on(LUT.ID.eq(PAYMENT_ORDER.SOURCE_LUT_ID));
    }

    public PaymentOrder getOrderByCode(String code) {
        if (code == null) {
            return null;
        }
        return getOneByCriteriaWithJoin(fields(), joined(), PAYMENT_ORDER.CODE.eq(code));
    }

    public PaymentOrder getByPayosOrderCode(Long payosOrderCode) {
        if (payosOrderCode == null) {
            return null;
        }
        return getOne(PAYMENT_ORDER.PAYOS_ORDER_CODE.eq(payosOrderCode));
    }

    public String generateNextOrderCode(LocalDate today) {
        String prefix = "DB" + today.format(CODE_DATE_FORMAT);
        String maxCode = dslContext.select(DSL.max(PAYMENT_ORDER.CODE))
                .from(PAYMENT_ORDER)
                .where(PAYMENT_ORDER.CODE.like(prefix + "%"))
                .fetchOneInto(String.class);

        if (maxCode == null || maxCode.length() <= prefix.length()) {
            return prefix + "0001";
        }
        try {
            int seq = Integer.parseInt(maxCode.substring(prefix.length()));
            return String.format("%s%04d", prefix, seq + 1);
        } catch (NumberFormatException e) {
            return prefix + "0001";
        }
    }

    public int markPaid(Integer id, String reference, String payload) {
        return dslContext.update(PAYMENT_ORDER)
                .set(PAYMENT_ORDER.STATUS, "PAID")
                .set(PAYMENT_ORDER.PAID_TIME, DSL.currentLocalDateTime())
                .set(PAYMENT_ORDER.PAYOS_REFERENCE, reference)
                .set(PAYMENT_ORDER.WEBHOOK_PAYLOAD, payload != null ? JSON.valueOf(payload) : null)
                .where(PAYMENT_ORDER.ID.eq(id).and(PAYMENT_ORDER.STATUS.eq("PENDING")))
                .execute();
    }

    public int markCancelled(Integer id) {
        return dslContext.update(PAYMENT_ORDER)
                .set(PAYMENT_ORDER.STATUS, "CANCELLED")
                .where(PAYMENT_ORDER.ID.eq(id).and(PAYMENT_ORDER.STATUS.eq("PENDING")))
                .execute();
    }

    public int expirePending(LocalDateTime threshold) {
        return dslContext.update(PAYMENT_ORDER)
                .set(PAYMENT_ORDER.STATUS, "EXPIRED")
                .where(PAYMENT_ORDER.STATUS.eq("PENDING").and(PAYMENT_ORDER.CREATED_TIME.lt(threshold)))
                .execute();
    }

    public List<UserSignal> purchaseSignals(Integer userId, LocalDateTime since) {
        if (userId == null) {
            return List.of();
        }
        var countField = DSL.count().as("count");
        var maxTimeField = DSL.max(PAYMENT_ORDER.PAID_TIME).as("last_time");

        return dslContext.select(PAYMENT_ORDER.SOURCE_LUT_ID, countField, maxTimeField)
                .from(PAYMENT_ORDER)
                .where(PAYMENT_ORDER.USER_ID.eq(userId)
                        .and(PAYMENT_ORDER.STATUS.eq("PAID"))
                        .and(PAYMENT_ORDER.SOURCE_LUT_ID.isNotNull())
                        .and(PAYMENT_ORDER.PAID_TIME.ge(since)))
                .groupBy(PAYMENT_ORDER.SOURCE_LUT_ID)
                .fetch(r -> new UserSignal(
                        "PURCHASE",
                        r.get(PAYMENT_ORDER.SOURCE_LUT_ID),
                        null,
                        null,
                        r.get(countField),
                        r.get(maxTimeField)
                ));
    }
}
