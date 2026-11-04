package vn.aeoc.base.config.jooq;

import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.SQLDialect;
import org.jooq.conf.Settings;
import org.jooq.impl.DSL;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.datasource.TransactionAwareDataSourceProxy;

import javax.sql.DataSource;
import java.util.logging.LogManager;

@Configuration
@RequiredArgsConstructor
public class JooqConfig {

    private final DataSource dataSource;

    /**
     * Bọc TransactionAwareDataSourceProxy để jOOQ tham gia transaction của Spring
     * (@Transactional / TransactionTemplate). Ngoài transaction vẫn auto-commit từng câu như cũ.
     * renderSchema(false): code sinh ra gắn schema lúc codegen (crm_jlt) — bỏ đi để dùng database
     * trong URL kết nối, mỗi môi trường đặt tên DB tuỳ ý (MYSQL_DATABASE).
     */
    @Bean
    public DSLContext dslContext() {
        LogManager.getLogManager().reset();
        return DSL.using(
                new TransactionAwareDataSourceProxy(dataSource),
                SQLDialect.MYSQL,
                new Settings().withRenderSchema(false)
        );
    }
}
