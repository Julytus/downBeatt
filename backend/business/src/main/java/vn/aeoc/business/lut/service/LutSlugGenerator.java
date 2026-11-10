package vn.aeoc.business.lut.service;

import org.apache.commons.lang3.StringUtils;

import java.util.Locale;
import java.util.function.Predicate;

public final class LutSlugGenerator {

    private LutSlugGenerator() {}

    public static String toSlug(String title) {
        if (title == null || title.isBlank()) {
            return "lut";
        }

        // Bỏ dấu: Đ/đ -> D/d, còn lại StringUtils.stripAccents
        String normalized = title.replace('Đ', 'D').replace('đ', 'd');
        normalized = StringUtils.stripAccents(normalized);

        // Chữ thường
        normalized = normalized.toLowerCase(Locale.ROOT);

        // Mọi ký tự ngoài [a-z0-9] thành -, gộp - liên tiếp
        normalized = normalized.replaceAll("[^a-z0-9]+", "-");

        // Bỏ - đầu / cuối
        normalized = normalized.replaceAll("^-+|-+$", "");

        // Cắt 140 ký tự
        if (normalized.length() > 140) {
            normalized = normalized.substring(0, 140).replaceAll("-+$", "");
        }

        // Rỗng thì "lut"
        return normalized.isEmpty() ? "lut" : normalized;
    }

    public static String nextFree(String base, Predicate<String> exists) {
        if (!exists.test(base)) {
            return base;
        }
        int suffix = 2;
        while (true) {
            String candidate = base + "-" + suffix;
            if (!exists.test(candidate)) {
                return candidate;
            }
            suffix++;
        }
    }
}
