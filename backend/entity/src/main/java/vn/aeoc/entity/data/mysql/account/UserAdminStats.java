package vn.aeoc.entity.data.mysql.account;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserAdminStats {
    private long paidOrders;
    private long totalPaid;
    private long downloads;
    private long collections;
}
