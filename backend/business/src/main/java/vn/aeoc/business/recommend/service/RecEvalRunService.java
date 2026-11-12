package vn.aeoc.business.recommend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.recommend.repository.RecEvalRunRepository;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;

import java.util.List;

@Service
public class RecEvalRunService extends BaseService<RecEvalRunRepository, RecEvalRun, Integer> {

    public RecEvalRunService(RecEvalRunRepository repository, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
    }

    public Page<RecEvalRun> list(String algorithm, String batch, Integer page, Integer limit) {
        int p = (page == null || page <= 0) ? 1 : page;
        int l = (limit == null || limit <= 0) ? 20 : (limit > 100 ? 100 : limit);
        Pageable pageable = new Pageable().setPage(p).setLimit(l);
        return pageQuery(pageable,
                () -> repository.list(algorithm, batch, pageable),
                () -> repository.count(algorithm, batch));
    }

    public RecEvalRun get(Integer id) {
        if (id == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lần chạy đánh giá");
        }
        RecEvalRun run = getById(id);
        if (run == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lần chạy đánh giá");
        }
        return run;
    }

    @Transactional
    public void saveBatch(List<RecEvalRun> runs) {
        if (runs == null || runs.isEmpty()) {
            return;
        }
        repository.insertAll(runs);
    }
}
