package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jooq.JSON;

import java.time.LocalDateTime;
import java.util.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecEvalRun {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static final List<String> CANONICAL_PARAM_ORDER = List.of(
            "seed",
            "phase",
            "lutCount",
            "simUserCount",
            "kValues",
            "generatorVersion",
            "catalogStart",
            "elapsedMs",
            "repeats",
            "popularWindow",
            "weights",
            "eventWeights",
            "halfLifeDays",
            "coldStartK",
            "mmrLambda",
            "candidateTop",
            "historyDays",
            "historyMaxPairs",
            "popularDays"
    );

    public static final List<String> CANONICAL_WEIGHT_ORDER = List.of(
            "tag", "color", "category", "style", "text", "creator"
    );

    public static final List<String> CANONICAL_EVENT_ORDER = List.of(
            "VIEW", "PREVIEW", "SEARCH", "FILTER_STYLE", "FAVORITE", "DOWNLOAD", "PURCHASE", "DISMISS"
    );

    public static final List<String> CANONICAL_METRIC_ORDER = List.of(
            "precision", "recall", "ndcg", "hitRate", "ild", "styles", "coverage", "novelty"
    );

    private Integer id;
    private String batchCode;
    private String dataset;
    private String algorithm;
    private Map<String, Object> params;
    private Map<String, Map<String, Double>> metrics;
    private Integer userCount;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTime;

    public void setParams(Object value) {
        this.params = parseParams(value);
    }

    public void setMetrics(Object value) {
        this.metrics = parseMetrics(value);
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseParams(Object value) {
        if (value == null) {
            return null;
        }
        Map<String, Object> rawMap;
        if (value instanceof Map<?, ?> m) {
            rawMap = (Map<String, Object>) m;
        } else {
            String jsonStr = (value instanceof JSON j) ? j.data() : value.toString();
            if (jsonStr == null || jsonStr.isBlank()) {
                return new LinkedHashMap<>();
            }
            try {
                rawMap = MAPPER.readValue(jsonStr, new TypeReference<LinkedHashMap<String, Object>>() {});
            } catch (Exception e) {
                return new LinkedHashMap<>();
            }
        }

        LinkedHashMap<String, Object> ordered = new LinkedHashMap<>();
        for (String k : CANONICAL_PARAM_ORDER) {
            if (rawMap.containsKey(k)) {
                Object v = rawMap.get(k);
                if ("weights".equals(k) && v instanceof Map<?, ?> wm) {
                    LinkedHashMap<String, Object> wOrdered = new LinkedHashMap<>();
                    for (String wk : CANONICAL_WEIGHT_ORDER) {
                        if (wm.containsKey(wk)) {
                            wOrdered.put(wk, wm.get(wk));
                        }
                    }
                    for (Map.Entry<?, ?> we : wm.entrySet()) {
                        String wk = String.valueOf(we.getKey());
                        if (!wOrdered.containsKey(wk)) {
                            wOrdered.put(wk, we.getValue());
                        }
                    }
                    ordered.put(k, wOrdered);
                } else if ("eventWeights".equals(k) && v instanceof Map<?, ?> em) {
                    LinkedHashMap<String, Object> eOrdered = new LinkedHashMap<>();
                    for (String ek : CANONICAL_EVENT_ORDER) {
                        if (em.containsKey(ek)) {
                            eOrdered.put(ek, em.get(ek));
                        }
                    }
                    for (Map.Entry<?, ?> ee : em.entrySet()) {
                        String ek = String.valueOf(ee.getKey());
                        if (!eOrdered.containsKey(ek)) {
                            eOrdered.put(ek, ee.getValue());
                        }
                    }
                    ordered.put(k, eOrdered);
                } else {
                    ordered.put(k, v);
                }
            }
        }
        for (Map.Entry<String, Object> e : rawMap.entrySet()) {
            if (!ordered.containsKey(e.getKey())) {
                ordered.put(e.getKey(), e.getValue());
            }
        }
        return ordered;
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Map<String, Double>> parseMetrics(Object value) {
        if (value == null) {
            return null;
        }
        Map<?, ?> rawMap;
        if (value instanceof Map<?, ?> m) {
            rawMap = m;
        } else {
            String jsonStr = (value instanceof JSON j) ? j.data() : value.toString();
            if (jsonStr == null || jsonStr.isBlank()) {
                return new LinkedHashMap<>();
            }
            try {
                rawMap = MAPPER.readValue(jsonStr, new TypeReference<LinkedHashMap<String, Object>>() {});
            } catch (Exception e) {
                return new LinkedHashMap<>();
            }
        }

        // Sort outer keys by numeric value (5, 10, 20)
        List<String> sortedOuterKeys = new ArrayList<>();
        for (Object k : rawMap.keySet()) {
            sortedOuterKeys.add(String.valueOf(k));
        }
        sortedOuterKeys.sort((k1, k2) -> {
            try {
                return Integer.compare(Integer.parseInt(k1), Integer.parseInt(k2));
            } catch (NumberFormatException e) {
                return k1.compareTo(k2);
            }
        });

        LinkedHashMap<String, Map<String, Double>> result = new LinkedHashMap<>();
        for (String k : sortedOuterKeys) {
            Object v = rawMap.get(k);
            if (v instanceof Map<?, ?> inner) {
                LinkedHashMap<String, Double> innerMap = new LinkedHashMap<>();
                for (String mk : CANONICAL_METRIC_ORDER) {
                    if (inner.containsKey(mk)) {
                        Object iv = inner.get(mk);
                        Double d = iv instanceof Number n ? n.doubleValue() : (iv != null ? Double.parseDouble(iv.toString()) : null);
                        innerMap.put(mk, d);
                    }
                }
                for (Map.Entry<?, ?> ie : inner.entrySet()) {
                    String ik = String.valueOf(ie.getKey());
                    if (!innerMap.containsKey(ik)) {
                        Object iv = ie.getValue();
                        Double d = iv instanceof Number n ? n.doubleValue() : (iv != null ? Double.parseDouble(iv.toString()) : null);
                        innerMap.put(ik, d);
                    }
                }
                result.put(k, innerMap);
            }
        }
        return result;
    }
}
