package vn.aeoc.business.account.repository;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.account.UserPreference;
import vn.entity.backend.tables.records.UserPreferenceRecord;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

import static vn.entity.backend.tables.LutCategory.LUT_CATEGORY;
import static vn.entity.backend.tables.UserPreference.USER_PREFERENCE;

@Repository
public class UserPreferenceRepository extends AbsMysqlRepository<UserPreferenceRecord, UserPreference, Integer> {
    public UserPreferenceRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<UserPreferenceRecord> getTable() {
        return USER_PREFERENCE;
    }

    public List<String> slugsByUser(Integer userId) {
        if (userId == null) {
            return List.of();
        }
        return dslContext.select(LUT_CATEGORY.SLUG)
                .from(USER_PREFERENCE)
                .join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(USER_PREFERENCE.CATEGORY_ID))
                .where(USER_PREFERENCE.USER_ID.eq(userId).and(LUT_CATEGORY.STATUS.eq((byte) 1)))
                .orderBy(LUT_CATEGORY.SORT_ORDER.asc(), LUT_CATEGORY.ID.asc())
                .fetch(LUT_CATEGORY.SLUG);
    }

    public int deleteByUser(Integer userId) {
        if (userId == null) {
            return 0;
        }
        return delete(USER_PREFERENCE.USER_ID.eq(userId));
    }

    public void insertAll(Integer userId, Collection<Integer> categoryIds, LocalDateTime now) {
        if (userId == null || categoryIds == null || categoryIds.isEmpty()) {
            return;
        }
        var insertStep = dslContext.insertInto(USER_PREFERENCE,
                USER_PREFERENCE.USER_ID, USER_PREFERENCE.CATEGORY_ID, USER_PREFERENCE.CREATED_TIME);
        for (Integer categoryId : categoryIds) {
            insertStep = insertStep.values(userId, categoryId, now);
        }
        insertStep.execute();
    }
}
