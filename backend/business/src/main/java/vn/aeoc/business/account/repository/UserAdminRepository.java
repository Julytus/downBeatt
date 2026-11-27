package vn.aeoc.business.account.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.Record;
import org.jooq.SelectJoinStep;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.account.UserAdminItem;
import vn.aeoc.entity.data.mysql.account.UserAdminStats;
import vn.aeoc.entity.data.mysql.account.UserAdminSubscription;
import vn.aeoc.entity.data.mysql.account.UserDownloadItem;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.entity.backend.tables.records.UserAppRecord;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import static vn.entity.backend.Tables.COLLECTION;
import static vn.entity.backend.Tables.DOWNLOAD_LOG;
import static vn.entity.backend.Tables.LUT;
import static vn.entity.backend.Tables.LUT_CATEGORY;
import static vn.entity.backend.Tables.PAYMENT_ORDER;
import static vn.entity.backend.Tables.PLAN;
import static vn.entity.backend.Tables.ROLE;
import static vn.entity.backend.Tables.SUBSCRIPTION;
import static vn.entity.backend.Tables.USER_APP;
import static vn.entity.backend.Tables.USER_PREFERENCE;

/** Truy vấn cho trang quản trị tài khoản (resource USER). */
@Repository
public class UserAdminRepository extends AbsMysqlRepository<UserAppRecord, User, Integer> {
    private static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final String FREE = "free";

    public UserAdminRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<UserAppRecord> getTable() {
        return USER_APP;
    }

    // ---- Danh sách / một dòng ----

    private Field<String> planCodeField() {
        return DSL.coalesce(PLAN.CODE, DSL.inline(FREE));
    }

    private Field<String> planNameField() {
        return DSL.coalesce(PLAN.NAME,
                DSL.field(DSL.select(DSL.max(PLAN.as("pf").NAME)).from(PLAN.as("pf"))
                        .where(PLAN.as("pf").CODE.eq(FREE))));
    }

    /** user_app + role + subscription còn hạn (như SubscriptionRepository.findActiveByUserId) + plan. */
    private Table<?> joined() {
        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        return USER_APP
                .leftJoin(ROLE).on(ROLE.ID.eq(USER_APP.ROLE_ID))
                .leftJoin(SUBSCRIPTION).on(SUBSCRIPTION.USER_ID.eq(USER_APP.ID)
                        .and(SUBSCRIPTION.STATUS.eq("ACTIVE"))
                        .and(SUBSCRIPTION.END_DATE.ge(today)))
                .leftJoin(PLAN).on(PLAN.ID.eq(SUBSCRIPTION.PLAN_ID));
    }

    private SelectJoinStep<? extends Record> baseSelect() {
        return dslContext.select(
                        USER_APP.ID, USER_APP.NAME, USER_APP.EMAIL, USER_APP.PHONE, USER_APP.AVATAR,
                        USER_APP.ROLE_ID, USER_APP.ACTIVE, USER_APP.REGIS_DATE,
                        ROLE.NAME, ROLE.IS_OPERATOR,
                        planCodeField().as("plan_code"), planNameField().as("plan_name"),
                        SUBSCRIPTION.END_DATE)
                .from(joined());
    }

    private Condition filter(String keyword, Integer roleId, String planCode, String status) {
        List<Condition> conditions = new ArrayList<>();
        if (keyword != null) {
            conditions.add(USER_APP.NAME.containsIgnoreCase(keyword)
                    .or(USER_APP.EMAIL.containsIgnoreCase(keyword))
                    .or(USER_APP.PHONE.containsIgnoreCase(keyword)));
        }
        if (roleId != null) {
            conditions.add(USER_APP.ROLE_ID.eq(roleId));
        }
        if (planCode != null) {
            conditions.add(planCodeField().eq(planCode));
        }
        if ("ACTIVE".equals(status)) {
            conditions.add(USER_APP.ACTIVE.eq(1));
        } else if ("LOCKED".equals(status)) {
            conditions.add(USER_APP.ACTIVE.ne(1).or(USER_APP.ACTIVE.isNull()));
        }
        return DSL.and(conditions);
    }

    public List<UserAdminItem> findPage(String keyword, Integer roleId, String planCode, String status,
                                        int offset, int limit) {
        return baseSelect()
                .where(filter(keyword, roleId, planCode, status))
                .orderBy(USER_APP.REGIS_DATE.desc(), USER_APP.ID.desc())
                .limit(limit)
                .offset(offset)
                .fetch(this::toItem);
    }

    public long count(String keyword, Integer roleId, String planCode, String status) {
        Long total = dslContext.selectCount()
                .from(joined())
                .where(filter(keyword, roleId, planCode, status))
                .fetchOneInto(Long.class);
        return total == null ? 0L : total;
    }

    public UserAdminItem findItem(Integer id) {
        if (id == null) return null;
        return baseSelect().where(USER_APP.ID.eq(id)).fetchOptional(this::toItem).orElse(null);
    }

    private UserAdminItem toItem(Record r) {
        UserAdminItem item = new UserAdminItem();
        item.setId(r.get(USER_APP.ID));
        item.setName(r.get(USER_APP.NAME));
        item.setEmail(r.get(USER_APP.EMAIL));
        item.setPhone(r.get(USER_APP.PHONE));
        item.setAvatar(r.get(USER_APP.AVATAR));
        item.setRoleId(r.get(USER_APP.ROLE_ID));
        item.setRoleName(r.get(ROLE.NAME));
        item.setIsOperator(r.get(ROLE.IS_OPERATOR) == null ? 0 : r.get(ROLE.IS_OPERATOR));
        item.setStatus(Integer.valueOf(1).equals(r.get(USER_APP.ACTIVE)) ? "ACTIVE" : "LOCKED");
        item.setRegisDate(r.get(USER_APP.REGIS_DATE));
        String planCode = r.get("plan_code", String.class);
        item.setPlanCode(planCode);
        item.setPlanName(r.get("plan_name", String.class));
        if (!FREE.equals(planCode)) {
            item.setPlanExpiresAt(r.get(SUBSCRIPTION.END_DATE));
        }
        return item;
    }

