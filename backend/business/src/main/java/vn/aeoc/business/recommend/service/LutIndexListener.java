package vn.aeoc.business.recommend.service;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import vn.aeoc.business.lut.event.LutCatalogChangedEvent;
import vn.aeoc.business.recommend.config.RecommendProperties;

@Component
public class LutIndexListener {

    private final LutIndexService lutIndexService;
    private final RecommendProperties properties;

    public LutIndexListener(LutIndexService lutIndexService, RecommendProperties properties) {
        this.lutIndexService = lutIndexService;
        this.properties = properties;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onCatalogChanged(LutCatalogChangedEvent event) {
        String reason = event.lutId() != null
                ? "LUT " + event.lutId() + ": " + event.reason()
                : event.reason();
        lutIndexService.rebuild(reason);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Order(100)
    public void onApplicationReady() {
        if (properties.isBuildOnStartup()) {
            lutIndexService.rebuild("khởi động");
        }
    }

    @Scheduled(cron = "${recommend.rebuild-cron:0 0 3 * * *}", zone = "Asia/Ho_Chi_Minh")
    public void onScheduleRebuild() {
        lutIndexService.rebuild("định kỳ 03:00");
    }
}
