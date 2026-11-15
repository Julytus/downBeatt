package vn.aeoc.authenticate.service;

import io.minio.*;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.util.unit.DataSize;
import org.springframework.web.multipart.MultipartFile;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Lưu file lên MinIO, trả về URL công khai (qua nginx: {system.file-url}/{bucket}/{key}).
 * <p>
 * Bảo mật: chỉ nhận đuôi file trong whitelist, kiểm tra magic bytes với ảnh/pdf/office,
 * content-type do server quyết định (không tin client). SVG/HTML bị chặn vì có thể chứa script (XSS).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FileStorageService {
    private static final DateTimeFormatter KEY_DATE = DateTimeFormatter.ofPattern("yyyy/MM/dd");
    private static final String CACHE_CONTROL = "public, max-age=31536000, immutable";
    private static final int SNIFF_BYTES = 12;

    /** Đuôi file được phép → content-type trả về cho trình duyệt. */
    private static final Map<String, String> ALLOWED_TYPES = Map.ofEntries(
            Map.entry("jpg", "image/jpeg"),
            Map.entry("jpeg", "image/jpeg"),
            Map.entry("png", "image/png"),
            Map.entry("gif", "image/gif"),
            Map.entry("webp", "image/webp"),
            Map.entry("pdf", "application/pdf"),
            Map.entry("doc", "application/msword"),
            Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
            Map.entry("xls", "application/vnd.ms-excel"),
            Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
            Map.entry("txt", "text/plain; charset=utf-8"),
            Map.entry("csv", "text/csv; charset=utf-8")
    );

    private final MinioClient minioClient;

    @Value("${minio.bucket}")
    private String bucket;

    @Value("${minio.private-bucket:downbeat-lut}")
    private String privateBucket;

    @Value("${system.file-url}")
    private String fileUrl;

    @Value("${upload.max-size:10MB}")
    private DataSize maxSize;

    /** Tạo bucket 1 lần khi khởi động thay vì kiểm tra ở mỗi request upload. */
    @EventListener(ApplicationReadyEvent.class)
    public void ensureBucket() {
        try {
            ensureBucket(bucket, true);
            ensureBucket(privateBucket, false);
        } catch (Exception e) {
            // Không chặn app khởi động khi MinIO chưa sẵn sàng; upload sẽ báo lỗi riêng.
            log.warn("Không kiểm tra/tạo được bucket MinIO '{}': {}", bucket, e.getMessage());
        }
    }

    private void ensureBucket(String name, boolean publicRead) throws Exception {
        if (!minioClient.bucketExists(BucketExistsArgs.builder().bucket(name).build())) {
            minioClient.makeBucket(MakeBucketArgs.builder().bucket(name).build());
            if (publicRead) setPublicReadPolicy();
            log.info("Đã tạo bucket MinIO '{}'", name);
        }
    }

    public byte[] readPrivate(String key) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(privateBucket)
                        .object(key)
                        .build())) {
            return stream.readAllBytes();
        } catch (Exception e) {
            log.error("Không đọc được object '{}' từ bucket '{}': {}", key, privateBucket, e.getMessage());
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED, "Không đọc được file .cube");
        }
    }

    public String putPublic(String key, InputStream in, long size, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(key)
                    .stream(in, size, -1)
                    .contentType(contentType)
                    .headers(Map.of("Cache-Control", CACHE_CONTROL))
                    .build());
            return StringUtils.removeEnd(fileUrl, "/") + "/" + bucket + "/" + key;
        } catch (Exception e) {
            log.error("Upload file công khai lên MinIO thất bại, key={}", key, e);
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        }
    }

    public void putPrivate(String key, byte[] data, String contentType) {
        try {
            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(privateBucket)
                    .object(key)
                    .stream(new java.io.ByteArrayInputStream(data), data.length, -1)
                    .contentType(contentType)
                    .build());
        } catch (Exception e) {
            log.error("Upload file riêng tư lên MinIO thất bại, key={}", key, e);
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        }
    }

    public boolean existsPrivate(String key) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(privateBucket)
                            .object(key)
                            .build()
            );
            return true;
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return false;
            }
            log.error("MinIO statObject thất bại cho key='{}' trong bucket='{}': {}", key, privateBucket, e.getMessage());
            throw new AppException(ErrorCode.LUT_FILE_UNAVAILABLE);
        } catch (Exception e) {
            log.error("MinIO statObject thất bại cho key='{}' trong bucket='{}': {}", key, privateBucket, e.getMessage());
            throw new AppException(ErrorCode.LUT_FILE_UNAVAILABLE);
        }
    }

    public boolean existsPublic(String key) {
        try {
            minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucket)
                            .object(key)
                            .build()
            );
            return true;
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return false;
            }
            log.error("MinIO statObject thất bại cho key='{}' trong bucket='{}': {}", key, bucket, e.getMessage());
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        } catch (Exception e) {
            log.error("MinIO statObject thất bại cho key='{}' trong bucket='{}': {}", key, bucket, e.getMessage());
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        }
    }

    public String publicBucket() {
        return bucket;
    }

    public String presignPrivateGet(String key, Duration ttl, String downloadName, String contentType) {
        try {
            int expirySeconds = ttl != null ? (int) ttl.toSeconds() : 300;
            Map<String, String> queryParams = Map.of(
                    "response-content-disposition", "attachment; filename=\"" + downloadName + "\"",
                    "response-content-type", contentType
            );
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(privateBucket)
                            .object(key)
                            .expiry(expirySeconds, TimeUnit.SECONDS)
                            .extraQueryParams(queryParams)
                            .build()
            );
        } catch (Exception e) {
            log.error("MinIO presignPrivateGet thất bại cho key='{}' trong bucket='{}': {}", key, privateBucket, e.getMessage(), e);
            throw new AppException(ErrorCode.LUT_FILE_UNAVAILABLE);
        }
    }

    public String requireExtension(MultipartFile file, java.util.Set<String> allowed, String message) {
        String ext = extensionOf(file == null ? null : file.getOriginalFilename());
        if (ext.isEmpty() || !allowed.contains(ext)) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED, message);
        }
        return ext;
    }

    public void requireMaxSize(MultipartFile file, DataSize max) {
        if (file != null && file.getSize() > max.toBytes()) {
            String msg = max.toMegabytes() == 10
                    ? "File vượt quá dung lượng cho phép (10MB)"
                    : "File vượt quá dung lượng cho phép";
            throw new AppException(ErrorCode.FILE_TOO_LARGE, msg);
        }
    }

    public static String extensionOf(String filename) {
        String ext = StringUtils.substringAfterLast(StringUtils.defaultString(filename), ".");
        return ext.toLowerCase(Locale.ROOT);
    }

    /** Tên file khi tải xuống: chỉ giữ ký tự an toàn của tên gốc. */
    private static String downloadName(MultipartFile file, String ext) {
        String base = StringUtils.substringBeforeLast(StringUtils.defaultString(file.getOriginalFilename()), ".");
        base = StringUtils.stripAccents(base).replaceAll("[^A-Za-z0-9._-]+", "_");
        base = StringUtils.left(StringUtils.defaultIfBlank(base, "file"), 100);
        return base + "." + ext;
    }

    public void verifySignature(MultipartFile file, String ext) {
        try (InputStream stream = new BufferedInputStream(file.getInputStream())) {
            verifySignature(stream, ext);
        } catch (AppException e) {
            throw e;
        } catch (IOException e) {
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED, "Không đọc được file");
        }
    }

    /** So magic bytes để chặn file giả đuôi (vd. HTML đổi tên thành .png). */
    public static void verifySignature(InputStream stream, String ext) throws IOException {
        stream.mark(SNIFF_BYTES);
        byte[] head = stream.readNBytes(SNIFF_BYTES);
        stream.reset();

        boolean valid = switch (ext) {
            case "jpg", "jpeg" -> startsWith(head, 0xFF, 0xD8, 0xFF);
            case "png" -> startsWith(head, 0x89, 'P', 'N', 'G');
            case "gif" -> startsWith(head, 'G', 'I', 'F', '8');
            case "webp" -> startsWith(head, 'R', 'I', 'F', 'F')
                    && Arrays.equals(Arrays.copyOfRange(head, 8, 12), "WEBP".getBytes());
            case "pdf" -> startsWith(head, '%', 'P', 'D', 'F');
            case "docx", "xlsx" -> startsWith(head, 'P', 'K', 0x03, 0x04);
            case "doc", "xls" -> startsWith(head, 0xD0, 0xCF, 0x11, 0xE0);
            case "mp4" -> head.length >= 8 && head[4] == 'f' && head[5] == 't' && head[6] == 'y' && head[7] == 'p';
            case "webm" -> startsWith(head, 0x1A, 0x45, 0xDF, 0xA3);
            default -> true; // txt/csv: được ép content-type text/plain nên không thực thi được
        };
        if (!valid) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED, "Nội dung file không khớp định dạng ." + ext);
        }
    }

    private static boolean startsWith(byte[] data, int... signature) {
        if (data.length < signature.length) return false;
        for (int i = 0; i < signature.length; i++) {
            if ((data[i] & 0xFF) != signature[i]) return false;
        }
        return true;
    }

    private void setPublicReadPolicy() throws Exception {
        String policy = """
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": ["s3:GetObject"],
              "Resource": ["arn:aws:s3:::%s/*"]
            }
          ]
        }
        """.formatted(bucket);

        minioClient.setBucketPolicy(
                SetBucketPolicyArgs.builder()
                        .bucket(bucket)
                        .config(policy)
                        .build()
        );
    }
}
