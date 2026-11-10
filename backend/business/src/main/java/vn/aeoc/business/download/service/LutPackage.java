package vn.aeoc.business.download.service;

import org.apache.commons.lang3.StringUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * Tiện ích thuần (không Spring) đóng gói file .cube thành .zip theo cấu trúc mẫu:
 *   {base}-LUT-DownBeat.zip
 *   └── {base}-LUT/
 *       └── Assets/
 *           └── {base}.cube
 */
public final class LutPackage {
    private static final int MAX_BASE_LENGTH = 60;

    private LutPackage() {}

    /**
     * Dựng tên gốc từ tiêu đề LUT theo plan §5.2.
     * 1. đ -> d, Đ -> D; bỏ dấu (StringUtils.stripAccents).
     * 2. Ký tự ngoài [A-Za-z0-9] -> '-'; bỏ '-' ở hai đầu; giữ hoa thường.
     * 3. Cắt tối đa 60 ký tự, bỏ '-' ở cuối; rỗng -> LUT-{id}.
     */
    public static String baseName(String title, Integer id) {
        if (title == null) {
            return "LUT-" + id;
        }
        String s = title.replace("đ", "d").replace("Đ", "D");
        s = StringUtils.stripAccents(s);
        s = s.replaceAll("[^A-Za-z0-9]+", "-");
        s = s.replaceAll("^-+|-+$", "");
        if (s.length() > MAX_BASE_LENGTH) {
            s = s.substring(0, MAX_BASE_LENGTH);
            s = s.replaceAll("-+$", "");
        }
        if (s.isEmpty()) {
            return "LUT-" + id;
        }
        return s;
    }

    public static String fileName(String base) {
        return base + "-LUT-DownBeat.zip";
    }

    public static String zipKey(String fileKey, String fileName) {
        if (fileKey == null) {
            return "zip/" + fileName;
        }
        String stripped = fileKey.endsWith(".cube")
                ? fileKey.substring(0, fileKey.length() - ".cube".length())
                : fileKey;
        stripped = stripped.startsWith("/") ? stripped.substring(1) : stripped;
        return "zip/" + stripped + "/" + fileName;
    }

    public static byte[] zip(String base, byte[] cube) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            try (ZipOutputStream zos = new ZipOutputStream(baos, StandardCharsets.UTF_8)) {
                zos.setMethod(ZipOutputStream.DEFLATED);
                String entryName = base + "-LUT/Assets/" + base + ".cube";
                ZipEntry entry = new ZipEntry(entryName);
                entry.setMethod(ZipEntry.DEFLATED);
                zos.putNextEntry(entry);
                if (cube != null && cube.length > 0) {
                    zos.write(cube);
                }
                zos.closeEntry();
            }
            return baos.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Lỗi đóng gói file zip: " + e.getMessage(), e);
        }
    }
}
