package vn.aeoc.business.lut.service;

import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.service.FileStorageService;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.base.util.Tuple2;
import vn.aeoc.business.lut.feature.ColorFeatureExtractor;
import vn.aeoc.business.lut.feature.CubeLut;
import vn.aeoc.business.lut.feature.CubeParser;
import vn.aeoc.business.lut.repository.LutColorFeatureRepository;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.lut.LutColorFeature;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class LutColorFeatureService extends BaseService<LutColorFeatureRepository, LutColorFeature, Integer> {

    private final LutRepository lutRepository;
    private final FileStorageService fileStorageService;

    public LutColorFeatureService(LutColorFeatureRepository repository,
                                  LutRepository lutRepository,
                                  FileStorageService fileStorageService,
                                  QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.lutRepository = lutRepository;
        this.fileStorageService = fileStorageService;
    }

    public Page<Lut> list(String keyword, String style, String status, Integer hasFeature,
                          Integer page, Integer limit) {
        int p = (page == null || page < 1) ? 1 : page;
        int l = (limit == null || limit <= 0) ? 10 : Math.min(limit, 100);
        Pageable pageable = new Pageable().setPage(p).setLimit(l).setOffset((p - 1) * l);

        Tuple2<List<Lut>, Long> res = queryExecutor.parallel2(
                () -> lutRepository.adminList(keyword, style, status, hasFeature, pageable),
                () -> lutRepository.adminCount(keyword, style, status, hasFeature)
        );

        pageable.setTotal(res.v2());
        List<Lut> items = res.v1();

        if (items != null && !items.isEmpty()) {
            List<Integer> ids = items.stream().map(Lut::getId).toList();
            List<LutColorFeature> features = repository.getByLutIds(ids);
            Map<Integer, LutColorFeature> featureMap = features.stream()
                    .collect(Collectors.toMap(LutColorFeature::getLutId, f -> f, (f1, f2) -> f1));
            for (Lut item : items) {
                item.setColorFeature(featureMap.get(item.getId()));
            }
        }

        return new Page<>(res.v2(), pageable.getPage(), items);
    }

    public List<Lut> recompute(List<Integer> ids) {
        List<Lut> luts;
        if (ids == null || ids.isEmpty()) {
            luts = lutRepository.getWithFile();
        } else {
            luts = lutRepository.getAdminByIds(ids);
            Set<Integer> foundIds = luts.stream().map(Lut::getId).collect(Collectors.toSet());
            for (Integer id : ids) {
                if (!foundIds.contains(id)) {
                    throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
                }
            }
        }

        luts.sort(Comparator.comparing(Lut::getId));

        List<Integer> allIds = luts.stream().map(Lut::getId).toList();
        Map<Integer, LutColorFeature> existingFeatures = repository.getByLutIds(allIds).stream()
                .collect(Collectors.toMap(LutColorFeature::getLutId, f -> f, (f1, f2) -> f1));

        for (Lut lut : luts) {
            if (lut.getFileKey() == null || lut.getFileKey().isBlank()) {
                lut.setColorFeature(existingFeatures.get(lut.getId()));
                lut.setFeatureError("LUT chưa có file .cube");
                continue;
            }

            byte[] cubeBytes;
            try {
                cubeBytes = fileStorageService.readPrivate(lut.getFileKey());
            } catch (Exception e) {
                lut.setColorFeature(existingFeatures.get(lut.getId()));
                lut.setFeatureError("Không đọc được file .cube");
                continue;
            }

            try {
                LutColorFeature feature = computeAndSave(lut.getId(), cubeBytes);
                lut.setColorFeature(feature);
                lut.setFeatureError(null);
            } catch (AppException e) {
                lut.setColorFeature(existingFeatures.get(lut.getId()));
                lut.setFeatureError(e.getMessage());
            } catch (Exception e) {
                lut.setColorFeature(existingFeatures.get(lut.getId()));
                lut.setFeatureError(e.getMessage());
            }
        }

        return luts;
    }

    public LutColorFeature computeAndSave(Integer lutId, byte[] cube) {
        if (cube == null || cube.length == 0) {
            throw new AppException(ErrorCode.LUT_FILE_INVALID, "File .cube không hợp lệ: thiếu LUT_3D_SIZE");
        }
        CubeLut lut = CubeParser.parse(new ByteArrayInputStream(cube));
        LutColorFeature feature = ColorFeatureExtractor.extract(lut);
        feature.setLutId(lutId);
        feature.setComputedTime(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        repository.upsert(feature);
        return feature;
    }
}
