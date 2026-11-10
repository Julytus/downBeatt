package vn.aeoc.business.account.service;

import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.response.TokenResponse;

@Service
public class AccountService {
    private final UserService userService;

    public AccountService(UserService userService) {
        this.userService = userService;
    }

    public TokenResponse register(User request) {
        return userService.register(request);
    }

    public User me(Integer userId) {
        if (userId == null || userId <= 0) {
            throw new AppException(ErrorCode.LOGIN);
        }
        User user = userService.getUserById(userId);
        if (user == null || user.getId() == null) {
            throw new AppException(ErrorCode.LOGIN);
        }
        if (CommonUtils.NVL(user.getActive()) != 1) {
            throw new AppException(ErrorCode.LOCK_ACCOUNT);
        }
        User result = new User();
        result.setId(user.getId());
        result.setName(user.getName());
        result.setEmail(user.getEmail());
        result.setPlan("free");
        // lát goi-thanh-toan đọc subscription ACTIVE để điền plan, planExpiresAt
        return result;
    }
}
