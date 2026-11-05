package vn.aeoc.business.lut.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.business.lut.constant.LutSort;
import vn.aeoc.business.lut.repository.LutCategoryRepository;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.business.lut.repository.LutTagRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutTag;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LutService {
    private final LutRepository repository;
    private final LutTagRepository tagRepository;
    private final LutCategoryRepository categoryRepository;

    public Page<Lut> list(
            String q,
            List<String> keywords,
            List<String> styles,
            String category,
            String sort,
            Integer page,
            Integer limit
    ) {
        List<String> terms = normalizeTerms(q, keywords);
        Pageable pageable = pageable(page, limit, 12);
        LutSort lutSort = LutSort.parse(sort);
        List<Lut> items = repository.searchPublished(terms, styles, category, lutSort, pageable);
        long total = repository.countPublished(terms, styles, category);
        return enrich(items, total, pageable);
    }

    public Lut get(String slug) {
        Lut lut = repository.getPublishedBySlug(slug);
        if (lut == null) {
            throw notFound();
        }
        enrichItems(List.of(lut));
        return lut;
    }

    public Page<Lut> related(String slug, Integer page, Integer limit) {
        Lut base = repository.getPublishedBySlug(slug);
        if (base == null) {
            throw notFound();
        }
        Pageable pageable = pageable(page, limit, 12);
        List<Lut> items = repository.relatedPublished(base, pageable);
        long total = repository.countRelatedPublished(base.getId());
        return enrich(items, total, pageable);
    }

    public List<Lut> suggest(String q, Integer limit) {
        List<String> terms = normalizeTerms(q, List.of());
        int size = limit == null ? 4 : (limit <= 0 ? 4 : Math.min(limit, 10));
        Pageable pageable = pageable(1, size, 4);
        LutSort sort = terms.isEmpty() ? LutSort.POPULAR : LutSort.RELEVANCE;
        List<Lut> items = repository.searchPublished(terms, null, null, sort, pageable);
        return enrichItems(items);
    }

    static List<String> normalizeTerms(String q, List<String> keywords) {
        return LutQuerySupport.normalizeTerms(q, keywords);
    }

    private Pageable pageable(Integer page, Integer limit, int defaultLimit) {
        int currentPage = page == null || page < 1 ? 1 : page;
        int currentLimit = limit == null || limit <= 0 ? defaultLimit : Math.min(limit, 48);
        return new Pageable()
                .setPage(currentPage)
                .setLimit(currentLimit)
                .setOffset((currentPage - 1) * currentLimit);
    }

    private Page<Lut> enrich(List<Lut> items, long total, Pageable pageable) {
        enrichItems(items);
        pageable.setTotal(total);
        return new Page<>(pageable, items);
    }

    private List<Lut> enrichItems(List<Lut> items) {
        List<Integer> ids = items.stream().map(Lut::getId).toList();
        if (!ids.isEmpty()) {
            Map<Integer, List<String>> tags = tagRepository.getByLutIds(ids).stream()
                    .collect(Collectors.groupingBy(
                            LutTag::getLutId,
                            LinkedHashMap::new,
                            Collectors.mapping(LutTag::getTag, Collectors.toList())
                    ));
            Map<Integer, List<String>> categories = categoryRepository.getActiveSlugsByLutIds(ids);
            for (Lut item : items) {
                item.setTags(tags.getOrDefault(item.getId(), List.of()));
                item.setCategories(categories.getOrDefault(item.getId(), List.of()));
            }
        }
        return items;
    }

    private AppException notFound() {
        return new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
    }
}
