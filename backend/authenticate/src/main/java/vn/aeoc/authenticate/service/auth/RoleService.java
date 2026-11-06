package vn.aeoc.authenticate.service.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.authenticate.repository.auth.RoleRepository;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.entity.data.mysql.auth.Role;

/** Chức vụ (role). Quyền của chức vụ sửa ở PermissionService. */
@Service
public class RoleService extends BaseService<RoleRepository, Role, Integer> {
    public RoleService(RoleRepository repository, QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
    }

    public Page<Role> list(String keyword, Pageable pageable) {
        return pageQuery(pageable,
                () -> repository.list(keyword, pageable),
                () -> repository.count(keyword));
    }

    public Role get(Integer id) {
        return require(id);
    }

    @Transactional
    public Role upsert(Role request) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        request.setName(CommonUtils.trimToNull(request.getName()));
        request.setIsDefault(CommonUtils.NVL(request.getIsDefault()) == 1 ? 1 : 0);
        request.setIsOperator(CommonUtils.NVL(request.getIsOperator()) == 1 ? 1 : 0);

        Role saved;
        if (!creating) {
            Role current = require(request.getId());
            checkDuplicateName(request.getName(), current.getId());
            repository.updateRole(request);
            saved = repository.getById(current.getId());
        } else {
            checkDuplicateName(request.getName(), null);
            request.setId(null);
            saved = insert(request);
        }
        // Chỉ một chức vụ mặc định (gán cho tài khoản mới)
        if (saved.getIsDefault() == 1) {
            repository.clearDefaultExcept(saved.getId());
        }
        return saved;
    }

    @Transactional
    public Integer delete(Integer id) {
        Role current = require(id);
        if (repository.countUsers(current.getId()) > 0) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Chức vụ đang được gán cho tài khoản, không thể xoá");
        }
        return repository.delete(current.getId());
    }

    private void checkDuplicateName(String name, Integer excludeId) {
        if (name != null && repository.existsByName(name, excludeId)) {
            throw new AppException(ErrorCode.BAD_REQUEST, "Tên chức vụ đã tồn tại");
        }
    }

    private Role require(Integer id) {
        Role record = id == null ? null : getById(id);
        if (record == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND);
        }
        return record;
    }
}
