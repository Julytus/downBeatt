package vn.aeoc.authenticate.service.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.authenticate.repository.auth.ResourceRepository;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.entity.data.mysql.auth.Resource;

import java.util.List;
import java.util.Set;

/** Tài nguyên được phân quyền. `uri` phải khớp hằng URI của controller thì checkPermission mới nhận. */
@Service
public class ResourceService extends BaseService<ResourceRepository, Resource, Integer> {
    /** Resource của chính các trang phân quyền: không xoá, không đổi code / uri (đổi là tự khoá trang). */
    public static final Set<String> SYSTEM_CODES = Set.of("MODULE", "RESOURCE", "ROLE", "PERMISSION");

    public ResourceService(ResourceRepository repository, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
    }

    public Page<Resource> list(String keyword, Integer moduleId, Boolean unassigned, Pageable pageable) {
        return pageQuery(pageable,
                () -> repository.list(keyword, moduleId, unassigned, pageable),
                () -> repository.count(keyword, moduleId, unassigned));
    }

    public List<Resource> listAll() {
        return repository.listAll();
    }

    public Resource get(Integer id) {
        return require(id);
    }

    @Transactional
    public Resource upsert(Resource request) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        request.setName(CommonUtils.trimToNull(request.getName()));
        request.setDescription(CommonUtils.trimToNull(request.getDescription()));
        request.setCode(CommonUtils.trimToNull(request.getCode()));
        request.setUri(CommonUtils.trimToNull(request.getUri()));
        if (request.getActions() == null) request.setActions("[]");
        if (request.getActive() == null) request.setActive(1);

        if (!creating) {
            Resource current = require(request.getId());
            if (SYSTEM_CODES.contains(current.getCode())) {
                request.setCode(current.getCode());
                request.setUri(current.getUri());
            }
            checkDuplicateCode(request.getCode(), current.getId());
            repository.updateResource(request);
            return repository.getById(current.getId());
        }

        checkDuplicateCode(request.getCode(), null);
        request.setId(null);
        request.setGrantedActions(null);
        return insert(request);
    }

    @Transactional
    public Integer delete(Integer id) {
        Resource current = require(id);
        if (SYSTEM_CODES.contains(current.getCode())) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Không thể xoá tài nguyên hệ thống");
        }
        return repository.delete(current.getId());
    }

    public Integer assignModule(Integer moduleId, List<Integer> resourceIds) {
        if (resourceIds == null || resourceIds.isEmpty()) return 0;
        return repository.assignModule(moduleId, resourceIds);
    }

    public Integer clearModule(Integer moduleId) {
        return repository.clearModule(moduleId);
    }

    private void checkDuplicateCode(String code, Integer excludeId) {
        if (code != null && repository.existsByCode(code, excludeId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Mã tài nguyên đã tồn tại");
        }
    }

    private Resource require(Integer id) {
        Resource record = id == null ? null : getById(id);
        if (record == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND);
        }
        return record;
    }
}
