package vn.aeoc.business.lut.service;

import com.github.benmanes.caffeine.cache.Cache;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.business.lut.repository.LutCategoryRepository;
import vn.aeoc.entity.data.mysql.lut.LutCategory;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LutCategoryService {
    private final LutCategoryRepository repository;
    private final Cache<String, List<LutCategory>> lutCategoryCache;

    public List<LutCategory> listPublic() {
        return lutCategoryCache.get("all", key -> repository.getActive());
    }

    public LutCategory getPublic(String slug) {
        LutCategory category = repository.getActiveBySlug(slug);
        if (category == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy danh mục");
        }
        return category;
    }
}
