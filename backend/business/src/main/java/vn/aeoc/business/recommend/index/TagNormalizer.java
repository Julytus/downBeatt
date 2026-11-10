package vn.aeoc.business.recommend.index;

import java.text.Normalizer;
import java.util.*;

public class TagNormalizer {

    private static final List<List<String>> DEFAULT_SYNONYMS = List.of(
            List.of("đen trắng", "trắng đen", "b&w", "bw", "black and white"),
            List.of("vintage", "cổ điển", "retro"),
            List.of("phim", "film")
    );

    private static final Map<String, String> DEFAULT_SYNONYM_MAP = buildSynonymMap(DEFAULT_SYNONYMS);

    public static String clean(String tag) {
        if (tag == null) {
            return null;
        }
        String nfc = Normalizer.normalize(tag, Normalizer.Form.NFC).toLowerCase(Locale.ROOT).trim();
        String collapsed = nfc.replaceAll("\\s+", " ");
        return collapsed.isEmpty() ? null : collapsed;
    }

    public static Map<String, String> buildSynonymMap(List<List<String>> synonyms) {
        Map<String, String> map = new HashMap<>();
        if (synonyms == null) {
            return map;
        }
        for (List<String> group : synonyms) {
            if (group == null || group.isEmpty()) {
                continue;
            }
            String canonical = clean(group.get(0));
            if (canonical == null) {
                continue;
            }
            for (String synonym : group) {
                String cleaned = clean(synonym);
                if (cleaned != null) {
                    map.put(cleaned, canonical);
                }
            }
        }
        return map;
    }

    public static String normalize(String tag) {
        return normalize(tag, DEFAULT_SYNONYM_MAP);
    }

    public static String normalize(String tag, Map<String, String> synonymMap) {
        String cleaned = clean(tag);
        if (cleaned == null) {
            return "";
        }
        if (synonymMap != null && synonymMap.containsKey(cleaned)) {
            return synonymMap.get(cleaned);
        }
        return cleaned;
    }

    public static Set<String> normalizeTags(Collection<String> tags) {
        return normalizeTags(tags, DEFAULT_SYNONYM_MAP);
    }

    public static Set<String> normalizeTags(Collection<String> tags, Map<String, String> synonymMap) {
        if (tags == null || tags.isEmpty()) {
            return Collections.emptySet();
        }
        Set<String> result = new LinkedHashSet<>();
        for (String t : tags) {
            String norm = normalize(t, synonymMap);
            if (!norm.isEmpty()) {
                result.add(norm);
            }
        }
        return result;
    }
}
