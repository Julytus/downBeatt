package vn.aeoc.business.lut.service;

import java.text.Normalizer;
import java.util.LinkedHashSet;
import java.util.List;

public final class LutQuerySupport {
    private LutQuerySupport() {}

    public static List<String> normalizeTerms(String q, List<String> keywords) {
        LinkedHashSet<String> values = new LinkedHashSet<>();
        add(values, q);
        if (keywords != null) {
            for (String keyword : keywords) {
                add(values, keyword);
            }
        }
        return values.stream().limit(10).toList();
    }

    private static void add(LinkedHashSet<String> values, String raw) {
        if (raw == null) {
            return;
        }
        String term = Normalizer.normalize(raw.strip(), Normalizer.Form.NFC);
        if (term.isEmpty()) {
            return;
        }
        values.add(term.substring(0, Math.min(100, term.length())));
    }

    public static String toLikePattern(String value) {
        return "%" + value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
    }

    public static int page(Integer value) {
        return value == null || value < 1 ? 1 : value;
    }

    public static int limit(Integer value) {
        return value == null || value <= 0 ? 12 : Math.min(value, 48);
    }
}
