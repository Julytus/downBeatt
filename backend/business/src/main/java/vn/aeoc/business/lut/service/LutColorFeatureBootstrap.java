package vn.aeoc.business.lut.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import vn.aeoc.authenticate.service.FileStorageService;
import vn.aeoc.business.lut.repository.LutColorFeatureRepository;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Component
public class LutColorFeatureBootstrap {

    private final LutRepository lutRepository;
    private final LutColorFeatureRepository colorFeatureRepository;
    private final LutColorFeatureService colorFeatureService;
    private final FileStorageService fileStorageService;

    @Value("${lut.feature.compute-on-startup:true}")
    private boolean computeOnStartup = true;

    public LutColorFeatureBootstrap(LutRepository lutRepository,
                                   LutColorFeatureRepository colorFeatureRepository,
                                   LutColorFeatureService colorFeatureService,
                                   FileStorageService fileStorageService) {
        this.lutRepository = lutRepository;
        this.colorFeatureRepository = colorFeatureRepository;
        this.colorFeatureService = colorFeatureService;
        this.fileStorageService = fileStorageService;
    }

    public void setComputeOnStartup(boolean computeOnStartup) {
        this.computeOnStartup = computeOnStartup;
    }

    @Order(0)
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        runBootstrap();
    }

    public void onApplicationReady() {
        runBootstrap();
    }

    public void runBootstrap() {
        if (!computeOnStartup) {
            return;
        }

        try {
            List<Lut> lutsWithFile = lutRepository.getWithFile();
            List<Integer> existingIds = colorFeatureRepository.getLutIdsWithFeature();
            Set<Integer> existingSet = new HashSet<>(existingIds);

            List<Lut> missing = lutsWithFile.stream()
                    .filter(lut -> !existingSet.contains(lut.getId()))
                    .toList();

            int successCount = 0;
            int errorCount = 0;

            for (Lut lut : missing) {
                try {
                    byte[] cube = fileStorageService.readPrivate(lut.getFileKey());
                    colorFeatureService.computeAndSave(lut.getId(), cube);
                    successCount++;
                } catch (Exception e) {
                    errorCount++;
                    log.warn("Không tính được đặc trưng màu cho LUT slug='{}': {}", lut.getSlug(), e.getMessage());
                }
            }

            log.info("Đặc trưng màu: đã tính {} LUT, lỗi {} LUT", successCount, errorCount);
        } catch (Exception e) {
            log.warn("Lỗi khi khởi tạo đặc trưng màu: {}", e.getMessage());
        }
    }
}
