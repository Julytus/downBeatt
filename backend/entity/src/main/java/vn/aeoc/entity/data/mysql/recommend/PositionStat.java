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
public class PositionStat {
    private Integer position;
    private Long impressions;
    private Long clicks;
    private Double ctr;
}
