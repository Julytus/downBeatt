package vn.aeoc.business.lut.constant;

import lombok.Getter;
import org.springframework.util.unit.DataSize;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.util.Set;

@Getter
public enum LutUploadKind {
    CUBE("file .cube", Set.of("cube"), DataSize.ofMegabytes(10), "file_key", null, "Chỉ nhận file .cube"),
    COVER("Ảnh bìa", Set.of("jpg", "jpeg", "png", "webp"), DataSize.ofMegabytes(10), "cover_url", "cover", "Chỉ nhận ảnh .jpg, .jpeg, .png, .webp"),
    BEFORE("Ảnh trước", Set.of("jpg", "jpeg", "png", "webp"), DataSize.ofMegabytes(10), "before_url", "before", "Chỉ nhận ảnh .jpg, .jpeg, .png, .webp"),
    AFTER("Ảnh sau", Set.of("jpg", "jpeg", "png", "webp"), DataSize.ofMegabytes(10), "after_url", "after", "Chỉ nhận ảnh .jpg, .jpeg, .png, .webp"),
    VIDEO("Video xem trước", Set.of("mp4", "webm"), DataSize.ofMegabytes(50), "preview_video_url", "video", "Chỉ nhận video .mp4, .webm");

    private final String displayName;
    private final Set<String> allowedExtensions;
    private final DataSize maxSize;
    private final String targetColumn;
    private final String filePrefix;
    private final String extensionErrorMessage;

    LutUploadKind(String displayName, Set<String> allowedExtensions, DataSize maxSize,
                  String targetColumn, String filePrefix, String extensionErrorMessage) {
        this.displayName = displayName;
        this.allowedExtensions = allowedExtensions;
        this.maxSize = maxSize;
        this.targetColumn = targetColumn;
        this.filePrefix = filePrefix;
        this.extensionErrorMessage = extensionErrorMessage;
    }

    public static LutUploadKind from(String name) {
        if (name == null || name.isBlank()) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Loại file không hợp lệ");
        }
        for (LutUploadKind kind : values()) {
            if (kind.name().equalsIgnoreCase(name.trim())) {
                return kind;
            }
        }
        throw new AppException(ErrorCode.BAD_REQUEST, "Loại file không hợp lệ");
    }

    public static String contentTypeFor(String ext) {
        return switch (ext.toLowerCase()) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png" -> "image/png";
            case "webp" -> "image/webp";
            case "mp4" -> "video/mp4";
            case "webm" -> "video/webm";
            case "cube" -> "text/plain; charset=utf-8";
            default -> "application/octet-stream";
        };
    }
}
