package vn.aeoc.business.lut.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.lut.LutCategory;
import vn.entity.backend.tables.records.LutCategoryRecord;

import java.util.Collection;
import java.util.List;
import java.util.Map;

import static vn.entity.backend.tables.LutCategory.LUT_CATEGORY;
import static vn.entity.backend.tables.LutCategoryMap.LUT_CATEGORY_MAP;

@Repository
public class LutCategoryRepository extends AbsMysqlRepository<LutCategoryRecord, LutCategory, Integer> {
    public LutCategoryRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<LutCategoryRecord> getTable() {
        return LUT_CATEGORY;
    }

    private static Condition active() {
        return LUT_CATEGORY.STATUS.eq((byte) 1);
    }

    public List<LutCategory> getActive() {
        return getListByCriteriaWithJoin(
                getFields(),
                LUT_CATEGORY,
                active(),
                List.of(LUT_CATEGORY.SORT_ORDER.asc(), LUT_CATEGORY.ID.asc()));
    }

    public LutCategory getActiveBySlug(String slug) {
        return getOne(active().and(LUT_CATEGORY.SLUG.eq(slug)));
    }

    /** Slug danh mục đang hiện của nhiều LUT trong một truy vấn, xếp theo sort_order. */
    public Map<Integer, List<String>> getActiveSlugsByLutIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return dslContext.select(LUT_CATEGORY_MAP.LUT_ID, LUT_CATEGORY.SLUG)
                .from(LUT_CATEGORY_MAP.join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(LUT_CATEGORY_MAP.CATEGORY_ID)))
                .where(LUT_CATEGORY_MAP.LUT_ID.in(ids).and(active()))
                .orderBy(LUT_CATEGORY.SORT_ORDER.asc())
                .fetchGroups(LUT_CATEGORY_MAP.LUT_ID, LUT_CATEGORY.SLUG);
    }

    /** Slug danh mục đang hiện (khác nhóm phan-mem) của nhiều LUT trong một truy vấn. */
    public Map<Integer, List<String>> getActiveNonSoftwareSlugsByLutIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return dslContext.select(LUT_CATEGORY_MAP.LUT_ID, LUT_CATEGORY.SLUG)
                .from(LUT_CATEGORY_MAP.join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(LUT_CATEGORY_MAP.CATEGORY_ID)))
                .where(LUT_CATEGORY_MAP.LUT_ID.in(ids)
                        .and(active())
                        .and(LUT_CATEGORY.GROUP_CODE.ne("phan-mem")))
                .orderBy(LUT_CATEGORY.SORT_ORDER.asc())
                .fetchGroups(LUT_CATEGORY_MAP.LUT_ID, LUT_CATEGORY.SLUG);
    }

    public Map<String, Integer> activeIdsBySlugs(Collection<String> slugs) {
        if (slugs == null || slugs.isEmpty()) {
            return Map.of();
        }
        return dslContext.select(LUT_CATEGORY.SLUG, LUT_CATEGORY.ID)
                .from(LUT_CATEGORY)
                .where(LUT_CATEGORY.SLUG.in(slugs).and(active()))
                .fetchMap(LUT_CATEGORY.SLUG, LUT_CATEGORY.ID);
    }
}
