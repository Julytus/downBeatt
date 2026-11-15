package vn.aeoc.entity.data.mysql.dashboard;

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
public class DashboardTopLut {
    private Integer id;
    private String slug;
    private String title;
    private String coverUrl;
    private Integer isPremium;
    private String status;
    private String creatorName;
    private Long downloads;
}
