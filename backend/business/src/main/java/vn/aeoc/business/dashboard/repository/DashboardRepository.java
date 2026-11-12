package vn.aeoc.business.dashboard.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.impl.DSL;
import org.jooq.impl.SQLDataType;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.business.dashboard.calc.CountDay;
import vn.aeoc.business.dashboard.calc.DownloadDay;
import vn.aeoc.business.dashboard.calc.RevenueDay;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;
import vn.aeoc.entity.data.mysql.dashboard.DashboardTopLut;
import vn.aeoc.entity.data.mysql.dashboard.PlanCustomers;
import vn.aeoc.entity.data.mysql.dashboard.PlanRevenue;
import vn.entity.backend.tables.records.PaymentOrderRecord;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static vn.entity.backend.Tables.CREATOR;
import static vn.entity.backend.Tables.DOWNLOAD_LOG;
import static vn.entity.backend.Tables.LUT;
import static vn.entity.backend.Tables.PAYMENT_ORDER;
import static vn.entity.backend.Tables.PLAN;
import static vn.entity.backend.Tables.ROLE;
import static vn.entity.backend.Tables.SUBSCRIPTION;
import static vn.entity.backend.Tables.USER_APP;

@Repository
public class DashboardRepository extends AbsMysqlRepository<PaymentOrderRecord, PaymentOrder, Integer> {

    public DashboardRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<PaymentOrderRecord> getTable() {
        return PAYMENT_ORDER;
    }

    private Condition customerCondition() {
        return USER_APP.ROLE_ID.in(
                DSL.select(ROLE.ID)
                        .from(ROLE)
                        .where(ROLE.IS_DEFAULT.eq(1).and(ROLE.IS_OPERATOR.eq(0)))
        );
    }

    public List<RevenueDay> revenueByDay(LocalDateTime fromInclusive, LocalDateTime toExclusive) {
        Field<LocalDate> dayField = DSL.field("DATE({0})", SQLDataType.LOCALDATE, PAYMENT_ORDER.PAID_TIME).as("day");
        return dslContext.select(
                        dayField,
                        DSL.coalesce(DSL.sum(PAYMENT_ORDER.AMOUNT), 0L).as("revenue"),
                        DSL.count(PAYMENT_ORDER.ID).as("orders")
                )
                .from(PAYMENT_ORDER)
                .where(PAYMENT_ORDER.STATUS.eq("PAID")
                        .and(PAYMENT_ORDER.PAID_TIME.ge(fromInclusive))
                        .and(PAYMENT_ORDER.PAID_TIME.lt(toExclusive)))
                .groupBy(dayField)
                .orderBy(dayField.asc())
                .fetch(r -> new RevenueDay(
                        r.get(dayField),
                        r.get("revenue", Long.class),
                        r.get("orders", Long.class)
                ));
    }

    public List<CountDay> newCustomersByDay(LocalDateTime fromInclusive, LocalDateTime toExclusive) {
        Field<LocalDate> dayField = DSL.field("DATE({0})", SQLDataType.LOCALDATE, USER_APP.REGIS_DATE).as("day");
        return dslContext.select(
                        dayField,
                        DSL.count(USER_APP.ID).as("count")
                )
                .from(USER_APP)
                .where(USER_APP.REGIS_DATE.ge(fromInclusive)
                        .and(USER_APP.REGIS_DATE.lt(toExclusive))
                        .and(customerCondition()))
                .groupBy(dayField)
                .orderBy(dayField.asc())
                .fetch(r -> new CountDay(
                        r.get(dayField),
                        r.get("count", Long.class)
                ));
    }

    public List<DownloadDay> downloadsByDay(LocalDateTime fromInclusive, LocalDateTime toExclusive) {
        Field<LocalDate> dayField = DSL.field("DATE({0})", SQLDataType.LOCALDATE, DOWNLOAD_LOG.CREATED_TIME).as("day");
        return dslContext.select(
                        dayField,
                        DSL.count().as("downloads"),
                        DSL.coalesce(DSL.sum(DSL.when(LUT.IS_PREMIUM.eq((byte) 1), 1L).otherwise(0L)), 0L).as("premium")
                )
                .from(DOWNLOAD_LOG)
                .join(LUT).on(LUT.ID.eq(DOWNLOAD_LOG.LUT_ID))
                .where(DOWNLOAD_LOG.CREATED_TIME.ge(fromInclusive)
                        .and(DOWNLOAD_LOG.CREATED_TIME.lt(toExclusive)))
                .groupBy(dayField)
                .orderBy(dayField.asc())
                .fetch(r -> new DownloadDay(
                        r.get(dayField),
                        r.get("downloads", Long.class),
                        r.get("premium", Long.class)
                ));
    }

