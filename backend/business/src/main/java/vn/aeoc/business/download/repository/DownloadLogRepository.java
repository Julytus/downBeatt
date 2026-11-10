package vn.aeoc.business.download.repository;

import org.jooq.DSLContext;
import org.jooq.impl.TableImpl;
import org.springframework.stereotype.Repository;
import vn.aeoc.base.repo.AbsMysqlRepository;
import vn.aeoc.entity.data.mysql.download.DownloadLog;
import vn.entity.backend.tables.records.DownloadLogRecord;

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
}
