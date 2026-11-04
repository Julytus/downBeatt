package vn.aeoc.authenticate.controller.auth;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import vn.aeoc.base.config.model.ApiResponse;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.authenticate.config.property.SystemProperties;
import vn.aeoc.authenticate.controller.BaseController;
import vn.aeoc.authenticate.data.request.RefreshTokenRequest;
import vn.aeoc.authenticate.service.auth.LoginAttemptService;
import vn.aeoc.authenticate.service.auth.UserService;
import vn.aeoc.authenticate.util.Mapper;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.response.TokenResponse;

import java.util.concurrent.CompletableFuture;

@RestController
public class AuthController extends BaseController {
    private final SystemProperties systemProperties;
    private final LoginAttemptService loginAttemptService;

    public AuthController(SystemProperties systemProperties, UserService userService,
                          LoginAttemptService loginAttemptService) {
        super(userService);
        this.systemProperties = systemProperties;
        this.loginAttemptService = loginAttemptService;
    }

    @PostMapping("/user/authenticate")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @RequestBody User user) {
        if (!CommonUtils.NVL(user.getToken()).isEmpty()) {
            // Tắt mặc định: token Google hiện không được kiểm tra audience (client id) => app khác
            // có access token của người dùng cũng đăng nhập được. Chỉ bật sau khi bổ sung kiểm tra đó.
            if (!Boolean.TRUE.equals(systemProperties.getEnabledGoogleLogin())) {
                throw new AppException(ErrorCode.BAD_REQUEST, "Đăng nhập bằng Google chưa được bật");
            }
            User userDb = validateGooleLogin(userService.authByGoogle(user.getToken()));
            checkLoginUser(userDb);
            return Mapper.map(userService.issueTokens(userDb), ApiResponse::okEntity);
        }

        User userDb = validateUserAuthenticate(user);
        String identifier = StringUtils.isNotBlank(user.getEmail()) ? user.getEmail() : user.getPhone();
        loginAttemptService.checkNotLocked(identifier);
        try {
            // Sai tài khoản hay sai mật khẩu đều trả cùng 1 lỗi; trạng thái khoá chỉ báo khi mật khẩu đúng
            // => không dò được tài khoản nào tồn tại / bị khoá
            if (CommonUtils.NVL(userDb.getId()) <= 0) {
                throw new AppException(ErrorCode.INVALID_AUTHENTICATION_INFO);
            }
            userService.verifyPassword(user, userDb);
            loginAttemptService.onSuccess(identifier);
            if (CommonUtils.NVL(userDb.getActive()) != 1) throw new AppException(ErrorCode.LOCK_ACCOUNT);
            return Mapper.map(userService.issueTokens(userDb), ApiResponse::okEntity);
        } catch (AppException e) {
            if (e.getErrorCode() == ErrorCode.INVALID_AUTHENTICATION_INFO) {
                loginAttemptService.onFailure(identifier);
            }
            throw e;
        }
    }

    private static void checkLoginUser(User userDb) {
        if (CommonUtils.NVL(userDb.getId()) <= 0) {
            throw new AppException(ErrorCode.WRONG_LOGIN_INFO);
        }
        if (CommonUtils.NVL(userDb.getActive()) != 1) throw new AppException(ErrorCode.LOCK_ACCOUNT);
    }

    private User validateUserAuthenticate(User user) {
        if (StringUtils.isBlank(user.getPhone()) && StringUtils.isBlank(user.getEmail())) {
            throw new AppException(ErrorCode.MISSING_EMAIL_OR_PHONE);
        }
        if (StringUtils.isBlank(user.getPlainPassword())) {
            throw new AppException(ErrorCode.MISSING_PASSWORD);
        }

        CompletableFuture<User> futureEmail = CompletableFuture.supplyAsync(
                () -> userService.getUserByEmail(user.getEmail())
        );
        CompletableFuture<User> futurePhone = CompletableFuture.supplyAsync(
                () -> userService.getUserByPhone(user.getPhone())
        );

        User userByEmail = futureEmail.join();
        User userByPhone = futurePhone.join();

        if (CommonUtils.NVL(userByEmail.getId()) > 0) return userByEmail;
        if (CommonUtils.NVL(userByPhone.getId()) > 0) return userByPhone;
        return new User();
    }

    private User validateGooleLogin(User user) {
        User userByEmail = userService.getUserByEmail(user.getEmail());

        if (CommonUtils.NVL(userByEmail.getId()) > 0) return userByEmail;
        return new User();
    }

    /** Đổi refresh token (dùng 1 lần) lấy cặp token mới. Public: client gọi khi access token hết hạn. */
    @PostMapping("/auth/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@RequestBody RefreshTokenRequest request) {
        return Mapper.map(userService.refresh(request.getRefreshToken()), ApiResponse::okEntity);
    }

    /** Thu hồi refresh token của phiên hiện tại. Public: vẫn gọi được khi access token đã hết hạn. */
    @PostMapping("/auth/logout")
    public ResponseEntity<ApiResponse<String>> logout(@RequestBody RefreshTokenRequest request) {
        userService.logout(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công"));
    }

    @PostMapping("/auth/forgot-password")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @RequestBody User request) {

        userService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.ok("Nếu email có trong hệ thống, mã OTP đã được gửi"));
    }

    @PostMapping("/auth/reset-password")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @RequestBody User request) {

        userService.resetPassword(
                request.getEmail(),
                request.getOtp(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(ApiResponse.ok("Đặt lại mật khẩu thành công"));
    }
}
