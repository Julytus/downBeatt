package vn.aeoc.business.lut.repository;

import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Field;
import org.jooq.OrderField;
import org.jooq.Table;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.business.lut.constant.LutSort;
import vn.aeoc.business.lut.constant.LutStatus;
import vn.aeoc.business.lut.service.LutQuerySupport;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutTag;
import vn.entity.backend.tables.records.LutRecord;

import java.util.List;


import static org.jooq.impl.DSL.inline;
import static org.jooq.impl.DSL.selectCount;
import static org.jooq.impl.DSL.selectOne;
import static org.jooq.impl.DSL.when;
import static vn.entity.backend.tables.Creator.CREATOR;
import static vn.entity.backend.tables.Lut.LUT;
import static vn.entity.backend.tables.LutCategory.LUT_CATEGORY;
import static vn.entity.backend.tables.LutCategoryMap.LUT_CATEGORY_MAP;
import static vn.entity.backend.tables.LutColorFeature.LUT_COLOR_FEATURE;
import static vn.entity.backend.tables.LutTag.LUT_TAG;

@Repository
public class LutRepository extends AbsMysqlRepository<LutRecord, Lut, Integer> {
    public LutRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<LutRecord> getTable() {
        return LUT;
    }

    private Table<?> joined() {
        return LUT.leftJoin(CREATOR).on(CREATOR.ID.eq(LUT.CREATOR_ID));
    }

    /** Cột trả ra API công khai: không có file_key, status, created_*. */
    private List<Field<?>> publicFields() {
        return List.of(
                LUT.ID, LUT.SLUG, LUT.TITLE, LUT.DESCRIPTION, LUT.CREATOR_ID,
                CREATOR.NAME.as("creator_name"),
                LUT.STYLE, LUT.IS_PREMIUM, LUT.COVER_URL, LUT.PREVIEW_TYPE,
                LUT.BEFORE_URL, LUT.AFTER_URL, LUT.PREVIEW_VIDEO_URL,
                LUT.FILE_SIZE_KB, LUT.LUT_SIZE, LUT.DOWNLOAD_COUNT, LUT.PUBLISHED_TIME);
    }

    private static Condition published() {
        return LUT.STATUS.eq(LutStatus.PUBLISHED.name());
    }

    private static Condition tagLike(String like) {
        return DSL.exists(selectOne().from(LUT_TAG)
                .where(LUT_TAG.LUT_ID.eq(LUT.ID).and(LUT_TAG.TAG.like(like, '\\'))));
    }

    private static Condition creatorLike(String like) {
        return DSL.exists(selectOne().from(CREATOR)
                .where(CREATOR.ID.eq(LUT.CREATOR_ID).and(CREATOR.NAME.like(like, '\\'))));
    }

