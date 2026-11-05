package vn.aeoc.business.lut.repository;

import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.springframework.stereotype.Repository;
import vn.entity.backend.tables.Creator;
import vn.entity.backend.tables.LutCategory;
import vn.entity.backend.tables.LutCategoryMap;
import vn.entity.backend.tables.LutTag;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.business.lut.constant.LutSort;
import vn.aeoc.business.lut.service.LutQuerySupport;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.util.List;

import static org.jooq.impl.DSL.*;

@Repository
@RequiredArgsConstructor
public class LutRepository {
    private final DSLContext dsl;

    private static final vn.entity.backend.tables.Lut LUT =
            vn.entity.backend.tables.Lut.LUT;
    private static final Creator CREATOR = Creator.CREATOR;
    private static final LutTag TAG = LutTag.LUT_TAG;
    private static final LutCategoryMap CATEGORY_MAP = LutCategoryMap.LUT_CATEGORY_MAP;
    private static final LutCategory CATEGORY = LutCategory.LUT_CATEGORY;

    private Condition condition(List<String> terms, List<String> styles, String category) {
        Condition where = LUT.STATUS.eq("PUBLISHED");
        if (styles != null && !styles.isEmpty()) {
            where = where.and(LUT.STYLE.in(styles));
        }
        if (category != null && !category.isBlank()) {
            where = where.andExists(
                    selectOne()
                            .from(CATEGORY_MAP.join(CATEGORY).on(CATEGORY_MAP.CATEGORY_ID.eq(CATEGORY.ID)))
                            .where(CATEGORY_MAP.LUT_ID.eq(LUT.ID)
                                    .and(CATEGORY.SLUG.eq(category))
                                    .and(CATEGORY.STATUS.eq((byte) 1)))
            );
        }
        if (terms != null) {
            for (String term : terms) {
                String like = LutQuerySupport.toLikePattern(term);
                Condition matchesTerm = LUT.TITLE.like(like, '\\')
                        .or(LUT.DESCRIPTION.like(like, '\\'))
                        .or(CREATOR.NAME.like(like, '\\'))
                        .orExists(
                                selectOne()
                                        .from(TAG)
                                        .where(TAG.LUT_ID.eq(LUT.ID).and(TAG.TAG.like(like, '\\')))
                        );
                where = where.and(matchesTerm);
            }
        }
        return where;
    }

    private Field<?>[] publicFields() {
        return new Field<?>[]{
                LUT.ID,
                LUT.SLUG,
                LUT.TITLE,
                LUT.DESCRIPTION,
                LUT.CREATOR_ID,
                CREATOR.NAME.as("creatorName"),
                LUT.STYLE,
                LUT.IS_PREMIUM,
                LUT.COVER_URL,
                LUT.PREVIEW_TYPE,
                LUT.BEFORE_URL,
                LUT.AFTER_URL,
                LUT.PREVIEW_VIDEO_URL,
                LUT.FILE_SIZE_KB,
                LUT.LUT_SIZE,
                LUT.DOWNLOAD_COUNT,
                LUT.PUBLISHED_TIME
        };
    }

    public List<Lut> searchPublished(
            List<String> terms,
            List<String> styles,
            String category,
            LutSort sort,
            Pageable pageable
    ) {
        Condition where = condition(terms, styles, category);
        var query = dsl.select(publicFields())
                .from(LUT.join(CREATOR).on(LUT.CREATOR_ID.eq(CREATOR.ID)))
                .where(where);
        if (sort == LutSort.NEWEST) {
            query.orderBy(LUT.PUBLISHED_TIME.desc(), LUT.ID.desc());
        } else if (sort == LutSort.POPULAR || terms == null || terms.isEmpty()) {
            query.orderBy(LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc());
        } else {
            query.orderBy(relevance(terms).desc(), LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc());
        }
        return query.limit(pageable.getLimit())
                .offset(pageable.getOffset())
                .fetchInto(Lut.class);
    }

    public long countPublished(List<String> terms, List<String> styles, String category) {
        return dsl.selectCount()
                .from(LUT.join(CREATOR).on(LUT.CREATOR_ID.eq(CREATOR.ID)))
                .where(condition(terms, styles, category))
                .fetchOne(0, long.class);
    }

    private Field<Integer> relevance(List<String> terms) {
        Field<Integer> score = inline(0);
        for (String term : terms) {
            String like = LutQuerySupport.toLikePattern(term);
            Field<Integer> termScore = when(LUT.TITLE.like(like, '\\'), 4).otherwise(0)
                    .add(when(exists(selectOne().from(TAG)
                            .where(TAG.LUT_ID.eq(LUT.ID).and(TAG.TAG.like(like, '\\')))), 3).otherwise(0))
                    .add(when(CREATOR.NAME.like(like, '\\'), 2).otherwise(0))
                    .add(when(LUT.DESCRIPTION.like(like, '\\'), 1).otherwise(0));
            score = score.add(termScore);
        }
        return score;
    }

    public Lut getPublishedBySlug(String slug) {
        return dsl.select(publicFields())
                .from(LUT.join(CREATOR).on(LUT.CREATOR_ID.eq(CREATOR.ID)))
                .where(LUT.SLUG.eq(slug).and(LUT.STATUS.eq("PUBLISHED")))
                .fetchOneInto(Lut.class);
    }

    public List<Lut> relatedPublished(Lut base, Pageable pageable) {
        var categoryMapA = CATEGORY_MAP.as("a");
        var categoryMapB = CATEGORY_MAP.as("b");
        Field<Integer> sharedCategories = selectCount()
                .from(categoryMapA.join(categoryMapB)
                        .on(field(name("a", "category_id"), Integer.class)
                                .eq(field(name("b", "category_id"), Integer.class)))
                        .join(CATEGORY)
                        .on(field(name("a", "category_id"), Integer.class).eq(CATEGORY.ID)))
                .where(field(name("a", "lut_id"), Integer.class).eq(LUT.ID)
                        .and(field(name("b", "lut_id"), Integer.class).eq(base.getId()))
                        .and(CATEGORY.STATUS.eq((byte) 1)))
                .asField();
        Field<Integer> score = when(LUT.STYLE.eq(base.getStyle()), 10)
                .otherwise(0)
                .add(sharedCategories);

        return dsl.select(publicFields())
                .from(LUT.join(CREATOR).on(LUT.CREATOR_ID.eq(CREATOR.ID)))
                .where(LUT.STATUS.eq("PUBLISHED").and(LUT.ID.ne(base.getId())))
                .orderBy(score.desc(), LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc())
                .limit(pageable.getLimit())
                .offset(pageable.getOffset())
                .fetchInto(Lut.class);
    }

    public long countRelatedPublished(Integer baseId) {
        return dsl.selectCount()
                .from(LUT)
                .where(LUT.STATUS.eq("PUBLISHED").and(LUT.ID.ne(baseId)))
                .fetchOne(0, long.class);
    }
}
