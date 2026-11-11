package vn.aeoc.business.lut.service;

import org.springframework.stereotype.Service;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.lut.constant.LutSort;
import vn.aeoc.business.lut.repository.LutCategoryRepository;
import vn.aeoc.business.lut.repository.LutColorFeatureRepository;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;
import vn.aeoc.entity.data.mysql.lut.LutTag;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LutService extends BaseService<LutRepository, Lut, Integer> {
    private static final int SUGGEST_DEFAULT_LIMIT = 4;
    private static final int SUGGEST_MAX_LIMIT = 10;

    private final LutCategoryRepository categoryRepository;
    private final LutColorFeatureRepository colorFeatureRepository;

    public LutService(LutRepository repository,
                      LutCategoryRepository categoryRepository,
                      LutColorFeatureRepository colorFeatureRepository,
                      QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.categoryRepository = categoryRepository;
        this.colorFeatureRepository = colorFeatureRepository;
    }

    public Page<Lut> list(String q, List<String> keywords, List<String> styles, String category,
                          String sort, Integer page, Integer limit) {
        List<String> terms = LutQuerySupport.normalizeTerms(q, keywords);
        LutSort lutSort = LutSort.parse(sort);
        Pageable pageable = pageable(LutQuerySupport.page(page), LutQuerySupport.limit(limit));
        Page<Lut> result = pageQuery(
                pageable,
                () -> repository.searchPublished(terms, styles, category, lutSort, pageable),
                () -> repository.countPublished(terms, styles, category));
        enrich(result.getItems());
        return result;
    }

    public Lut get(String slug) {
        Lut lut = requirePublished(slug);
        enrich(List.of(lut));
        return lut;
    }

    public Page<Lut> related(String slug, Integer page, Integer limit) {
        Lut base = requirePublished(slug);
        Pageable pageable = pageable(LutQuerySupport.page(page), LutQuerySupport.limit(limit));
        long countSimilar = repository.countSimilarPublished(base.getId());
        Page<Lut> result;
        if (countSimilar > 0) {
            result = pageQuery(
                    pageable,
                    () -> repository.similarPublished(base.getId(), pageable),
                    () -> countSimilar);
            if (result.getItems() != null) {
                for (Lut item : result.getItems()) {
                    if (item.getSimilarity() != null) {
                        item.setSimilarity(Math.round(item.getSimilarity() * 10000.0) / 10000.0);
                    }
                }
            }
        } else {
            result = pageQuery(
                    pageable,
                    () -> repository.relatedPublished(base, pageable),
                    () -> repository.countRelatedPublished(base.getId()));
        }
        enrich(result.getItems());
        return result;
    }

    public List<Lut> similarAll(String slug) {
        Lut base = requirePublished(slug);
        List<Lut> items = repository.similarPublishedAll(base.getId());
        enrich(items);
        return items;
    }

    public List<Lut> listPublishedForIndex() {
        List<Lut> items = repository.listPublishedForIndex();
        if (items == null || items.isEmpty()) {
            return List.of();
        }
        List<Integer> ids = items.stream().map(Lut::getId).toList();
        Map<Integer, List<String>> tags = repository.getTagsByLutIds(ids).stream()
                .collect(Collectors.groupingBy(LutTag::getLutId,
                        Collectors.mapping(LutTag::getTag, Collectors.toList())));
        Map<Integer, List<String>> categories = categoryRepository.getActiveNonSoftwareSlugsByLutIds(ids);
        Map<Integer, LutColorFeature> features = colorFeatureRepository.getByLutIds(ids).stream()
                .collect(Collectors.toMap(LutColorFeature::getLutId, f -> f, (f1, f2) -> f1));

        for (Lut item : items) {
            item.setTags(tags.getOrDefault(item.getId(), List.of()));
            item.setCategories(categories.getOrDefault(item.getId(), List.of()));
            item.setColorFeature(features.get(item.getId()));
        }
        return items;
    }

    /** q rỗng → phổ biến nhất; có chữ → cùng quy tắc relevance của list với một từ khoá. */
    public List<Lut> suggest(String q, Integer limit) {
        List<String> terms = LutQuerySupport.normalizeTerms(q, List.of());
        int size = limit == null || limit <= 0 ? SUGGEST_DEFAULT_LIMIT : Math.min(limit, SUGGEST_MAX_LIMIT);
        LutSort sort = terms.isEmpty() ? LutSort.POPULAR : LutSort.RELEVANCE;
        return enrich(repository.searchPublished(terms, null, null, sort, pageable(1, size)));
    }

    public List<Lut> listPublishedByIds(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Lut> list = repository.listPublishedByIds(ids);
        enrich(list);
        return list;
    }

    public boolean isPublished(Integer id) {
        if (id == null) {
            return false;
        }
        return repository.isPublished(id);
    }

    public boolean existsPublishedStyle(String style) {
        if (style == null || style.isBlank()) {
            return false;
        }
        return repository.existsPublishedStyle(style.trim());
    }

    private Lut requirePublished(String slug) {
        Lut lut = repository.getPublishedBySlug(slug);
        if (lut == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
        }
        return lut;
    }

    private static Pageable pageable(int page, int limit) {
        return new Pageable().setPage(page).setLimit(limit).setOffset((page - 1) * limit);
    }

    /** Ghép thẻ + danh mục cho cả trang bằng 2 truy vấn IN (…); trang rỗng thì không truy vấn. */
    private List<Lut> enrich(List<Lut> items) {
        if (items == null || items.isEmpty()) {
            return items;
        }
        List<Integer> ids = items.stream().map(Lut::getId).toList();
        Map<Integer, List<String>> tags = repository.getTagsByLutIds(ids).stream()
                .collect(Collectors.groupingBy(LutTag::getLutId,
                        Collectors.mapping(LutTag::getTag, Collectors.toList())));
        Map<Integer, List<String>> categories = categoryRepository.getActiveSlugsByLutIds(ids);
        for (Lut item : items) {
            item.setTags(tags.getOrDefault(item.getId(), List.of()));
            item.setCategories(categories.getOrDefault(item.getId(), List.of()));
        }
        return items;
    }
}
