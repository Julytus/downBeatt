package vn.aeoc.authenticate.controller.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.entity.data.mysql.auth.User;

import java.security.Principal;

/** Tài khoản của chính người đăng nhập. */
@RestController
public class UserController extends BaseController {

    public UserController(UserService userService) {
        super(userService);
    }

    @GetMapping("/user/info")
    public ResponseEntity<ApiResponse<User>> getMyInfo(Principal principal) {
        return Mapper.map(userService.getUserById(SecurityUtils.userId(principal)), ApiResponse::okEntity);
    }

    @PostMapping("/user/update-password")
    public ResponseEntity<ApiResponse<User>> updatePassword(
            @RequestParam String oldPassword,
            @RequestParam String newPassword,
            Principal principal) {
        var result = userService.updateUserPassword(SecurityUtils.userId(principal), oldPassword, newPassword);
        return Mapper.map(result, ApiResponse::okEntity);
    }
}
