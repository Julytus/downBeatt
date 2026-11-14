package vn.aeoc.entity.data.mysql.billing;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Subscription {
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer id;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer userId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer planId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer orderId;

    private String cycle;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String status;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate startDate;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate endDate;

    private Integer autoRenew;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer activeUserId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime createdTime;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private LocalDateTime updatedTime;

    // Field response không thuộc bảng
    private String planCode;
    private String planName;

    public void setAutoRenew(Number val) {
        this.autoRenew = val == null ? null : val.intValue();
    }
}
