package vn.aeoc.entity.data.mysql.billing;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.jooq.JSON;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Plan {
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer id;

    private String code;
    private String name;
    private String audience;
    private Long monthlyPrice;
    private Long yearlyMonthlyPrice;
    private Integer canDownloadPremium;
    private Integer maxMembers;
    private List<String> license;
    private List<String> features;
    private Integer isHighlight;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer sortOrder;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer active;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime createdTime;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime updatedTime;

    public void setCanDownloadPremium(Number val) {
        this.canDownloadPremium = val == null ? null : val.intValue();
    }

    public void setIsHighlight(Number val) {
        this.isHighlight = val == null ? null : val.intValue();
    }

    public void setActive(Number val) {
        this.active = val == null ? null : val.intValue();
    }

    public void setLicense(Object value) {
        this.license = parseStringList(value);
    }

    public void setFeatures(Object value) {
        this.features = parseStringList(value);
    }

    private static List<String> parseStringList(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof List<?> list) {
            List<String> res = new ArrayList<>();
            for (Object item : list) {
                if (item != null) {
                    res.add(item.toString());
                }
            }
            return res;
        }
        String jsonStr = (value instanceof JSON j) ? j.data() : value.toString();
        if (jsonStr == null || jsonStr.isBlank()) {
            return new ArrayList<>();
        }
        jsonStr = jsonStr.trim();
        if (jsonStr.startsWith("[") && jsonStr.endsWith("]")) {
            jsonStr = jsonStr.substring(1, jsonStr.length() - 1).trim();
        }
        if (jsonStr.isEmpty()) {
            return new ArrayList<>();
        }
        List<String> result = new ArrayList<>();
        boolean inQuotes = false;
        StringBuilder current = new StringBuilder();
        boolean escape = false;
        for (int i = 0; i < jsonStr.length(); i++) {
            char c = jsonStr.charAt(i);
            if (escape) {
                if (c == 'n') current.append('\n');
                else if (c == 't') current.append('\t');
                else if (c == 'r') current.append('\r');
                else if (c == '"') current.append('"');
                else if (c == '\\') current.append('\\');
                else current.append(c);
                escape = false;
            } else if (c == '\\') {
                escape = true;
            } else if (c == '"') {
                if (inQuotes) {
                    result.add(current.toString());
                    current.setLength(0);
                    inQuotes = false;
                } else {
                    inQuotes = true;
                }
            } else if (inQuotes) {
                current.append(c);
            }
        }
        return result;
    }
}
