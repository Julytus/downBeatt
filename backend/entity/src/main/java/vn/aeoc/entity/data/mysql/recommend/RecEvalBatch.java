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
public class RecEvalBatch {
    private String batchCode;
    private String dataset;
    private List<Long> seeds;
    private Integer runCount;
    private List<String> scenarios;
    private Integer lutCount;
    private Integer simUserCount;
    private Boolean hasTests;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTime;
}
