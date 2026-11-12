package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jooq.JSON;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "scenario", "metric", "k", "algorithmA", "algorithmB",
        "seedCount", "pairCount", "nonZeroCount",
        "meanA", "meanB", "meanDiff", "ciLow", "ciHigh", "relChange",
        "wPlus", "z", "pValue", "pHolm", "conclusion", "params"
})
public class RecEvalTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static final List<String> CANONICAL_PARAM_ORDER = List.of(
            "method", "zeroMethod", "tieCorrection", "continuityCorrection",
            "holmFamilySize", "alpha", "bootstrap", "bootstrapSeed", "ciLevel"
    );

    @JsonIgnore
    private Integer id;

    @JsonIgnore
    private String batchCode;

    private String scenario;
    private String metric;
    private Integer k;
    private String algorithmA;
    private String algorithmB;
    private Integer seedCount;
    private Integer pairCount;

    @JsonProperty("nonZeroCount")
    private Integer nonZeroCount;

    private Double meanA;
    private Double meanB;
    private Double meanDiff;
    private Double ciLow;
    private Double ciHigh;
    private Double relChange;

    @JsonProperty("wPlus")
    private Double wPlus;

    private Double z;

    @JsonProperty("pValue")
    private Double pValue;

    @JsonProperty("pHolm")
    private Double pHolm;

    private String conclusion;

    private Map<String, Object> params;

    @JsonIgnore
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTime;

    @JsonProperty("nonZeroCount")
    public Integer getNonZeroCount() {
        return nonZeroCount;
    }

    @JsonProperty("nonZeroCount")
    public void setNonZeroCount(Integer nonZeroCount) {
        this.nonZeroCount = nonZeroCount;
    }

    @JsonProperty("wPlus")
    public Double getWPlus() {
        return wPlus;
    }

    @JsonProperty("wPlus")
    public void setWPlus(Double wPlus) {
        this.wPlus = wPlus;
    }

    @JsonProperty("pValue")
    public Double getPValue() {
        return pValue;
    }

    @JsonProperty("pValue")
    public void setPValue(Double pValue) {
        this.pValue = pValue;
    }

    @JsonProperty("pHolm")
    public Double getPHolm() {
        return pHolm;
    }

    @JsonProperty("pHolm")
    public void setPHolm(Double pHolm) {
        this.pHolm = pHolm;
    }

    @JsonIgnore
    public Integer getNonzeroCount() {
        return nonZeroCount;
    }

    @JsonIgnore
    public void setNonzeroCount(Integer nonzeroCount) {
        this.nonZeroCount = nonzeroCount;
    }

    public void setParams(Object value) {
        this.params = parseParams(value);
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
                ordered.put(k, rawMap.get(k));
            }
        }
        for (Map.Entry<String, Object> e : rawMap.entrySet()) {
            if (!ordered.containsKey(e.getKey())) {
                ordered.put(e.getKey(), e.getValue());
            }
        }
        return ordered;
    }
}
