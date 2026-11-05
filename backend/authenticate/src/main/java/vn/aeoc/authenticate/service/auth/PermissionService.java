package vn.aeoc.authenticate.service.auth;

import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.repository.auth.PermissionRepository;
import vn.aeoc.authenticate.repository.auth.RoleRepository;
import vn.aeoc.authenticate.service.cache.CacheKeyFactory;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.entity.data.mysql.auth.Permission;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.pojo.EBPermissionResource;

import java.util.List;

/** Tra quyền theo role (có cache L1). Role operator có toàn quyền. */
@Service
public class PermissionService extends BaseService<PermissionRepository, Permission, Integer> {
    private final RoleRepository roleRepository;
    private final Cache<String, Object> authCache;

    public PermissionService(PermissionRepository repository,
                             RoleRepository roleRepository,
                             @Qualifier("authCache") Cache<String, Object> authCache,
                             QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.roleRepository = roleRepository;
        this.authCache = authCache;
    }

    public Role getRole(Integer roleId) {
        return CommonUtils.NVL(roleId) > 0 ? roleRepository.getById(roleId) : null;
    }

    /** Quyền của chính user đăng nhập (dựng menu phía client). */
    public List<EBPermissionResource> getPermissionResources(User user) {
        Role role = getRole(user.getRoleId());
        if (role == null) {
            return List.of();
        }
        return repository.getPermissionResources(role.getId(), role.getIsOperator());
    }

    public long checkPermission(Integer roleId, String uri, String action) {
        String cacheKey = CacheKeyFactory.authPermission(roleId, uri, action);
        Long count = (Long) authCache.get(cacheKey,
                key -> repository.checkPermission(roleId, uri, action));
        return count == null ? 0L : count;
    }
}
