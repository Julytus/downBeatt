package vn.aeoc.business.billing.payos;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class PayosClient {
    private final PayosProperties payosProperties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public PayosClient(PayosProperties payosProperties) {
        this.payosProperties = payosProperties;
        this.objectMapper = new ObjectMapper();

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    public record CreateLinkResult(String checkoutUrl, String paymentLinkId) {}
    public record PaymentLinkStatus(String status, Long amount, String reference, JsonNode rawPayload) {}

    private void checkConfigured() {
        if (!payosProperties.isConfigured()) {
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    public CreateLinkResult createLink(long orderCode, long amount, String description,
                                     String returnUrl, String cancelUrl, long expiredAt, String itemName) {
        checkConfigured();

        String signature = PayosSignature.signCreate(amount, cancelUrl, description, orderCode, returnUrl, payosProperties.getChecksumKey());

        Map<String, Object> body = Map.of(
                "orderCode", orderCode,
                "amount", amount,
                "description", description,
                "returnUrl", returnUrl,
                "cancelUrl", cancelUrl,
                "expiredAt", expiredAt,
                "items", List.of(Map.of("name", itemName, "quantity", 1, "price", amount)),
                "signature", signature
        );

        try {
            String url = payosProperties.getBaseUrl().replaceAll("/+$", "") + "/v2/payment-requests";
            JsonNode res = restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-client-id", payosProperties.getClientId())
                    .header("x-api-key", payosProperties.getApiKey())
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (res == null || !"00".equals(res.path("code").asText())) {
                log.error("PayOS createLink failed: code={}, desc={}",
                        res != null ? res.path("code").asText() : null,
                        res != null ? res.path("desc").asText() : null);
                throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
            }

            JsonNode data = res.path("data");
            String checkoutUrl = data.path("checkoutUrl").asText();
            String paymentLinkId = data.path("paymentLinkId").asText();
            return new CreateLinkResult(checkoutUrl, paymentLinkId);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("PayOS createLink error: {}", e.getMessage());
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    public PaymentLinkStatus getStatus(long orderCode) {
        checkConfigured();
        try {
            String url = payosProperties.getBaseUrl().replaceAll("/+$", "") + "/v2/payment-requests/" + orderCode;
            JsonNode res = restClient.get()
                    .uri(url)
                    .header("x-client-id", payosProperties.getClientId())
                    .header("x-api-key", payosProperties.getApiKey())
                    .retrieve()
                    .body(JsonNode.class);

            if (res == null || !"00".equals(res.path("code").asText())) {
                log.warn("PayOS getStatus failed for orderCode {}: code={}, desc={}",
                        orderCode,
                        res != null ? res.path("code").asText() : null,
                        res != null ? res.path("desc").asText() : null);
                throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
            }

            JsonNode data = res.path("data");
            String status = data.path("status").asText();
            Long amount = data.has("amount") ? data.path("amount").asLong() : null;
            String reference = null;
            if (data.has("transactions") && data.path("transactions").isArray() && !data.path("transactions").isEmpty()) {
                reference = data.path("transactions").get(0).path("reference").asText(null);
            }
            return new PaymentLinkStatus(status, amount, reference, res);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.warn("PayOS getStatus error for orderCode {}: {}", orderCode, e.getMessage());
            throw new AppException(ErrorCode.PAYMENT_GATEWAY_ERROR);
        }
    }

    public void cancelLink(long orderCode) {
        if (!payosProperties.isConfigured()) {
            return;
        }
        try {
            String url = payosProperties.getBaseUrl().replaceAll("/+$", "") + "/v2/payment-requests/" + orderCode + "/cancel";
            Map<String, String> body = Map.of("cancellationReason", "Khách huỷ đơn");
            restClient.post()
                    .uri(url)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("x-client-id", payosProperties.getClientId())
                    .header("x-api-key", payosProperties.getApiKey())
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.warn("PayOS cancelLink error for orderCode {}: {}", orderCode, e.getMessage());
        }
    }
}
