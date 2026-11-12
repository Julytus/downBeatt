package vn.aeoc.entity.data.mysql.dashboard;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardSummary {
    private String from;
    private String to;
    private String groupBy;
    private DashboardTotals summary;
    private DashboardTotals previous;
    private List<DashboardPoint> series;
    private List<PlanRevenue> revenueByPlan;
    private ActivePlans activePlans;
    private List<DashboardTopLut> topLuts;
}
