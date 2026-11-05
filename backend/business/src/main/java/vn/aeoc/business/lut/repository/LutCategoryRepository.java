package vn.aeoc.business.lut.repository;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;
import vn.entity.backend.tables.LutCategoryMap;
import vn.aeoc.entity.data.mysql.lut.LutCategory;

import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class LutCategoryRepository {
    private final DSLContext dsl;

    private final vn.entity.backend.tables.LutCategory category =
            vn.entity.backend.tables.LutCategory.LUT_CATEGORY;
    private final LutCategoryMap categoryMap = LutCategoryMap.LUT_CATEGORY_MAP;

    public List<LutCategory> getActive() {
        return dsl.select(
                        category.ID,
                        category.SLUG,
                        category.NAME,
                        category.GROUP_CODE,
                        category.DESCRIPTION,
                        category.IS_POPULAR,
                        category.SORT_ORDER,
                        category.STATUS
                )
                .from(category)
                .where(category.STATUS.eq((byte) 1))
                .orderBy(category.SORT_ORDER.asc(), category.ID.asc())
                .fetchInto(LutCategory.class);
    }

    public LutCategory getActiveBySlug(String slug) {
        return dsl.select(
                        category.ID,
                        category.SLUG,
                        category.NAME,
                        category.GROUP_CODE,
                        category.DESCRIPTION,
                        category.IS_POPULAR,
                        category.SORT_ORDER,
                        category.STATUS
                )
                .from(category)
                .where(category.SLUG.eq(slug).and(category.STATUS.eq((byte) 1)))
                .fetchOneInto(LutCategory.class);
    }

    public Map<Integer, List<String>> getActiveSlugsByLutIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        return dsl.select(categoryMap.LUT_ID, category.SLUG)
                .from(categoryMap.join(category).on(categoryMap.CATEGORY_ID.eq(category.ID)))
                .where(categoryMap.LUT_ID.in(ids).and(category.STATUS.eq((byte) 1)))
                .orderBy(category.SORT_ORDER.asc())
                .fetchGroups(categoryMap.LUT_ID, category.SLUG);
    }
}
