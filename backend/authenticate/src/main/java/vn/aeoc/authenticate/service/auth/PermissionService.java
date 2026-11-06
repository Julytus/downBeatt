package vn.aeoc.authenticate.service.auth;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.benmanes.caffeine.cache.Cache;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.aeoc.authenticate.repository.auth.PermissionRepository;
import vn.aeoc.authenticate.repository.auth.RoleRepository;
import vn.aeoc.authenticate.service.cache.CacheKeyFactory;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.service.BaseService;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.base.util.QueryExecutor;
import vn.aeoc.entity.data.mysql.auth.Permission;
import vn.aeoc.entity.data.mysql.auth.Resource;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.pojo.EBPermissionResource;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Tra quyền theo role (có cache L1) và cấp quyền cho role. Role operator có toàn quyền. */
@Service
public class PermissionService extends BaseService<PermissionRepository, Permission, Integer> {
    private static final ObjectMapper JSON = new ObjectMapper();

    private final RoleRepository roleRepository;
    private final ResourceService resourceService;
    private final Cache<String, Object> authCache;

    public PermissionService(PermissionRepository repository,
                             RoleRepository roleRepository,
                             ResourceService resourceService,
                             @Qualifier("authCache") Cache<String, Object> authCache,
                             QueryExecutor queryExecutor) {
        super(repository, queryExecutor);
        this.roleRepository = roleRepository;
        this.resourceService = resourceService;
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

    /** Ma trận phân quyền: mọi tài nguyên, kèm `grantedActions` = action đã cấp cho chức vụ ("[]" nếu chưa cấp). */
    public List<Resource> listForRole(Integer roleId) {
        Role role = requireRole(roleId);
        Map<Integer, Permission> granted = repository.listByRole(role.getId()).stream()
                .collect(Collectors.toMap(Permission::getResourceId, Function.identity(), (a, b) -> a));
        return resourceService.listAll().stream().map(resource -> {
            Permission permission = granted.get(resource.getId());
            resource.setGrantedActions(permission == null || permission.getActions() == null
                    ? "[]" : permission.getActions());
            return resource;
        }).toList();
    }

    /**
     * Đặt lại danh sách action của từng cặp (roleId, resourceId) đúng như client gửi.
     * Chỉ nhận action tài nguyên hỗ trợ (hoặc đã cấp từ trước, để gỡ được). Danh sách rỗng = xoá dòng permission.
     */
    @Transactional
    public Integer update(List<Permission> items) {
        if (items == null || items.isEmpty()) return 0;
        Set<Integer> checkedRoles = new LinkedHashSet<>();
        int changed = 0;
        for (Permission item : items) {
            if (checkedRoles.add(item.getRoleId())) {
                requireRole(item.getRoleId());
            }
            Resource resource = item.getResourceId() == null ? null : resourceService.getById(item.getResourceId());
            if (resource == null) {
                throw new AppException(ErrorCode.DATA_NOT_FOUND);
            }
            Permission current = repository.getByRoleAndResource(item.getRoleId(), resource.getId());

            Set<String> allowed = new LinkedHashSet<>(parseActions(resource.getActions()));
            if (current != null) allowed.addAll(parseActions(current.getActions()));
            List<String> actions = new ArrayList<>(new LinkedHashSet<>(parseActions(item.getActions())));
            actions.retainAll(allowed);

            if (actions.isEmpty()) {
                if (current != null) changed += repository.delete(current.getId());
                continue;
            }
            String json = toJson(actions);
            if (current != null) {
                repository.updateActions(current.getId(), json);
            } else {
                Permission row = new Permission();
                row.setRoleId(item.getRoleId());
                row.setResourceId(resource.getId());
                row.setActions(json);
                insert(row);
            }
            changed++;
        }
        // Quyền đổi phải có hiệu lực ngay, không chờ cache 30 giây hết hạn
        authCache.invalidateAll();
        return changed;
    }

    private Role requireRole(Integer roleId) {
        Role role = getRole(roleId);
        if (role == null) {
            throw new AppException(ErrorCode.DATA_NOT_FOUND);
        }
        return role;
    }

    static List<String> parseActions(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return JSON.readValue(json, new TypeReference<List<String>>() { });
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.INPUT_WRONG);
        }
    }

    private static String toJson(List<String> actions) {
        try {
            return JSON.writeValueAsString(actions);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.INPUT_WRONG);
        }
    }
}
