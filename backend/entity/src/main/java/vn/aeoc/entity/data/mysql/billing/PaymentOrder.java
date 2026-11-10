package vn.aeoc.entity.data.mysql.billing;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentOrder {
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer id;

    private String code;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Long payosOrderCode;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer userId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer planId;

    private String cycle;
    private Long amount;
    private String status;

    private String checkoutUrl;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String payosPaymentLinkId;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String payosReference;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Object webhookPayload;

    private Integer sourceLutId;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime paidTime;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTime;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime updatedTime;

    // Các field mở rộng cho response
    private String planCode;
    private String planName;
    private String sourceLutSlug;
    private String sourceLutTitle;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate planExpiresAt;
}
