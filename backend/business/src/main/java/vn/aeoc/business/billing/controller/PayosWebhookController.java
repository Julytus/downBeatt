package vn.aeoc.business.billing.controller;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.billing.service.PayosWebhookService;

@RestController
public class PayosWebhookController {
    private final PayosWebhookService payosWebhookService;

    public PayosWebhookController(PayosWebhookService payosWebhookService) {
        this.payosWebhookService = payosWebhookService;
    }

    @PostMapping("/payment/payos/webhook")
    public ResponseEntity<ApiResponse<Void>> webhook(@RequestBody JsonNode body) {
        payosWebhookService.handleWebhook(body);
        return ApiResponse.okEntity(null);
    }
}