    // ---- Ghi ----

    public void setActive(Integer id, int active) {
        updateFieldByCondition(USER_APP.ID.eq(id), USER_APP.ACTIVE, active);
    }

    public void setRole(Integer id, Integer roleId) {
        updateFieldByCondition(USER_APP.ID.eq(id), USER_APP.ROLE_ID, roleId);
    }

    // ---- Chức vụ ----

    public Role findRole(Integer roleId) {
        if (roleId == null) return null;
        return dslContext.select(ROLE.ID, ROLE.NAME, ROLE.IS_DEFAULT, ROLE.IS_OPERATOR)
                .from(ROLE).where(ROLE.ID.eq(roleId))
                .fetchOptionalInto(Role.class).orElse(null);
    }

    public List<Role> roleOptions() {
        return dslContext.select(ROLE.ID, ROLE.NAME, ROLE.IS_DEFAULT, ROLE.IS_OPERATOR)
                .from(ROLE).orderBy(ROLE.ID.asc())
                .fetchInto(Role.class);
    }

    // ---- Chi tiết ----

    public UserAdminSubscription activeSubscription(Integer userId) {
        LocalDate today = LocalDate.now(DEFAULT_ZONE);
        return dslContext.select(PLAN.CODE, PLAN.NAME, SUBSCRIPTION.CYCLE, SUBSCRIPTION.START_DATE,
                        SUBSCRIPTION.END_DATE, SUBSCRIPTION.AUTO_RENEW)
                .from(SUBSCRIPTION)
                .join(PLAN).on(PLAN.ID.eq(SUBSCRIPTION.PLAN_ID))
                .where(SUBSCRIPTION.USER_ID.eq(userId)
                        .and(SUBSCRIPTION.STATUS.eq("ACTIVE"))
                        .and(SUBSCRIPTION.END_DATE.ge(today)))
                .orderBy(SUBSCRIPTION.END_DATE.desc())
                .limit(1)
                .fetchOptional(r -> {
                    UserAdminSubscription s = new UserAdminSubscription();
                    s.setPlanCode(r.get(PLAN.CODE));
                    s.setPlanName(r.get(PLAN.NAME));
                    s.setCycle(r.get(SUBSCRIPTION.CYCLE));
                    s.setStartDate(r.get(SUBSCRIPTION.START_DATE));
                    s.setEndDate(r.get(SUBSCRIPTION.END_DATE));
                    Byte autoRenew = r.get(SUBSCRIPTION.AUTO_RENEW);
                    s.setAutoRenew(autoRenew == null ? 0 : autoRenew.intValue());
                    return s;
                })
                .orElse(null);
    }

    public UserAdminStats stats(Integer userId) {
        Record paid = dslContext.select(DSL.count(PAYMENT_ORDER.ID), DSL.coalesce(DSL.sum(PAYMENT_ORDER.AMOUNT), 0L))
                .from(PAYMENT_ORDER)
                .where(PAYMENT_ORDER.USER_ID.eq(userId).and(PAYMENT_ORDER.STATUS.eq("PAID")))
                .fetchOne();
        long paidOrders = paid == null ? 0L : paid.get(0, Long.class);
        long totalPaid = paid == null ? 0L : paid.get(1, Long.class);
        long downloads = dslContext.fetchCount(DOWNLOAD_LOG, DOWNLOAD_LOG.USER_ID.eq(userId));
        long collections = dslContext.fetchCount(COLLECTION, COLLECTION.USER_ID.eq(userId));
        return new UserAdminStats(paidOrders, totalPaid, downloads, collections);
    }

    public List<String> preferences(Integer userId) {
        return dslContext.select(LUT_CATEGORY.NAME)
                .from(USER_PREFERENCE)
                .join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(USER_PREFERENCE.CATEGORY_ID))
                .where(USER_PREFERENCE.USER_ID.eq(userId))
                .orderBy(LUT_CATEGORY.NAME.asc())
                .fetchInto(String.class);
    }

    public List<UserDownloadItem> recentDownloads(Integer userId, int limit) {
        return dslContext.select(DOWNLOAD_LOG.LUT_ID, LUT.SLUG, LUT.TITLE, LUT.COVER_URL,
                        DOWNLOAD_LOG.PLAN_CODE, DOWNLOAD_LOG.CREATED_TIME)
                .from(DOWNLOAD_LOG)
                .leftJoin(LUT).on(LUT.ID.eq(DOWNLOAD_LOG.LUT_ID))
                .where(DOWNLOAD_LOG.USER_ID.eq(userId))
                .orderBy(DOWNLOAD_LOG.CREATED_TIME.desc(), DOWNLOAD_LOG.ID.desc())
                .limit(limit)
                .fetch(r -> {
                    UserDownloadItem d = new UserDownloadItem();
                    d.setLutId(r.get(DOWNLOAD_LOG.LUT_ID));
                    d.setLutSlug(r.get(LUT.SLUG));
                    d.setLutTitle(r.get(LUT.TITLE));
                    d.setCoverUrl(r.get(LUT.COVER_URL));
                    d.setPlanCode(r.get(DOWNLOAD_LOG.PLAN_CODE));
                    d.setCreatedTime(r.get(DOWNLOAD_LOG.CREATED_TIME));
                    return d;
                });
    }
}
