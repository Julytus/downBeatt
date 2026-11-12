package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class RebuildResult {
    private Integer featureMissing;
    private Integer featureComputed;
    private List<FeatureFailure> featureFailed;
    private Integer lutCount;
    private Integer similarityRows;
    private Long elapsedMs;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime builtTime;
    private String reason;
}
