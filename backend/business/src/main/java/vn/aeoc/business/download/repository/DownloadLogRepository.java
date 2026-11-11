package vn.aeoc.business.download.repository;

import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.business.recommend.stats.DownloadRow;
import vn.aeoc.entity.data.mysql.download.DownloadLog;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;
import vn.entity.backend.tables.records.DownloadLogRecord;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
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

    public java.util.Map<Integer, Integer> countByLutSince(LocalDateTime since) {
        if (since == null) {
            return java.util.Map.of();
        }
        var countField = DSL.count().as("c");
        return dslContext.select(DOWNLOAD_LOG.LUT_ID, countField)
                .from(DOWNLOAD_LOG)
                .where(DOWNLOAD_LOG.CREATED_TIME.ge(since))
                .groupBy(DOWNLOAD_LOG.LUT_ID)
                .fetchMap(DOWNLOAD_LOG.LUT_ID, countField);
    }

    public List<DownloadRow> listForStats(Collection<Integer> userIds, LocalDateTime from, LocalDateTime to) {
        if (userIds == null || userIds.isEmpty() || from == null || to == null) {
            return List.of();
        }
        List<Integer> idList = userIds instanceof List<Integer> l ? l : new ArrayList<>(userIds);
        List<DownloadRow> result = new ArrayList<>();
        int batchSize = 1000;
        for (int i = 0; i < idList.size(); i += batchSize) {
            List<Integer> batch = idList.subList(i, Math.min(i + batchSize, idList.size()));
            List<DownloadRow> rows = dslContext.select(DOWNLOAD_LOG.USER_ID, DOWNLOAD_LOG.LUT_ID, DOWNLOAD_LOG.CREATED_TIME)
                    .from(DOWNLOAD_LOG)
                    .where(DOWNLOAD_LOG.USER_ID.in(batch)
                            .and(DOWNLOAD_LOG.CREATED_TIME.ge(from))
                            .and(DOWNLOAD_LOG.CREATED_TIME.le(to)))
                    .fetch(r -> new DownloadRow(
                            r.get(DOWNLOAD_LOG.USER_ID),
                            r.get(DOWNLOAD_LOG.LUT_ID),
                            r.get(DOWNLOAD_LOG.CREATED_TIME)
                    ));
            result.addAll(rows);
        }
        return result;
    }
}
