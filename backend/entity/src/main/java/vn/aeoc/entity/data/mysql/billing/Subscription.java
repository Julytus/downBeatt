package vn.aeoc.entity.data.mysql.billing;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Subscription {
    private Integer id;
    private Integer userId;
    private Integer planId;
    private Integer orderId;
    private String cycle;
    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private Integer autoRenew;
    private Integer activeUserId;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;

    public void setAutoRenew(Number val) {
        this.autoRenew = val == null ? null : val.intValue();
    }
}
