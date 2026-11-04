package vn.aeoc.authenticate.controller.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.PermissionService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.pojo.EBPermissionResource;

import java.security.Principal;
import java.util.List;

@RestController
public class PermissionController extends BaseController {
    private final PermissionService permissionService;

    public PermissionController(UserService userService, PermissionService permissionService) {
        super(userService);
        this.permissionService = permissionService;
    }

    /** Resource + actions mà người đăng nhập được dùng (client dựng menu / ẩn nút). */
    @GetMapping("/permission/resource")
    public ResponseEntity<ApiResponse<List<EBPermissionResource>>> getPermissionResources(Principal principal) {
        User user = userService.getUserById(SecurityUtils.userId(principal));
        return Mapper.map(permissionService.getPermissionResources(user), ApiResponse::okEntity);
    }
}
