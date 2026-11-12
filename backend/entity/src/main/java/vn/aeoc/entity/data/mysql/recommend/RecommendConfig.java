package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RecommendConfig {
    private String variant;
    private Map<String, Double> weights;
    private Map<String, Double> normalizedWeights;
    private Map<String, Double> eventWeights;
    private Map<String, Object> params;
    private IndexStatus index;
}
