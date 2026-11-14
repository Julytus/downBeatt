package vn.aeoc.business.lut.seed;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import vn.aeoc.authenticate.service.FileStorageService;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Component
public class SeedAssetLoader {

    private final FileStorageService fileStorageService;
    private final LutRepository lutRepository;
    private final ObjectMapper objectMapper;
    private final SeedImageRenderer imageRenderer = new SeedImageRenderer();

    @Value("${seed.minio.enabled:false}")
    private boolean enabled;

    public SeedAssetLoader(FileStorageService fileStorageService,
                           LutRepository lutRepository,
                           ObjectMapper objectMapper) {
        this.fileStorageService = fileStorageService;
        this.lutRepository = lutRepository;
        this.objectMapper = objectMapper;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    @Order(-100)
    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        run();
    }

    public void onApplicationReady() {
        run();
    }

    public void run() {
        if (!enabled) {
            return;
        }

        try {
            fileStorageService.ensureBucket();

            ClassPathResource manifestRes = new ClassPathResource("seed/kho-lut/luts.json");
            List<SeedManifest> manifestList;
            try (InputStream is = manifestRes.getInputStream()) {
                JsonNode tree = objectMapper.readTree(is);
                JsonNode lutsNode = tree.has("luts") ? tree.get("luts") : tree;
                manifestList = objectMapper.readerForListOf(SeedManifest.class).readValue(lutsNode);
            }

            int totalLuts = manifestList.size();
            int existingCount = 0;
            int uploadedCount = 0;
            int skippedCount = 0;
            int errorCount = 0;

            String publicBucket = fileStorageService.publicBucket();

            for (SeedManifest item : manifestList) {
                try {
                    Lut lut = item.getId() == null ? null : lutRepository.getById(item.getId());
                    if (lut == null) {
                        skippedCount++;
                        continue;
                    }

                    String cubeKey = null;
                    if (lut.getFileKey() != null && lut.getFileKey().matches("^lut/[a-z0-9-]+\\.cube$")) {
                        cubeKey = lut.getFileKey();
                    }

                    String coverKey = extractPublicKey(lut.getCoverUrl(), publicBucket, "cover.jpg");
                    String beforeKey = extractPublicKey(lut.getBeforeUrl(), publicBucket, "before.jpg");
                    String afterKey = extractPublicKey(lut.getAfterUrl(), publicBucket, "after.jpg");
                    String videoKey = extractPublicKey(lut.getPreviewVideoUrl(), publicBucket, "preview.mp4");

                    boolean needCube = false;
                    if (cubeKey != null) {
                        if (fileStorageService.existsPrivate(cubeKey)) {
                            existingCount++;
                        } else {
                            needCube = true;
                        }
                    }

                    boolean needCover = false;
                    if (coverKey != null) {
                        if (fileStorageService.existsPublic(coverKey)) {
                            existingCount++;
                        } else {
                            needCover = true;
                        }
                    }

                    boolean needBefore = false;
                    if (beforeKey != null) {
                        if (fileStorageService.existsPublic(beforeKey)) {
                            existingCount++;
                        } else {
                            needBefore = true;
                        }
                    }

                    boolean needAfter = false;
                    if (afterKey != null) {
                        if (fileStorageService.existsPublic(afterKey)) {
                            existingCount++;
                        } else {
                            needAfter = true;
                        }
                    }

                    boolean needVideo = false;
                    if (videoKey != null) {
                        if (fileStorageService.existsPublic(videoKey)) {
                            existingCount++;
                        } else {
                            needVideo = true;
                        }
                    }

                    double[][][][] grid = null;
                    if (needCube || needAfter || needCover) {
                        grid = CubeFilter.grid(item.getFilter());
                    }

                    if (needCube) {
                        byte[] cubeData = CubeFilter.writeCube(item.getTitle(), item.getFilter());
                        fileStorageService.putPrivate(cubeKey, cubeData, "text/plain");
                        uploadedCount++;
                    }

                    if (needBefore) {
                        ClassPathResource photoRes = new ClassPathResource("seed/kho-lut/photos/" + item.getPicsumSeed() + ".jpg");
                        try (InputStream in = photoRes.getInputStream()) {
                            byte[] beforeData = imageRenderer.before(in);
                            fileStorageService.putPublic(beforeKey, new ByteArrayInputStream(beforeData), beforeData.length, "image/jpeg");
                            uploadedCount++;
                        }
                    }

                    if (needAfter || needCover) {
                        BufferedImage afterImage;
                        ClassPathResource photoRes = new ClassPathResource("seed/kho-lut/photos/" + item.getPicsumSeed() + ".jpg");
                        try (InputStream in = photoRes.getInputStream()) {
                            BufferedImage beforeImage = imageRenderer.renderBefore(in);
                            afterImage = imageRenderer.renderAfter(beforeImage, grid);
                        }

                        if (needAfter) {
                            byte[] afterData = imageRenderer.toJpeg(afterImage);
                            fileStorageService.putPublic(afterKey, new ByteArrayInputStream(afterData), afterData.length, "image/jpeg");
                            uploadedCount++;
                        }

                        if (needCover) {
                            byte[] coverData = imageRenderer.coverFromAfter(afterImage, item.getCoverText(), item.getCoverTextStyle());
                            fileStorageService.putPublic(coverKey, new ByteArrayInputStream(coverData), coverData.length, "image/jpeg");
                            uploadedCount++;
                        }
                    }

                    if (needVideo) {
                        ClassPathResource videoRes = new ClassPathResource("seed/kho-lut/videos/" + item.getVideoSource() + ".mp4");
                        try (InputStream in = videoRes.getInputStream()) {
                            byte[] videoData = in.readAllBytes();
                            fileStorageService.putPublic(videoKey, new ByteArrayInputStream(videoData), videoData.length, "video/mp4");
                            uploadedCount++;
                        }
                    }

                } catch (Exception e) {
                    if (isFatalMinioError(e)) {
                        throw e;
                    }
                    errorCount++;
                    log.warn("Không nạp được file mẫu cho LUT slug='{}': {}", item.getSlug(), e.getMessage());
                }
            }

            log.info("Nạp dữ liệu mẫu MinIO: {} LUT, đã có {} object, đã nạp {} object, bỏ qua {} LUT, lỗi {} LUT",
                    totalLuts, existingCount, uploadedCount, skippedCount, errorCount);

        } catch (Exception e) {
            log.warn("Nạp dữ liệu mẫu MinIO thất bại: {}", e.getMessage());
        }
    }

    private boolean isFatalMinioError(Exception e) {
        String msg = e.getMessage() != null ? e.getMessage() : "";
        if (msg.contains("Connection refused") || msg.contains("ConnectException") || msg.contains("connection refused")) {
            return true;
        }
        Throwable cause = e.getCause();
        while (cause != null) {
            String cmsg = cause.getMessage() != null ? cause.getMessage() : "";
            if (cmsg.contains("Connection refused") || cmsg.contains("ConnectException") || cmsg.contains("connection refused")) {
                return true;
            }
            cause = cause.getCause();
        }
        return false;
    }

    private String extractPublicKey(String url, String bucket, String expectedSuffix) {
        if (url == null || url.isBlank() || bucket == null || bucket.isBlank()) {
            return null;
        }
        String marker = "/" + bucket + "/";
        int idx = url.indexOf(marker);
        if (idx == -1) {
            return null;
        }
        String key = url.substring(idx + marker.length());
        if (key.matches("^lut/[a-z0-9-]+/" + Pattern.quote(expectedSuffix) + "$")) {
            return key;
        }
        return null;
    }
}
