package vn.aeoc.business.recommend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.recommend.eval.stats.EvalReportWriter;
import vn.aeoc.business.recommend.eval.stats.EvalSummaryBuilder;
import vn.aeoc.business.recommend.repository.RecEvalRunRepository;
import vn.aeoc.business.recommend.repository.RecEvalTestRepository;
import vn.aeoc.entity.data.mysql.recommend.RecEvalBatch;
import vn.aeoc.entity.data.mysql.recommend.RecEvalReport;
import vn.aeoc.entity.data.mysql.recommend.RecEvalRun;
import vn.aeoc.entity.data.mysql.recommend.RecEvalSummary;
import vn.aeoc.entity.data.mysql.recommend.RecEvalTest;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class RecEvalRunService extends BaseService<RecEvalRunRepository, RecEvalRun, Integer> {

    private final RecEvalTestRepository recEvalTestRepository;

    public RecEvalRunService(RecEvalRunRepository repository, QueryExecutor queryExecutor) {
        this(repository, null, queryExecutor);
    }

    @Autowired
    public RecEvalRunService(RecEvalRunRepository repository,
                             RecEvalTestRepository recEvalTestRepository,
                             QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.recEvalTestRepository = recEvalTestRepository;
    }

    public Page<RecEvalRun> list(String algorithm, String scenario, String batch, Integer page, Integer limit) {
        int p = (page == null || page <= 0) ? 1 : page;
        int l = (limit == null || limit <= 0) ? 20 : (limit > 100 ? 100 : limit);
        Pageable pageable = new Pageable().setPage(p).setLimit(l);
        String trimmedAlgo = (algorithm != null && !algorithm.trim().isEmpty()) ? algorithm.trim() : null;
        String trimmedScenario = (scenario != null && !scenario.trim().isEmpty()) ? scenario.trim() : null;
        String trimmedBatch = (batch != null && !batch.trim().isEmpty()) ? batch.trim() : null;
        return pageQuery(pageable,
                () -> repository.list(trimmedAlgo, trimmedScenario, trimmedBatch, pageable),
                () -> repository.count(trimmedAlgo, trimmedScenario, trimmedBatch));
    }

    public Page<RecEvalRun> list(String algorithm, String batch, Integer page, Integer limit) {
        int p = (page == null || page <= 0) ? 1 : page;
        int l = (limit == null || limit <= 0) ? 20 : (limit > 100 ? 100 : limit);
        Pageable pageable = new Pageable().setPage(p).setLimit(l);
        String trimmedAlgo = (algorithm != null && !algorithm.trim().isEmpty()) ? algorithm.trim() : null;
        String trimmedBatch = (batch != null && !batch.trim().isEmpty()) ? batch.trim() : null;
        return pageQuery(pageable,
                () -> repository.list(trimmedAlgo, trimmedBatch, pageable),
                () -> repository.count(trimmedAlgo, trimmedBatch));
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

    public Page<RecEvalBatch> batches(Integer page, Integer limit) {
        int p = (page == null || page <= 0) ? 1 : page;
        int l = (limit == null || limit <= 0) ? 20 : (limit > 100 ? 100 : limit);
        Pageable pageable = new Pageable().setPage(p).setLimit(l);

        Long total = repository.countBatches();
        if (total == null || total == 0L) {
            return new Page<>(0L, p, List.of());
        }

        List<String> batchCodes = repository.batchCodes(pageable);
        if (batchCodes.isEmpty()) {
            return new Page<>(total, p, List.of());
        }

        Set<String> batchesWithTests = (recEvalTestRepository != null)
                ? recEvalTestRepository.batchesWithTests(batchCodes)
                : Set.of();

        List<RecEvalRun> runs = repository.listByBatches(batchCodes);
        Map<String, List<RecEvalRun>> runsByBatch = new LinkedHashMap<>();
        for (String bc : batchCodes) {
            runsByBatch.put(bc, new ArrayList<>());
        }
        for (RecEvalRun r : runs) {
            List<RecEvalRun> bList = runsByBatch.get(r.getBatchCode());
            if (bList != null) {
                bList.add(r);
            }
        }

        List<RecEvalBatch> items = new ArrayList<>();
        for (String bc : batchCodes) {
            List<RecEvalRun> bRuns = runsByBatch.get(bc);
            if (bRuns == null || bRuns.isEmpty()) {
                continue;
            }
            RecEvalRun minIdRun = bRuns.get(0);
            String dataset = minIdRun.getDataset();
            Integer lutCount = null;
            Integer simUserCount = null;
            LocalDateTime createdTime = minIdRun.getCreatedTime();

            LinkedHashSet<Long> seedSet = new LinkedHashSet<>();
            LinkedHashSet<String> scenarioSet = new LinkedHashSet<>();

            for (RecEvalRun r : bRuns) {
                if (r.getParams() != null) {
                    Object sObj = r.getParams().get("seed");
                    if (sObj instanceof Number n) {
                        seedSet.add(n.longValue());
                    }
                    if (lutCount == null && r.getParams().get("lutCount") instanceof Number n) {
                        lutCount = n.intValue();
                    }
                    if (simUserCount == null && r.getParams().get("simUserCount") instanceof Number n) {
                        simUserCount = n.intValue();
                    }
                }
                if (r.getScenario() != null) {
                    scenarioSet.add(r.getScenario());
                }
                if (createdTime == null || (r.getCreatedTime() != null && r.getCreatedTime().isBefore(createdTime))) {
                    createdTime = r.getCreatedTime();
                }
            }

            boolean hasTests = batchesWithTests.contains(bc);

            items.add(RecEvalBatch.builder()
                    .batchCode(bc)
                    .dataset(dataset)
                    .seeds(new ArrayList<>(seedSet))
                    .runCount(bRuns.size())
                    .scenarios(new ArrayList<>(scenarioSet))
                    .lutCount(lutCount)
                    .simUserCount(simUserCount)
                    .hasTests(hasTests)
                    .createdTime(createdTime)
                    .build());
        }

        return new Page<>(total, p, items);
    }

    public RecEvalSummary summary(String batch) {
        String trimmed = (batch != null) ? batch.trim() : "";
        if (trimmed.isEmpty()) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lô đánh giá");
        }
        List<RecEvalRun> runs = repository.listByBatch(trimmed);
        if (runs.isEmpty()) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lô đánh giá");
        }
        List<RecEvalTest> tests = (recEvalTestRepository != null)
                ? recEvalTestRepository.listByBatch(trimmed)
                : List.of();
        return EvalSummaryBuilder.build(runs, tests);
    }

    public RecEvalReport report(String batch) {
        String trimmed = (batch != null) ? batch.trim() : "";
        if (trimmed.isEmpty()) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lô đánh giá");
        }
        List<RecEvalRun> runs = repository.listByBatch(trimmed);
        if (runs.isEmpty()) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy lô đánh giá");
        }
        List<RecEvalTest> tests = (recEvalTestRepository != null)
                ? recEvalTestRepository.listByBatch(trimmed)
                : List.of();
        String markdown = EvalReportWriter.render(runs, tests);
        String fileName = "ket-qua-danh-gia-" + trimmed + ".md";
        return RecEvalReport.builder()
                .batchCode(trimmed)
                .fileName(fileName)
                .markdown(markdown)
                .build();
    }

    @Transactional
    public void saveBatch(List<RecEvalRun> runs, List<RecEvalTest> tests) {
        if (runs != null && !runs.isEmpty()) {
            repository.insertAll(runs);
        }
        if (tests != null && !tests.isEmpty() && recEvalTestRepository != null) {
            recEvalTestRepository.insertAll(tests);
        }
    }

    @Transactional
    public void saveBatch(List<RecEvalRun> runs) {
        saveBatch(runs, List.of());
    }
}
