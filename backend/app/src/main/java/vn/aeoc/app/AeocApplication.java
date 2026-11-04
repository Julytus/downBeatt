package vn.aeoc.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jooq.JooqAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Entry point duy nhất của backend (modular monolith).
 * Quét toàn bộ "vn.aeoc" => mọi module (base, authenticate, ...) có trên classpath đều được nạp.
 */
@EnableScheduling
@SpringBootApplication(scanBasePackages = "vn.aeoc", exclude = {JooqAutoConfiguration.class})
public class AeocApplication {

    public static void main(String[] args) {
        SpringApplication.run(AeocApplication.class, args);
    }

}
