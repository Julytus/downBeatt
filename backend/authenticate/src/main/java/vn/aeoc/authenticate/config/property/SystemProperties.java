package vn.aeoc.authenticate.config.property;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "system")
public class SystemProperties {
    private Boolean enabledRegister;
    // Đăng nhập bằng Google (POST /user/authenticate với "token"); mặc định tắt
    private Boolean enabledGoogleLogin = false;
}
