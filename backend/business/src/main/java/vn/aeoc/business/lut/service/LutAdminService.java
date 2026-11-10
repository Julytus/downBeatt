package vn.aeoc.business.lut.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import vn.aeoc.authenticate.service.FileStorageService;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.lut.constant.LutUploadKind;
import vn.aeoc.business.lut.feature.CubeLut;
import vn.aeoc.business.lut.feature.CubeParser;
import vn.aeoc.business.lut.repository.LutColorFeatureRepository;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.mysql.lut.Creator;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutCategory;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LutAdminService extends BaseService<LutRepository, Lut, Integer> {

    private final LutColorFeatureService lutColorFeatureService;
    private final LutColorFeatureRepository lutColorFeatureRepository;
    private final FileStorageService fileStorageService;

    public LutAdminService(LutRepository repository,
                           LutColorFeatureService lutColorFeatureService,
                           LutColorFeatureRepository lutColorFeatureRepository,
                           FileStorageService fileStorageService,
                           QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutColorFeatureService = lutColorFeatureService;
        this.lutColorFeatureRepository = lutColorFeatureRepository;
        this.fileStorageService = fileStorageService;
    }

    public Page<Lut> list(String keyword, String status, String style, Integer page, Integer limit) {
        int p = (page == null || page < 1) ? 1 : page;
        int l = (limit == null || limit <= 0) ? 10 : Math.min(limit, 100);
        Pageable pageable = new Pageable().setPage(p).setLimit(l).setOffset((p - 1) * l);

        return pageQuery(pageable,
                () -> repository.adminList(keyword, style, status, pageable),
                () -> repository.adminCount(keyword, style, status));
    }

    public Lut get(Integer id) {
        Lut lut = repository.getAdminById(require(id).getId());
        enrichDetail(lut);
        return lut;
    }

    @Transactional
    public Lut upsert(User login, Lut request) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        List<String> normalizedTags = normalizeTags(request.getTags());
        List<LutCategory> validatedCats = validateCategories(request.getCategories());
        List<Integer> categoryIds = validatedCats.stream().map(LutCategory::getId).toList();

        if (creating) {
            if (request.getCreatorId() == null || !repository.existsCreator(request.getCreatorId())) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Tác giả không tồn tại");
            }

            String title = trim(request.getTitle());
            String baseSlug = LutSlugGenerator.toSlug(title);
            String slug = LutSlugGenerator.nextFree(baseSlug, repository::existsBySlug);

            request.setId(null);
            request.setTitle(title);
            request.setDescription(trim(request.getDescription()));
            request.setSlug(slug);
            request.setStatus("DRAFT");
            request.setDownloadCount(0);
            request.setIsPremium(request.getIsPremium() == null ? 0 : request.getIsPremium());
            request.setPreviewType(request.getPreviewType() == null || request.getPreviewType().isBlank()
                    ? "BEFORE_AFTER" : request.getPreviewType().trim());
            request.setCoverUrl(null);
            request.setBeforeUrl(null);
            request.setAfterUrl(null);
            request.setPreviewVideoUrl(null);
            request.setFileKey(null);
            request.setFileSizeKb(null);
            request.setLutSize(null);
            request.setPublishedTime(null);
            request.setCreatedBy(login != null ? login.getId() : null);
            request.setCreatedTime(null);
            request.setUpdatedTime(null);

            Lut inserted = insert(request);
            repository.replaceTags(inserted.getId(), normalizedTags);
            repository.replaceCategories(inserted.getId(), categoryIds);
            return get(inserted.getId());
        }

        Lut current = repository.getAdminById(require(request.getId()).getId());

        if (request.getCreatorId() == null || !repository.existsCreator(request.getCreatorId())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Tác giả không tồn tại");
        }

        if ("PUBLISHED".equals(current.getStatus())) {
            Lut candidate = new Lut();
            candidate.setId(current.getId());
            candidate.setTitle(trim(request.getTitle()));
            candidate.setDescription(trim(request.getDescription()));
            candidate.setCreatorId(request.getCreatorId());
            candidate.setStyle(request.getStyle());
            candidate.setIsPremium(request.getIsPremium() == null ? 0 : request.getIsPremium());
            candidate.setPreviewType(request.getPreviewType() == null || request.getPreviewType().isBlank()
                    ? current.getPreviewType() : request.getPreviewType().trim());
            candidate.setStatus(current.getStatus());
            candidate.setCoverUrl(current.getCoverUrl());
            candidate.setBeforeUrl(current.getBeforeUrl());
            candidate.setAfterUrl(current.getAfterUrl());
            candidate.setPreviewVideoUrl(current.getPreviewVideoUrl());
            candidate.setFileKey(current.getFileKey());

            boolean hasFeature = !lutColorFeatureRepository.getByLutIds(List.of(current.getId())).isEmpty();
            checkPublishable(candidate, normalizedTags, validatedCats, hasFeature);
        }

        current.setTitle(trim(request.getTitle()));
        current.setDescription(trim(request.getDescription()));
        current.setCreatorId(request.getCreatorId());
        current.setStyle(request.getStyle());
        current.setIsPremium(request.getIsPremium() == null ? 0 : request.getIsPremium());
        current.setPreviewType(request.getPreviewType() == null || request.getPreviewType().isBlank()
                ? "BEFORE_AFTER" : request.getPreviewType().trim());

        repository.updateInfo(current);
        repository.replaceTags(current.getId(), normalizedTags);
        repository.replaceCategories(current.getId(), categoryIds);

        return get(current.getId());
    }

    @Transactional
    public Integer delete(Integer id) {
        Lut lut = repository.getAdminById(require(id).getId());
        if ("PUBLISHED".equals(lut.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "LUT đang xuất bản, hãy ẩn trước khi xoá");
        }
        if (lut.getDownloadCount() != null && lut.getDownloadCount() > 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "LUT đã có lượt tải, chỉ ẩn được, không xoá được");
        }
        repository.delete(lut.getId());
        return lut.getId();
    }

    @Transactional
    public Lut publish(Integer id) {
        Lut lut = repository.getAdminById(require(id).getId());
        if ("PUBLISHED".equals(lut.getStatus())) {
            return get(lut.getId());
        }

        List<String> tags = repository.getTags(lut.getId());
        List<String> categorySlugs = repository.getCategorySlugs(lut.getId());
        List<LutCategory> categories = repository.getCategoriesBySlugs(categorySlugs);
        boolean hasFeature = !lutColorFeatureRepository.getByLutIds(List.of(lut.getId())).isEmpty();

        checkPublishable(lut, tags, categories, hasFeature);

        LocalDateTime publishedTime = lut.getPublishedTime() != null ? lut.getPublishedTime() : LocalDateTime.now();
        repository.updateStatus(lut.getId(), "PUBLISHED", publishedTime);
        return get(lut.getId());
    }

    @Transactional
    public Lut hide(Integer id) {
        Lut lut = repository.getAdminById(require(id).getId());
        if ("HIDDEN".equals(lut.getStatus())) {
            return get(lut.getId());
        }
        if ("DRAFT".equals(lut.getStatus())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Chỉ ẩn được LUT đang xuất bản");
        }
        repository.updateStatus(lut.getId(), "HIDDEN", null);
        return get(lut.getId());
    }

    public List<Creator> creators() {
        return repository.listCreators();
    }

    @Transactional
    public Lut upload(Integer id, String kindStr, MultipartFile file) {
        Lut lut = repository.getAdminById(require(id).getId());

        LutUploadKind kind = LutUploadKind.from(kindStr);

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }

        String ext = fileStorageService.requireExtension(file, kind.getAllowedExtensions(), kind.getExtensionErrorMessage());
        fileStorageService.requireMaxSize(file, kind.getMaxSize());

        if (kind == LutUploadKind.CUBE) {
            byte[] bytes;
            try {
                bytes = file.getBytes();
            } catch (Exception e) {
                throw new AppException(ErrorCode.UPLOAD_FILE_FAILED, "Không đọc được file");
            }

            CubeLut parsed = CubeParser.parse(new ByteArrayInputStream(bytes));

            String key = "lut/" + lut.getId() + "/" + UUID.randomUUID() + ".cube";
            fileStorageService.putPrivate(key, bytes, "text/plain; charset=utf-8");

            int fileSizeKb = (int) Math.ceil(bytes.length / 1024.0);
            int lutSize = parsed.size();

            repository.updateFile(lut.getId(), key, fileSizeKb, lutSize);
            lutColorFeatureService.computeAndSave(lut.getId(), bytes);

            return get(lut.getId());
        }

        fileStorageService.verifySignature(file, ext);

        String prefix = kind.getFilePrefix();
        String key = "lut/" + lut.getId() + "/" + prefix + "-" + UUID.randomUUID() + "." + ext;
        String contentType = LutUploadKind.contentTypeFor(ext);

        String url;
        try (InputStream stream = file.getInputStream()) {
            url = fileStorageService.putPublic(key, stream, file.getSize(), contentType);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        }

        switch (kind) {
            case COVER -> repository.updateCoverUrl(lut.getId(), url);
            case BEFORE -> repository.updateBeforeUrl(lut.getId(), url);
            case AFTER -> repository.updateAfterUrl(lut.getId(), url);
            case VIDEO -> repository.updateVideoUrl(lut.getId(), url);
            default -> {}
        }

        return get(lut.getId());
    }

    public void checkPublishable(Lut state, List<String> tags, List<LutCategory> categories, boolean hasFeature) {
        if (state.getCoverUrl() == null || state.getCoverUrl().isBlank()) {
            throw new AppException(ErrorCode.PREVIEW_MISSING);
        }
        String previewType = state.getPreviewType();
        if ("VIDEO".equalsIgnoreCase(previewType)) {
            if (state.getPreviewVideoUrl() == null || state.getPreviewVideoUrl().isBlank()) {
                throw new AppException(ErrorCode.PREVIEW_MISSING);
            }
        } else {
            if (state.getBeforeUrl() == null || state.getBeforeUrl().isBlank()
                    || state.getAfterUrl() == null || state.getAfterUrl().isBlank()) {
                throw new AppException(ErrorCode.PREVIEW_MISSING);
            }
        }

        if (state.getFileKey() == null || state.getFileKey().isBlank() || !hasFeature) {
            throw new AppException(ErrorCode.LUT_FILE_MISSING);
        }

        if (tags == null || tags.size() < 3) {
            throw new AppException(ErrorCode.LUT_FEATURE_MISSING);
        }
        long nonSoftwareCount = categories == null ? 0 : categories.stream()
                .filter(c -> c.getGroupCode() != null && !"phan-mem".equalsIgnoreCase(c.getGroupCode()))
                .count();
        if (nonSoftwareCount < 1) {
            throw new AppException(ErrorCode.LUT_FEATURE_MISSING);
        }
    }

    private void enrichDetail(Lut lut) {
        if (lut == null) return;
        List<String> tags = repository.getTags(lut.getId());
        lut.setTags(tags != null ? tags : List.of());

        List<String> categories = repository.getCategorySlugs(lut.getId());
        lut.setCategories(categories != null ? categories : List.of());

        List<LutColorFeature> features = lutColorFeatureRepository.getByLutIds(List.of(lut.getId()));
        if (!features.isEmpty()) {
            lut.setColorFeature(features.get(0));
        }
    }

    private List<String> normalizeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return List.of();
        }
        Set<String> unique = new LinkedHashSet<>();
        for (String tag : tags) {
            if (tag == null) continue;
            String normalized = tag.trim().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
            if (!normalized.isEmpty()) {
                unique.add(normalized);
            }
        }
        return new ArrayList<>(unique);
    }

    private List<LutCategory> validateCategories(List<String> categorySlugs) {
        if (categorySlugs == null || categorySlugs.isEmpty()) {
            return List.of();
        }
        List<String> uniqueSlugs = new ArrayList<>(new LinkedHashSet<>(categorySlugs));
        List<LutCategory> found = repository.getCategoriesBySlugs(uniqueSlugs);
        Map<String, LutCategory> slugMap = found.stream()
                .collect(Collectors.toMap(LutCategory::getSlug, c -> c, (c1, c2) -> c1));

        for (String slug : uniqueSlugs) {
            if (!slugMap.containsKey(slug)) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Danh mục không tồn tại: " + slug);
            }
        }
        return uniqueSlugs.stream().map(slugMap::get).toList();
    }

    private Lut require(Integer id) {
        Lut lut = id == null ? null : getById(id);
        if (lut == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
        }
        return lut;
    }

    private static String trim(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
