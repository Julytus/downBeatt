package vn.aeoc.authenticate.controller;

import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.SecurityUtils;
import vn.aeoc.entity.data.mysql.auth.User;

import java.security.Principal;

import static vn.aeoc.authenticate.util.SecurityUtils.userId;

/** Lớp cha của mọi controller nghiệp vụ (không phải bean: các controller con mới là bean). */
public abstract class BaseController {
    protected final UserService userService;

    protected BaseController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Kiểm tra quyền {@code action} của người đăng nhập trên resource {@code URI} (vd "/product/", "VIEW").
     * Không có quyền => 403. API key => quyền operator.
     */
    public User checkPermission(Principal principal, String URI, String action) {
        if (SecurityUtils.isApiKeyPrincipal(principal)) {
            return SecurityUtils.buildApiKeyOperator();
        }

        Integer loginId = userId(principal);
        User user = userService.checkPermission(loginId, URI, action);
        checkUserPermission(URI, action, user);
        return user;
    }

    private static User checkUserPermission(String URI, String action, User user) {
        if (user.getId() == null) {
            throw new AppException(ErrorCode.FORBIDDEN,
                    String.format("Bạn không có quyền thực hiện thao tác này! Path: %s, Action: %s", URI, action));
        }
        return user;
    }
}
