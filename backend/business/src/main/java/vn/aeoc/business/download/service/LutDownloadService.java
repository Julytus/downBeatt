package vn.aeoc.business.download.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import vn.aeoc.authenticate.service.FileStorageService;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.business.account.event.UserSignalChangedEvent;
import vn.aeoc.business.billing.repository.PlanRepository;
import vn.aeoc.business.billing.repository.SubscriptionRepository;
import vn.aeoc.business.download.repository.DownloadLogRepository;
import vn.aeoc.business.lut.repository.LutRepository;
import vn.aeoc.entity.data.mysql.billing.Plan;
import vn.aeoc.entity.data.mysql.billing.Subscription;
import vn.aeoc.entity.data.mysql.download.DownloadLog;
import vn.aeoc.entity.data.mysql.lut.Lut;
import vn.aeoc.entity.data.mysql.recommend.UserSignal;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class LutDownloadService extends BaseService<DownloadLogRepository, DownloadLog, Integer> {
    private final LutRepository lutRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanRepository planRepository;
    private final FileStorageService fileStorageService;
    private final TransactionTemplate transactionTemplate;
    private final ApplicationEventPublisher publisher;
    private final Duration urlTtl;

    public LutDownloadService(DownloadLogRepository repository,
                              QueryExecutor queryExecutor,
                              LutRepository lutRepository,
                              SubscriptionRepository subscriptionRepository,
                              PlanRepository planRepository,
                              FileStorageService fileStorageService,
                              TransactionTemplate transactionTemplate,
                              ApplicationEventPublisher publisher,
                              @Value("${lut.download.url-ttl:5m}") Duration urlTtl) {
        super(repository, queryExecutor);
        this.lutRepository = lutRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.planRepository = planRepository;
        this.fileStorageService = fileStorageService;
        this.transactionTemplate = transactionTemplate;
        this.publisher = publisher;
        this.urlTtl = urlTtl;
    }

    /**
     * Tải LUT theo thứ tự 6 bước trong plan §5.1:
     * 1. 404 DATA_NOT_FOUND "Không tìm thấy LUT" nếu lutId null hoặc LUT không PUBLISHED.
     * 2. LUT ★: kiểm tra subscription ACTIVE còn hạn + can_download_premium == 1 -> nếu không: 403 PLAN_REQUIRED.
     * 3. file_key null -> 503 LUT_FILE_UNAVAILABLE.
     * 4. Kiểm tra/tạo zip trong MinIO, ký URL 5 phút -> lỗi MinIO ném 503 LUT_FILE_UNAVAILABLE.
     * 5. INSERT download_log + UPDATE lut.download_count trong một transaction bằng TransactionTemplate.
     * 6. Trả { fileName, url }.
     */
    public DownloadLog download(Integer userId, Integer lutId, String ip, LocalDate today) {
        // (1) 404 DATA_NOT_FOUND
        if (lutId == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
        }
        Lut lut = lutRepository.getPublishedById(lutId);
        if (lut == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND, "Không tìm thấy LUT");
        }

        // (2) LUT ★: kiểm tra gói Pro hoặc Studio còn hạn
        Subscription activeSub = subscriptionRepository.findActiveByUserId(userId, today);
        String planCode = "free";
        boolean canDownloadPremium = false;
        if (activeSub != null && activeSub.getPlanId() != null) {
            Plan plan = planRepository.getById(activeSub.getPlanId());
            if (plan != null) {
                if (plan.getCode() != null) {
                    planCode = plan.getCode();
                }
                if (plan.getCanDownloadPremium() != null && plan.getCanDownloadPremium() == 1) {
                    canDownloadPremium = true;
                }
            }
        }

        if (lut.getIsPremium() != null && lut.getIsPremium() == 1) {
            if (!canDownloadPremium) {
                throw new AppException(ErrorCode.PLAN_REQUIRED);
            }
        }

        // (3) file_key null -> LUT_FILE_UNAVAILABLE
        if (lut.getFileKey() == null || lut.getFileKey().isBlank()) {
            log.error("LUT id={} không có file_key", lutId);
            throw new AppException(ErrorCode.LUT_FILE_UNAVAILABLE);
        }

        // (4) MinIO zip & presign
        String base = LutPackage.baseName(lut.getTitle(), lut.getId());
        String fileName = LutPackage.fileName(base);
        String zipKey = LutPackage.zipKey(lut.getFileKey(), fileName);

        String presignedUrl;
        try {
            if (!fileStorageService.existsPrivate(zipKey)) {
                byte[] cubeBytes = fileStorageService.readPrivate(lut.getFileKey());
                byte[] zipBytes = LutPackage.zip(base, cubeBytes);
                fileStorageService.putPrivate(zipKey, zipBytes, "application/zip");
            }
            presignedUrl = fileStorageService.presignPrivateGet(zipKey, urlTtl, fileName, "application/zip");
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.LUT_FILE_UNAVAILABLE) {
                log.error("MinIO error for lutId={} and key={}: {}", lutId, zipKey, e.getMessage());
                throw e;
            }
            log.error("MinIO error for lutId={} and key={}: {}", lutId, zipKey, e.getMessage(), e);
            throw new AppException(ErrorCode.LUT_FILE_UNAVAILABLE);
        } catch (Exception e) {
            log.error("MinIO error for lutId={} and key={}: {}", lutId, zipKey, e.getMessage(), e);
            throw new AppException(ErrorCode.LUT_FILE_UNAVAILABLE);
        }

        // (5) Database transaction (sau MinIO)
        final String finalPlanCode = planCode;
        runInTransaction(() -> {
            DownloadLog logRecord = new DownloadLog();
            logRecord.setUserId(userId);
            logRecord.setLutId(lut.getId());
            logRecord.setPlanCode(finalPlanCode);
            logRecord.setIp(ip);
            repository.insert(logRecord);

            lutRepository.increaseDownloadCount(lut.getId());
        });

        publisher.publishEvent(new UserSignalChangedEvent(userId, "tải LUT"));

        // (6) Trả kết quả: chỉ chứa fileName và url
        DownloadLog response = new DownloadLog();
        response.setFileName(fileName);
        response.setUrl(presignedUrl);
        return response;
    }

    public List<UserSignal> downloadSignals(Integer userId, LocalDateTime since) {
        if (userId == null) {
            return List.of();
        }
        return repository.downloadSignals(userId, since);
    }

    private void runInTransaction(Runnable runnable) {
        if (transactionTemplate != null) {
            transactionTemplate.executeWithoutResult(status -> runnable.run());
        } else {
            runnable.run();
        }
    }
}