    /** Dùng chung cho list và count; chỉ tham chiếu bảng LUT (tác giả, thẻ, danh mục qua EXISTS). */
    private Condition getWhereCondition(List<String> terms, List<String> styles, String category) {
        Condition condition = published();
        if (styles != null && !styles.isEmpty()) {
            condition = condition.and(LUT.STYLE.in(styles));
        }
        if (category != null && !category.isBlank()) {
            condition = condition.andExists(selectOne()
                    .from(LUT_CATEGORY_MAP.join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(LUT_CATEGORY_MAP.CATEGORY_ID)))
                    .where(LUT_CATEGORY_MAP.LUT_ID.eq(LUT.ID)
                            .and(LUT_CATEGORY.SLUG.eq(category))
                            .and(LUT_CATEGORY.STATUS.eq((byte) 1))));
        }
        if (terms != null) {
            for (String term : terms) {
                String like = LutQuerySupport.toLikePattern(term);
                condition = condition.and(LUT.TITLE.like(like, '\\')
                        .or(LUT.DESCRIPTION.like(like, '\\'))
                        .or(creatorLike(like))
                        .or(tagLike(like)));
            }
        }
        return condition;
    }

    /** Điểm liên quan: 4·tiêu đề + 3·thẻ + 2·tác giả + 1·mô tả, cộng dồn theo từ khoá. */
    private static Field<Integer> relevance(List<String> terms) {
        Field<Integer> score = inline(0);
        for (String term : terms) {
            String like = LutQuerySupport.toLikePattern(term);
            score = score
                    .add(when(LUT.TITLE.like(like, '\\'), inline(4)).otherwise(inline(0)))
                    .add(when(tagLike(like), inline(3)).otherwise(inline(0)))
                    .add(when(CREATOR.NAME.like(like, '\\'), inline(2)).otherwise(inline(0)))
                    .add(when(LUT.DESCRIPTION.like(like, '\\'), inline(1)).otherwise(inline(0)));
        }
        return score;
    }

    private static List<OrderField<?>> orders(List<String> terms, LutSort sort) {
        if (sort == LutSort.NEWEST) {
            return List.of(LUT.PUBLISHED_TIME.desc(), LUT.ID.desc());
        }
        if (sort == LutSort.POPULAR || terms == null || terms.isEmpty()) {
            return List.of(LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc());
        }
        return List.of(relevance(terms).desc(), LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc());
    }

    public List<Lut> searchPublished(List<String> terms, List<String> styles, String category,
                                     LutSort sort, Pageable pageable) {
        return getListByCriteriaWithJoin(
                publicFields(),
                joined(),
                getWhereCondition(terms, styles, category),
                orders(terms, sort),
                pageable);
    }

    public Long countPublished(List<String> terms, List<String> styles, String category) {
        return getCountWithCriteria(getWhereCondition(terms, styles, category));
    }

    public Lut getPublishedBySlug(String slug) {
        return getOneByCriteriaWithJoin(publicFields(), joined(), published().and(LUT.SLUG.eq(slug)));
    }

    /** Điểm = 10·[cùng style] + số danh mục đang hiện mà hai LUT cùng thuộc. */
    public List<Lut> relatedPublished(Lut base, Pageable pageable) {
        var mine = LUT_CATEGORY_MAP.as("mine");
        var other = LUT_CATEGORY_MAP.as("other");
        Field<Integer> sharedCategories = selectCount()
                .from(other
                        .join(mine).on(mine.CATEGORY_ID.eq(other.CATEGORY_ID))
                        .join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(other.CATEGORY_ID)))
                .where(other.LUT_ID.eq(LUT.ID)
                        .and(mine.LUT_ID.eq(base.getId()))
                        .and(LUT_CATEGORY.STATUS.eq((byte) 1)))
                .asField();
        Field<Integer> score = when(LUT.STYLE.eq(base.getStyle()), inline(10)).otherwise(inline(0))
                .add(sharedCategories);
        return getListByCriteriaWithJoin(
                publicFields(),
                joined(),
                relatedCondition(base.getId()),
                List.of(score.desc(), LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc()),
                pageable);
    }

    public Long countRelatedPublished(Integer baseId) {
        return getCountWithCriteria(relatedCondition(baseId));
    }

    private static Condition relatedCondition(Integer baseId) {
        return published().and(LUT.ID.ne(baseId));
    }

    /** Thẻ của cả trang trong một truy vấn (bảng lut_tag không có cột id nên không có repository riêng). */
    public List<LutTag> getTagsByLutIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return dslContext.select(LUT_TAG.LUT_ID, LUT_TAG.TAG)
                .from(LUT_TAG)
                .where(LUT_TAG.LUT_ID.in(ids))
                .orderBy(LUT_TAG.TAG.asc())
                .fetchInto(LutTag.class);
    }

    private List<Field<?>> adminFields() {
        return List.of(
                LUT.ID,
                LUT.SLUG,
                LUT.TITLE,
                CREATOR.NAME.as("creator_name"),
                LUT.STYLE,
                LUT.STATUS,
                LUT.COVER_URL,
                LUT.FILE_KEY,
                LUT.LUT_SIZE
        );
    }

    private Condition getAdminCondition(String keyword, String style, String status, Integer hasFeature) {
        Condition condition = DSL.noCondition();
        if (keyword != null && !keyword.isBlank()) {
            String like = LutQuerySupport.toLikePattern(keyword.trim());
            condition = condition.and(LUT.TITLE.like(like, '\\').or(LUT.SLUG.like(like, '\\')));
        }
        if (style != null && !style.isBlank()) {
            condition = condition.and(LUT.STYLE.eq(style.trim()));
        }
        if (status != null && !status.isBlank()) {
            condition = condition.and(LUT.STATUS.eq(status.trim()));
        }
        if (hasFeature != null) {
            var featureExists = selectOne().from(LUT_COLOR_FEATURE)
                    .where(LUT_COLOR_FEATURE.LUT_ID.eq(LUT.ID));
            if (hasFeature == 1) {
                condition = condition.and(DSL.exists(featureExists));
            } else if (hasFeature == 0) {
                condition = condition.and(DSL.notExists(featureExists));
            }
        }
        return condition;
    }

    public List<Lut> adminList(String keyword, String style, String status, Integer hasFeature, Pageable pageable) {
        return getListByCriteriaWithJoin(
                adminFields(),
                joined(),
                getAdminCondition(keyword, style, status, hasFeature),
                List.of(LUT.ID.asc()),
                pageable);
    }

    public Long adminCount(String keyword, String style, String status, Integer hasFeature) {
        return getCountWithCriteria(getAdminCondition(keyword, style, status, hasFeature));
    }

    public List<Lut> getAdminByIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        return getListByCriteriaWithJoin(
                adminFields(),
                joined(),
                LUT.ID.in(ids),
                List.of(LUT.ID.asc()));
    }

    public List<Lut> getWithFile() {
        return getListByCriteriaWithJoin(
                adminFields(),
                joined(),
                LUT.FILE_KEY.isNotNull().and(LUT.FILE_KEY.ne("")),
                List.of(LUT.ID.asc()));
    }
}
