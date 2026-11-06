package vn.aeoc.authenticate.service.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.authenticate.repository.auth.ModuleRepository;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.entity.data.mysql.auth.Module;

import java.util.List;

/** Module: nhóm tài nguyên để hiển thị (ma trận phân quyền gom theo module). */
@Service
public class ModuleService extends BaseService<ModuleRepository, Module, Integer> {
    private final ResourceService resourceService;

    public ModuleService(ModuleRepository repository, ResourceService resourceService, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.resourceService = resourceService;
    }

    public Page<Module> list(String keyword, Pageable pageable) {
        return pageQuery(pageable,
                () -> repository.list(keyword, pageable),
                () -> repository.count(keyword));
    }

    public Module get(Integer id) {
        return require(id);
    }

    @Transactional
    public Module upsert(Module request) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        request.setName(CommonUtils.trimToNull(request.getName()));
        request.setCode(CommonUtils.trimToNull(request.getCode()));
        request.setDescription(CommonUtils.trimToNull(request.getDescription()));
        if (request.getActive() == null) request.setActive(1);

        if (!creating) {
            Module current = require(request.getId());
            checkDuplicateCode(request.getCode(), current.getId());
            repository.updateModule(request);
            return repository.getById(current.getId());
        }

        checkDuplicateCode(request.getCode(), null);
        request.setId(null);
        return insert(request);
    }

    /** Xoá module: tài nguyên của nó chuyển về "Chưa phân module" (không xoá tài nguyên). */
    @Transactional
    public Integer delete(Integer id) {
        Module current = require(id);
        resourceService.clearModule(current.getId());
        return repository.delete(current.getId());
    }

    @Transactional
    public Integer assignResources(Integer moduleId, List<Integer> resourceIds) {
        Module current = require(moduleId);
        return resourceService.assignModule(current.getId(), resourceIds);
    }

    private void checkDuplicateCode(String code, Integer excludeId) {
        if (code != null && repository.existsByCode(code, excludeId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Mã module đã tồn tại");
        }
    }

    private Module require(Integer id) {
        Module record = id == null ? null : getById(id);
        if (record == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND);
        }
        return record;
    }
}
