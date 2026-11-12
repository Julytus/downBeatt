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
public class DashboardPoint {
    private String period;
    private Long revenue;
    private Long paidOrders;
    private Long newCustomers;
    private Long downloads;
}
