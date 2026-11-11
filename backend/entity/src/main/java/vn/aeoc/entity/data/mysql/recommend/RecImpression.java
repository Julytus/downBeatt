package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import org.jooq.JSON;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecImpression {
    private Long id;
    private Integer userId;
    private String anonId;
    private String placement;
    private String variant;
    private String strategy;
    private List<Integer> lutIds;
    private LocalDateTime createdTime;

    private Integer limit;

    public void setLutIds(Object value) {
        this.lutIds = parseIntegerList(value);
    }

    public static List<Integer> parseIntegerList(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof List<?> list) {
            List<Integer> res = new ArrayList<>();
            for (Object item : list) {
                if (item instanceof Number n) {
                    res.add(n.intValue());
                } else if (item != null) {
                    try {
                        res.add(Integer.parseInt(item.toString().trim()));
                    } catch (NumberFormatException ignored) {
                    }
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
        List<Integer> result = new ArrayList<>();
        String[] parts = jsonStr.split(",");
        for (String part : parts) {
            String trimmed = part.trim();
            if (!trimmed.isEmpty()) {
                try {
                    result.add(Integer.parseInt(trimmed));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return result;
    }
}
