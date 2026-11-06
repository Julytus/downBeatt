package vn.aeoc.authenticate.controller.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.PermissionService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.entity.data.mysql.auth.Permission;
import vn.aeoc.entity.data.mysql.auth.Resource;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.pojo.EBPermissionResource;

import java.security.Principal;
import java.util.List;

@RestController
public class PermissionController extends BaseController {
    private static final String URI = "/permission/";

    private final PermissionService permissionService;

    public PermissionController(UserService userService, PermissionService permissionService) {
        super(userService);
        this.permissionService = permissionService;
    }

    /** Resource + actions mà người đăng nhập được dùng (client dựng menu / ẩn nút). Không cần quyền riêng. */
    @GetMapping("/permission/resource")
    public ResponseEntity<ApiResponse<List<EBPermissionResource>>> getPermissionResources(Principal principal) {
        User user = userService.getUserById(SecurityUtils.userId(principal));
        return Mapper.map(permissionService.getPermissionResources(user), ApiResponse::okEntity);
    }

    /** Ma trận phân quyền của một chức vụ: mọi tài nguyên + `grantedActions`. */
    @GetMapping("/permission/role")
    public ResponseEntity<ApiResponse<List<Resource>>> listForRole(@RequestParam Integer roleId, Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(permissionService.listForRole(roleId), ApiResponse::okEntity);
    }

    /** Body: mảng {roleId, resourceId, actions} — đặt lại đúng danh sách action của từng cặp. Trả số cặp đã đổi. */
    @PostMapping("/permission/update")
    public ResponseEntity<ApiResponse<Integer>> update(@RequestBody List<Permission> items, Principal principal) {
        checkPermission(principal, URI, "UPDATE");
        return Mapper.map(permissionService.update(items), ApiResponse::okEntity);
    }
}
