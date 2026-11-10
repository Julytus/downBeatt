package vn.aeoc.business.billing.payos;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Data
@Component
@ConfigurationProperties(prefix = "payos")
public class PayosProperties {
    private String baseUrl = "https://api-merchant.payos.vn";
    private String clientId;
    private String apiKey;
    private String checksumKey;

    public boolean isConfigured() {
        return clientId != null && !clientId.isBlank()
                && apiKey != null && !apiKey.isBlank()
                && checksumKey != null && !checksumKey.isBlank();
    }
}