    public List<PlanRevenue> revenueByPlan(LocalDateTime fromInclusive, LocalDateTime toExclusive) {
        return dslContext.select(
                        PLAN.CODE,
                        PLAN.NAME,
                        DSL.coalesce(DSL.sum(PAYMENT_ORDER.AMOUNT), 0L).as("revenue"),
                        DSL.count(PAYMENT_ORDER.ID).as("orders")
                )
                .from(PLAN)
                .leftJoin(PAYMENT_ORDER).on(
                        PAYMENT_ORDER.PLAN_ID.eq(PLAN.ID)
                                .and(PAYMENT_ORDER.STATUS.eq("PAID"))
                                .and(PAYMENT_ORDER.PAID_TIME.ge(fromInclusive))
                                .and(PAYMENT_ORDER.PAID_TIME.lt(toExclusive))
                )
                .where(PLAN.ACTIVE.eq((byte) 1).and(PLAN.CODE.ne("free")))
                .groupBy(PLAN.ID, PLAN.CODE, PLAN.NAME, PLAN.SORT_ORDER)
                .orderBy(PLAN.SORT_ORDER.asc(), PLAN.ID.asc())
                .fetch(r -> PlanRevenue.builder()
                        .planCode(r.get(PLAN.CODE))
                        .planName(r.get(PLAN.NAME))
                        .revenue(r.get("revenue", Long.class))
                        .paidOrders(r.get("orders", Long.class))
                        .build());
    }

    public long customerCount() {
        return dslContext.selectCount()
                .from(USER_APP)
                .where(customerCondition())
                .fetchOne(0, Long.class);
    }

    public List<PlanCustomers> paidCustomersByPlan(LocalDate today) {
        return dslContext.select(
                        PLAN.CODE,
                        PLAN.NAME,
                        DSL.countDistinct(SUBSCRIPTION.USER_ID).as("customers")
                )
                .from(PLAN)
                .leftJoin(SUBSCRIPTION).on(
                        SUBSCRIPTION.PLAN_ID.eq(PLAN.ID)
                                .and(SUBSCRIPTION.STATUS.eq("ACTIVE"))
                                .and(SUBSCRIPTION.END_DATE.ge(today))
                                .and(SUBSCRIPTION.USER_ID.in(
                                        DSL.select(USER_APP.ID)
                                                .from(USER_APP)
                                                .where(customerCondition())
                                ))
                )
                .where(PLAN.ACTIVE.eq((byte) 1))
                .groupBy(PLAN.ID, PLAN.CODE, PLAN.NAME, PLAN.SORT_ORDER)
                .orderBy(PLAN.SORT_ORDER.asc(), PLAN.ID.asc())
                .fetch(r -> PlanCustomers.builder()
                        .planCode(r.get(PLAN.CODE))
                        .planName(r.get(PLAN.NAME))
                        .customers(r.get("customers", Long.class))
                        .build());
    }

    public List<DashboardTopLut> topLuts(LocalDateTime fromInclusive, LocalDateTime toExclusive, int limit) {
        return dslContext.select(
                        LUT.ID,
                        LUT.SLUG,
                        LUT.TITLE,
                        LUT.COVER_URL,
                        LUT.IS_PREMIUM,
                        LUT.STATUS,
                        CREATOR.NAME.as("creator_name"),
                        DSL.count(DOWNLOAD_LOG.ID).as("downloads")
                )
                .from(DOWNLOAD_LOG)
                .join(LUT).on(LUT.ID.eq(DOWNLOAD_LOG.LUT_ID))
                .join(CREATOR).on(CREATOR.ID.eq(LUT.CREATOR_ID))
                .where(DOWNLOAD_LOG.CREATED_TIME.ge(fromInclusive)
                        .and(DOWNLOAD_LOG.CREATED_TIME.lt(toExclusive)))
                .groupBy(LUT.ID, LUT.SLUG, LUT.TITLE, LUT.COVER_URL, LUT.IS_PREMIUM, LUT.STATUS, CREATOR.NAME)
                .orderBy(DSL.count(DOWNLOAD_LOG.ID).desc(), LUT.ID.asc())
                .limit(limit)
                .fetch(r -> DashboardTopLut.builder()
                        .id(r.get(LUT.ID))
                        .slug(r.get(LUT.SLUG))
                        .title(r.get(LUT.TITLE))
                        .coverUrl(r.get(LUT.COVER_URL))
                        .isPremium(r.get(LUT.IS_PREMIUM) != null ? r.get(LUT.IS_PREMIUM).intValue() : 0)
                        .status(r.get(LUT.STATUS))
                        .creatorName(r.get("creator_name", String.class))
                        .downloads(r.get("downloads", Long.class))
                        .build());
    }
}
