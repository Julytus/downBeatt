package vn.aeoc.entity.data.mysql.account;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import lombok.EqualsAndHashCode;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;

import java.util.List;

/** Chi tiết tài khoản: mọi khoá của {@link UserAdminItem} + gói, số tổng hợp, sở thích, đơn và lượt tải gần đây. */
@Data
@EqualsAndHashCode(callSuper = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserAdminDetail extends UserAdminItem {
    private UserAdminSubscription subscription;
    private UserAdminStats stats;
    private List<String> preferences;
    private List<PaymentOrder> recentOrders;
    private List<UserDownloadItem> recentDownloads;
}
