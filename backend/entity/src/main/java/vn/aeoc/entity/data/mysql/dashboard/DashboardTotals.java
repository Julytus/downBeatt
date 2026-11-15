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
public class DashboardTotals {
    private String from;
    private String to;
    private Long revenue;
    private Long paidOrders;
    private Long newCustomers;
    private Long downloads;
    private Long premiumDownloads;
    private Double premiumRatio;
}
