package vn.aeoc.authenticate.controller.auth;

import org.springdoc.core.annotations.ParameterObject;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.RoleService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.extention.paging.Pageable;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.entity.data.mysql.auth.Role;

import java.security.Principal;

import static vn.aeoc.authenticate.util.Mapper.map;

@RestController
public class RoleController extends BaseController {
    private static final String URI = "/role/";

    private final RoleService roleService;

    public RoleController(RoleService roleService, UserService userService) {
        super(userService);
        this.roleService = roleService;
    }

    @GetMapping("/role/list")
    public ResponseEntity<ApiResponse<Page<Role>>> list(
            @RequestParam(required = false) String keyword,
            @ParameterObject Pageable pageable,
            Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(roleService.list(keyword, pageable), ApiResponse::okEntity);
    }

    @GetMapping("/role/get")
    public ResponseEntity<ApiResponse<Role>> get(@RequestParam Integer id, Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return map(roleService.get(id), ApiResponse::okEntity);
    }

    @PostMapping("/role/update")
    public ResponseEntity<ApiResponse<Role>> update(@RequestBody Role request, Principal principal) {
        boolean creating = request.getId() == null || request.getId() <= 0;
        checkPermission(principal, URI, creating ? "ADD" : "UPDATE");
        return map(roleService.upsert(request), ApiResponse::okEntity);
    }

    @PostMapping("/role/delete/{id}")
    public ResponseEntity<ApiResponse<Integer>> delete(@PathVariable Integer id, Principal principal) {
        checkPermission(principal, URI, "DELETE");
        return map(roleService.delete(id), ApiResponse::okEntity);
    }
}
