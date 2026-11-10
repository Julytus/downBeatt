package vn.aeoc.business.billing.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.business.billing.payos.PayosProperties;
import vn.aeoc.business.billing.payos.PayosSignature;
import vn.aeoc.business.billing.repository.PaymentOrderRepository;
import vn.aeoc.entity.data.mysql.billing.PaymentOrder;

@Slf4j
@Service
public class PayosWebhookService {
    private final PayosProperties payosProperties;
    private final PaymentOrderRepository paymentOrderRepository;
    private final PaymentActivationService paymentActivationService;

    public PayosWebhookService(PayosProperties payosProperties,
                               PaymentOrderRepository paymentOrderRepository,
                               PaymentActivationService paymentActivationService) {
        this.payosProperties = payosProperties;
        this.paymentOrderRepository = paymentOrderRepository;
        this.paymentActivationService = paymentActivationService;
    }

    public void handleWebhook(JsonNode body) {
        if (body == null || !body.isObject()) {
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }

        JsonNode dataNode = body.get("data");
        String signature = body.path("signature").asText(null);

        if (dataNode == null || !dataNode.isObject() || signature == null || signature.isBlank()) {
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }

        boolean valid = PayosSignature.verify(dataNode, signature, payosProperties.getChecksumKey());
        if (!valid) {
            log.warn("PayOS webhook invalid signature");
            throw new AppException(ErrorCode.INVALID_SIGNATURE);
        }

        String topCode = body.path("code").asText("00");
        String dataCode = dataNode.path("code").asText("00");
        boolean success = body.path("success").asBoolean(true);

        if (!"00".equals(topCode) || !"00".equals(dataCode) || !success) {
            log.info("PayOS webhook unhandled code: code={}, dataCode={}, success={}", topCode, dataCode, success);
            return;
        }

        long orderCode = dataNode.path("orderCode").asLong(0);
        if (orderCode <= 0) {
            log.info("PayOS webhook missing orderCode: {}", orderCode);
            return;
        }

        PaymentOrder order = paymentOrderRepository.getByPayosOrderCode(orderCode);
        if (order == null) {
            log.info("PayOS webhook orderCode not found: {}", orderCode);
            return;
        }

        long receivedAmount = dataNode.path("amount").asLong(0);
        if (!order.getAmount().equals(receivedAmount)) {
            log.warn("Webhook lệch số tiền: đơn {} cần {}, nhận {}", order.getCode(), order.getAmount(), receivedAmount);
            return;
        }

        String reference = dataNode.path("reference").asText(null);
        String rawPayload = body.toString();
        paymentActivationService.activate(order, reference, rawPayload);
    }
}
