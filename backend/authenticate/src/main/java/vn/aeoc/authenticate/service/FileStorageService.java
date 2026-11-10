package vn.aeoc.authenticate.service;

import io.minio.*;
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
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

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

    public String upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }
        if (file.getSize() > maxSize.toBytes()) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE,
                    "File vượt quá dung lượng cho phép (" + maxSize.toMegabytes() + "MB)");
        }

        String ext = extensionOf(file.getOriginalFilename());
        String contentType = ALLOWED_TYPES.get(ext);
        if (contentType == null) {
            throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
        }

        String objectKey = LocalDate.now().format(KEY_DATE) + "/" + UUID.randomUUID() + "." + ext;

        try (InputStream stream = new BufferedInputStream(file.getInputStream())) {
            verifySignature(stream, ext);

            // Tài liệu luôn tải xuống, không render inline trên domain của app
            Map<String, String> headers = contentType.startsWith("image/")
                    ? Map.of("Cache-Control", CACHE_CONTROL)
                    : Map.of("Cache-Control", CACHE_CONTROL,
                             "Content-Disposition", "attachment; filename=\"" + downloadName(file, ext) + "\"");

            minioClient.putObject(PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectKey)
                    .stream(stream, file.getSize(), -1)
                    .contentType(contentType)
                    .headers(headers)
                    .build());
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Upload file lên MinIO thất bại, key={}", objectKey, e);
            throw new AppException(ErrorCode.UPLOAD_FILE_FAILED);
        }

        return StringUtils.removeEnd(fileUrl, "/") + "/" + bucket + "/" + objectKey;
    }

    private static String extensionOf(String filename) {
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

    /** So magic bytes để chặn file giả đuôi (vd. HTML đổi tên thành .png). */
    private static void verifySignature(InputStream stream, String ext) throws IOException {
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
