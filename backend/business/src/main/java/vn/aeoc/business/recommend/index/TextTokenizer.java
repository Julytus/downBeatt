package vn.aeoc.business.recommend.index;

import java.text.Normalizer;
import java.util.*;

public class TextTokenizer {

    public static final Set<String> DEFAULT_STOPWORDS = Set.of(
            "của", "và", "cho", "là", "những", "các", "với", "một", "được", "có", "này", "như", "rất", "khi"
    );

    public static List<String> extractTokens(String text) {
        if (text == null) {
            return Collections.emptyList();
        }
        String nfc = Normalizer.normalize(text, Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
        List<String> tokens = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < nfc.length(); i++) {
            char ch = nfc.charAt(i);
            if (Character.isLetterOrDigit(ch)) {
                sb.append(ch);
            } else {
                if (sb.length() > 0) {
                    tokens.add(sb.toString());
                    sb.setLength(0);
                }
            }
        }
        if (sb.length() > 0) {
            tokens.add(sb.toString());
        }
        return tokens;
    }

    public static TokenResult tokenize(String title, String description) {
        return tokenize(title, description, DEFAULT_STOPWORDS);
    }

    public static TokenResult tokenize(String title, String description, Collection<String> stopwords) {
        Set<String> stopSet = stopwords == null ? Collections.emptySet() : new HashSet<>(stopwords);
        Map<String, Integer> unigrams = new LinkedHashMap<>();
        Map<String, Integer> bigrams = new LinkedHashMap<>();

        processField(title, stopSet, unigrams, bigrams);
        processField(description, stopSet, unigrams, bigrams);

        Map<String, Integer> allTerms = new LinkedHashMap<>(unigrams);
        bigrams.forEach((k, v) -> allTerms.merge(k, v, Integer::sum));

        return new TokenResult(unigrams, bigrams, allTerms);
    }

    private static void processField(String text, Set<String> stopSet,
                                     Map<String, Integer> unigrams,
                                     Map<String, Integer> bigrams) {
        List<String> tokens = extractTokens(text);
        if (tokens.isEmpty()) {
            return;
        }

        for (String t : tokens) {
            if (!stopSet.contains(t)) {
                unigrams.merge(t, 1, Integer::sum);
            }
        }

        for (int i = 0; i < tokens.size() - 1; i++) {
            String t1 = tokens.get(i);
            String t2 = tokens.get(i + 1);
            if (!stopSet.contains(t1) && !stopSet.contains(t2)) {
                String pair = t1 + " " + t2;
                bigrams.merge(pair, 1, Integer::sum);
            }
        }
    }

    public static class TokenResult implements Map<String, Integer> {
        private final Map<String, Integer> unigrams;
        private final Map<String, Integer> bigrams;
        private final Map<String, Integer> allTerms;

        public TokenResult(Map<String, Integer> unigrams,
                           Map<String, Integer> bigrams,
                           Map<String, Integer> allTerms) {
            this.unigrams = Collections.unmodifiableMap(unigrams);
            this.bigrams = Collections.unmodifiableMap(bigrams);
            this.allTerms = Collections.unmodifiableMap(allTerms);
        }

        public Map<String, Integer> unigrams() {
            return unigrams;
        }

        public Map<String, Integer> getUnigrams() {
            return unigrams;
        }

        public Map<String, Integer> bigrams() {
            return bigrams;
        }

        public Map<String, Integer> getBigrams() {
            return bigrams;
        }

        public Map<String, Integer> allTerms() {
            return allTerms;
        }

        public Map<String, Integer> getAllTerms() {
            return allTerms;
        }

        @Override public int size() { return allTerms.size(); }
        @Override public boolean isEmpty() { return allTerms.isEmpty(); }
        @Override public boolean containsKey(Object key) { return allTerms.containsKey(key); }
        @Override public boolean containsValue(Object value) { return allTerms.containsValue(value); }
        @Override public Integer get(Object key) { return allTerms.get(key); }
        @Override public Integer put(String key, Integer value) { throw new UnsupportedOperationException(); }
        @Override public Integer remove(Object key) { throw new UnsupportedOperationException(); }
        @Override public void putAll(Map<? extends String, ? extends Integer> m) { throw new UnsupportedOperationException(); }
        @Override public void clear() { throw new UnsupportedOperationException(); }
        @Override public Set<String> keySet() { return allTerms.keySet(); }
        @Override public Collection<Integer> values() { return allTerms.values(); }
        @Override public Set<Entry<String, Integer>> entrySet() { return allTerms.entrySet(); }
        @Override public boolean equals(Object o) { return allTerms.equals(o); }
        @Override public int hashCode() { return allTerms.hashCode(); }
        @Override public String toString() { return allTerms.toString(); }
    }
}
