package vn.aeoc.business.download.repository;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.download.DownloadLog;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;
import vn.entity.backend.tables.records.DownloadLogRecord;

import java.time.LocalDateTime;
import java.util.List;

import static vn.entity.backend.Tables.DOWNLOAD_LOG;

@Repository
public class DownloadLogRepository extends AbsMysqlRepository<DownloadLogRecord, DownloadLog, Integer> {
    public DownloadLogRepository(DSLContext dslContext) {
        super(dslContext);
    }

    @Override
    protected TableImpl<DownloadLogRecord> getTable() {
        return DOWNLOAD_LOG;
    }

    public List<UserSignal> downloadSignals(Integer userId, LocalDateTime since) {
        if (userId == null) {
            return List.of();
        }
        var countField = DSL.count().as("count");
        var maxTimeField = DSL.max(DOWNLOAD_LOG.CREATED_TIME).as("last_time");

        return dslContext.select(DOWNLOAD_LOG.LUT_ID, countField, maxTimeField)
                .from(DOWNLOAD_LOG)
                .where(DOWNLOAD_LOG.USER_ID.eq(userId)
                        .and(DOWNLOAD_LOG.CREATED_TIME.ge(since)))
                .groupBy(DOWNLOAD_LOG.LUT_ID)
                .fetch(r -> new UserSignal(
                        "DOWNLOAD",
                        r.get(DOWNLOAD_LOG.LUT_ID),
                        null,
                        null,
                        r.get(countField),
                        r.get(maxTimeField)
                ));
    }
}
