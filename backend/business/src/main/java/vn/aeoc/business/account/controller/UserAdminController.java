package vn.aeoc.business.account.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.base.config.extention.paging.Page;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.business.account.service.UserAdminService;
import vn.aeoc.entity.data.mysql.account.ChangeRoleRequest;
import vn.aeoc.entity.data.mysql.account.UserAdminDetail;
import vn.aeoc.entity.data.mysql.account.UserAdminItem;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.aeoc.entity.data.mysql.auth.User;

import java.security.Principal;
import java.util.List;

/** Quản lý tài khoản ở /admin/tai-khoan. Các endpoint cũ /user/info, /user/update-password, /user/authenticate không kiểm resource. */
@RestController
public class UserAdminController extends BaseController {
    private static final String URI = "/user/";

    private final UserAdminService userAdminService;

    public UserAdminController(UserAdminService userAdminService, UserService userService) {
        super(userService);
        this.userAdminService = userAdminService;
    }

    @GetMapping("/user/list")
    public ResponseEntity<ApiResponse<Page<UserAdminItem>>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer roleId,
            @RequestParam(required = false) String planCode,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(userAdminService.list(keyword, roleId, planCode, status, page, limit), ApiResponse::okEntity);
    }

    @GetMapping("/user/get")
    public ResponseEntity<ApiResponse<UserAdminDetail>> get(@RequestParam(required = false) Integer id,
                                                            Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(userAdminService.get(id), ApiResponse::okEntity);
    }

    @GetMapping("/user/role-options")
    public ResponseEntity<ApiResponse<List<Role>>> roleOptions(Principal principal) {
        checkPermission(principal, URI, "VIEW");
        return Mapper.map(userAdminService.roleOptions(), ApiResponse::okEntity);
    }

    @PostMapping("/user/lock/{id}")
    public ResponseEntity<ApiResponse<UserAdminItem>> lock(@PathVariable Integer id, Principal principal) {
        User caller = checkPermission(principal, URI, "UPDATE");
        return Mapper.map(userAdminService.lock(caller, id), ApiResponse::okEntity);
    }

    @PostMapping("/user/unlock/{id}")
    public ResponseEntity<ApiResponse<UserAdminItem>> unlock(@PathVariable Integer id, Principal principal) {
        User caller = checkPermission(principal, URI, "UPDATE");
        return Mapper.map(userAdminService.unlock(caller, id), ApiResponse::okEntity);
    }

    @PostMapping("/user/change-role")
    public ResponseEntity<ApiResponse<UserAdminItem>> changeRole(
            @RequestBody(required = false) ChangeRoleRequest request, Principal principal) {
        User caller = checkPermission(principal, URI, "UPDATE");
        return Mapper.map(userAdminService.changeRole(caller, request), ApiResponse::okEntity);
    }
}
