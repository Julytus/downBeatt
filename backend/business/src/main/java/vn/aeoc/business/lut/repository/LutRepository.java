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
import vn.aeoc.entity.data.mysql.lut.Creator;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutCategory;
import vn.aeoc.entity.data.mysql.lut.LutTag;
import vn.entity.backend.tables.records.LutRecord;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


import static org.jooq.impl.DSL.inline;
import static org.jooq.impl.DSL.selectCount;
import static org.jooq.impl.DSL.selectOne;
import static org.jooq.impl.DSL.when;
import static vn.entity.backend.tables.Creator.CREATOR;
import static vn.entity.backend.tables.Lut.LUT;
import static vn.entity.backend.tables.LutCategory.LUT_CATEGORY;
import static vn.entity.backend.tables.LutCategoryMap.LUT_CATEGORY_MAP;
import static vn.entity.backend.tables.LutColorFeature.LUT_COLOR_FEATURE;
import static vn.entity.backend.tables.LutSimilarity.LUT_SIMILARITY;
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

    public List<Lut> listPublishedByIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Lut> list = getListByCriteriaWithJoin(
                publicFields(),
                joined(),
                published().and(LUT.ID.in(ids)),
                (OrderField<?>) null);
        Map<Integer, Lut> byId = list.stream()
                .collect(Collectors.toMap(Lut::getId, l -> l, (a, b) -> a));
        List<Lut> ordered = new ArrayList<>(ids.size());
        for (Integer id : ids) {
            Lut item = byId.get(id);
            if (item != null) {
                ordered.add(item);
            }
        }
        return ordered;
    }

    public boolean isPublished(Integer id) {
        if (id == null) {
            return false;
        }
        return exists(published().and(LUT.ID.eq(id)));
    }

    public boolean existsPublishedStyle(String style) {
        if (style == null || style.isBlank()) {
            return false;
        }
        return exists(published().and(LUT.STYLE.eq(style.trim())));
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

    public List<Lut> similarPublished(Integer baseId, Pageable pageable) {
        List<Field<?>> fields = new ArrayList<>(publicFields());
        fields.add(LUT_SIMILARITY.SCORE.as("similarity"));
        Table<?> joinedTable = LUT.join(LUT_SIMILARITY)
                .on(LUT_SIMILARITY.SIMILAR_LUT_ID.eq(LUT.ID).and(LUT_SIMILARITY.LUT_ID.eq(baseId)))
                .leftJoin(CREATOR).on(CREATOR.ID.eq(LUT.CREATOR_ID));
        return getListByCriteriaWithJoin(
                fields,
                joinedTable,
                published(),
                List.of(LUT_SIMILARITY.SCORE.desc(), LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc()),
                pageable);
    }

    public List<Lut> similarPublishedAll(Integer baseId) {
        List<Field<?>> fields = new ArrayList<>(publicFields());
        fields.add(LUT_SIMILARITY.SCORE.as("similarity"));
        Table<?> joinedTable = LUT.join(LUT_SIMILARITY)
                .on(LUT_SIMILARITY.SIMILAR_LUT_ID.eq(LUT.ID).and(LUT_SIMILARITY.LUT_ID.eq(baseId)))
                .leftJoin(CREATOR).on(CREATOR.ID.eq(LUT.CREATOR_ID));
        return getListByCriteriaWithJoin(
                fields,
                joinedTable,
                published(),
                List.of(LUT_SIMILARITY.SCORE.desc(), LUT.DOWNLOAD_COUNT.desc(), LUT.ID.asc()));
    }

    public Long countSimilarPublished(Integer baseId) {
        return getCountWithCriteria(published().and(DSL.exists(selectOne().from(LUT_SIMILARITY)
                .where(LUT_SIMILARITY.LUT_ID.eq(baseId).and(LUT_SIMILARITY.SIMILAR_LUT_ID.eq(LUT.ID))))));
    }

    public List<Lut> listPublishedForIndex() {
        return dslContext.select(LUT.ID, LUT.TITLE, LUT.DESCRIPTION, LUT.CREATOR_ID, LUT.STYLE, LUT.DOWNLOAD_COUNT, LUT.SLUG, LUT.IS_PREMIUM, LUT.PUBLISHED_TIME)
                .from(LUT)
                .where(published())
                .fetchInto(Lut.class);
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

    private List<Field<?>> adminListFields() {
        return List.of(
                LUT.ID,
                LUT.SLUG,
                LUT.TITLE,
                CREATOR.NAME.as("creator_name"),
                LUT.STYLE,
                LUT.IS_PREMIUM,
                LUT.STATUS,
                LUT.DOWNLOAD_COUNT,
                LUT.PUBLISHED_TIME,
                LUT.UPDATED_TIME,
                LUT.COVER_URL
        );
    }

    private List<Field<?>> adminDetailFields() {
        return List.of(
                LUT.ID, LUT.SLUG, LUT.TITLE, LUT.DESCRIPTION, LUT.CREATOR_ID,
                CREATOR.NAME.as("creator_name"),
                LUT.STYLE, LUT.IS_PREMIUM, LUT.STATUS, LUT.PREVIEW_TYPE,
                LUT.COVER_URL, LUT.BEFORE_URL, LUT.AFTER_URL, LUT.PREVIEW_VIDEO_URL,
                LUT.FILE_KEY, LUT.FILE_SIZE_KB, LUT.LUT_SIZE,
                LUT.DOWNLOAD_COUNT, LUT.PUBLISHED_TIME,
                LUT.CREATED_BY, LUT.CREATED_TIME, LUT.UPDATED_TIME
        );
    }

    public List<Lut> adminList(String keyword, String style, String status, List<OrderField<?>> order, Pageable pageable) {
        return getListByCriteriaWithJoin(
                adminListFields(),
                joined(),
                getAdminCondition(keyword, style, status, null),
                order != null && !order.isEmpty() ? order : List.of(LUT.UPDATED_TIME.desc(), LUT.ID.desc()),
                pageable);
    }

    public List<Lut> adminList(String keyword, String style, String status, Pageable pageable) {
        return adminList(keyword, style, status, (List<OrderField<?>>) null, pageable);
    }

    public Long adminCount(String keyword, String style, String status) {
        return getCountWithCriteria(getAdminCondition(keyword, style, status, null));
    }

    public Lut getAdminById(Integer id) {
        return getByIdWithJoin(adminDetailFields(), joined(), id);
    }

    public boolean existsBySlug(String slug) {
        return exists(LUT.SLUG.eq(slug));
    }

    public void updateInfo(Lut lut) {
        updateByCondition(LUT.ID.eq(lut.getId()), lut,
                LUT.TITLE, LUT.DESCRIPTION, LUT.CREATOR_ID,
                LUT.STYLE, LUT.IS_PREMIUM, LUT.PREVIEW_TYPE);
    }

    public void updateFile(Integer id, String fileKey, Integer fileSizeKb, Integer lutSize) {
        Lut p = new Lut();
        p.setFileKey(fileKey);
        p.setFileSizeKb(fileSizeKb);
        p.setLutSize(lutSize);
        updateByCondition(LUT.ID.eq(id), p, LUT.FILE_KEY, LUT.FILE_SIZE_KB, LUT.LUT_SIZE);
    }

    public void updateStatus(Integer id, String status, LocalDateTime publishedTime) {
        if (publishedTime != null) {
            Lut p = new Lut();
            p.setStatus(status);
            p.setPublishedTime(publishedTime);
            updateByCondition(LUT.ID.eq(id), p, LUT.STATUS, LUT.PUBLISHED_TIME);
        } else {
            updateFieldByCondition(LUT.ID.eq(id), LUT.STATUS, status);
        }
    }

    public void updateCoverUrl(Integer id, String url) {
        updateFieldByCondition(LUT.ID.eq(id), LUT.COVER_URL, url);
    }

    public void updateBeforeUrl(Integer id, String url) {
        updateFieldByCondition(LUT.ID.eq(id), LUT.BEFORE_URL, url);
    }

    public void updateAfterUrl(Integer id, String url) {
        updateFieldByCondition(LUT.ID.eq(id), LUT.AFTER_URL, url);
    }

    public void updateVideoUrl(Integer id, String url) {
        updateFieldByCondition(LUT.ID.eq(id), LUT.PREVIEW_VIDEO_URL, url);
    }

    public void replaceTags(Integer lutId, List<String> tags) {
        dslContext.deleteFrom(LUT_TAG).where(LUT_TAG.LUT_ID.eq(lutId)).execute();
        if (tags != null && !tags.isEmpty()) {
            var insert = dslContext.insertInto(LUT_TAG, LUT_TAG.LUT_ID, LUT_TAG.TAG);
            for (String tag : tags) {
                insert = insert.values(lutId, tag);
            }
            insert.execute();
        }
    }

    public void replaceCategories(Integer lutId, List<Integer> categoryIds) {
        dslContext.deleteFrom(LUT_CATEGORY_MAP).where(LUT_CATEGORY_MAP.LUT_ID.eq(lutId)).execute();
        if (categoryIds != null && !categoryIds.isEmpty()) {
            var insert = dslContext.insertInto(LUT_CATEGORY_MAP, LUT_CATEGORY_MAP.LUT_ID, LUT_CATEGORY_MAP.CATEGORY_ID);
            for (Integer categoryId : categoryIds) {
                insert = insert.values(lutId, categoryId);
            }
            insert.execute();
        }
    }

    public List<String> getTags(Integer lutId) {
        return dslContext.select(LUT_TAG.TAG)
                .from(LUT_TAG)
                .where(LUT_TAG.LUT_ID.eq(lutId))
                .orderBy(LUT_TAG.TAG.asc())
                .fetch(LUT_TAG.TAG);
    }

    public List<String> getCategorySlugs(Integer lutId) {
        return dslContext.select(LUT_CATEGORY.SLUG)
                .from(LUT_CATEGORY_MAP)
                .join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(LUT_CATEGORY_MAP.CATEGORY_ID))
                .where(LUT_CATEGORY_MAP.LUT_ID.eq(lutId))
                .orderBy(LUT_CATEGORY.SORT_ORDER.asc(), LUT_CATEGORY.ID.asc())
                .fetch(LUT_CATEGORY.SLUG);
    }

    public int countNonSoftwareCategories(Integer lutId) {
        Integer count = dslContext.selectCount()
                .from(LUT_CATEGORY_MAP)
                .join(LUT_CATEGORY).on(LUT_CATEGORY.ID.eq(LUT_CATEGORY_MAP.CATEGORY_ID))
                .where(LUT_CATEGORY_MAP.LUT_ID.eq(lutId))
                .and(LUT_CATEGORY.GROUP_CODE.ne("phan-mem"))
                .fetchOne(0, Integer.class);
        return count == null ? 0 : count;
    }

    public List<LutCategory> getCategoriesBySlugs(Collection<String> slugs) {
        if (slugs == null || slugs.isEmpty()) {
            return List.of();
        }
        return dslContext.selectFrom(LUT_CATEGORY)
                .where(LUT_CATEGORY.SLUG.in(slugs))
                .fetchInto(LutCategory.class);
    }

    public List<Creator> listCreators() {
        return dslContext.select(CREATOR.ID, CREATOR.NAME, CREATOR.SLUG, CREATOR.STATUS)
                .from(CREATOR)
                .orderBy(CREATOR.NAME.asc())
                .fetchInto(Creator.class);
    }

    public boolean existsCreator(Integer id) {
        if (id == null) return false;
        return dslContext.fetchExists(
                dslContext.selectOne().from(CREATOR).where(CREATOR.ID.eq(id))
        );
    }

    public Lut getPublishedById(Integer id) {
        if (id == null) {
            return null;
        }
        return dslContext.select(LUT.ID, LUT.TITLE, LUT.IS_PREMIUM, LUT.FILE_KEY, LUT.SLUG)
                .from(LUT)
                .where(LUT.ID.eq(id).and(published()))
                .fetchOptionalInto(pojoClass)
                .orElse(null);
    }

    public int increaseDownloadCount(Integer id) {
        if (id == null) {
            return 0;
        }
        return dslContext.update(LUT)
                .set(LUT.DOWNLOAD_COUNT, LUT.DOWNLOAD_COUNT.plus(1))
                .where(LUT.ID.eq(id))
                .execute();
    }
}
