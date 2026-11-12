package vn.aeoc.business.lut.service;

import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.lut.repository.LutCategoryRepository;
import vn.aeoc.entity.data.mysql.lut.LutCategory;

import java.util.Collection;
import java.util.List;
import java.util.Map;

@Service
public class LutCategoryService extends BaseService<LutCategoryRepository, LutCategory, Integer> {
    private static final String CACHE_KEY = "all";

    private final Cache<String, List<LutCategory>> lutCategoryCache;

    public LutCategoryService(LutCategoryRepository repository,
                              @Qualifier("lutCategoryCache") Cache<String, List<LutCategory>> lutCategoryCache,
                              QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutCategoryCache = lutCategoryCache;
    }

    public List<LutCategory> listPublic() {
        return lutCategoryCache.get(CACHE_KEY, key -> repository.getActive());
    }

    public LutCategory getPublic(String slug) {
        LutCategory category = repository.getActiveBySlug(slug);
        if (category == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy danh mục");
        }
        return category;
    }

    public Map<String, Integer> activeIdsBySlugs(Collection<String> slugs) {
        if (slugs == null || slugs.isEmpty()) {
            return Map.of();
        }
        return repository.activeIdsBySlugs(slugs);
    }
}
