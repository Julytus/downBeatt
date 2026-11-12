package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StatsRow {
    private String variant;
    private String strategy;
    private Long impressions;
    private Long clicked;
    private Double ctr;
    private Long downloaded;
    private Double downloadRate;
    private Long dismissals;
    private Double dismissRate;
}
