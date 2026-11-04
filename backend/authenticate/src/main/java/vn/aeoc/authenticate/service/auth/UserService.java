package vn.aeoc.authenticate.service.auth;

import com.github.benmanes.caffeine.cache.Cache;
import com.google.gson.Gson;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import vn.aeoc.authenticate.constant.EmailContent;
import vn.aeoc.authenticate.repository.auth.UserRepository;
import vn.aeoc.authenticate.service.RestService;
import vn.aeoc.authenticate.service.cache.CacheKeyFactory;
import vn.aeoc.authenticate.util.PasswordPolicy;
import vn.aeoc.base.constant.ErrorCode;
import vn.aeoc.base.exception.AppException;
import vn.aeoc.base.util.CommonUtils;
import vn.aeoc.entity.data.mysql.auth.Role;
import vn.aeoc.entity.data.mysql.auth.User;
import vn.aeoc.entity.data.response.TokenResponse;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static vn.aeoc.authenticate.util.SecurityUtils.toSimpleSecurityUser;

/** Đăng nhập, cấp / gia hạn token, đổi / khôi phục mật khẩu, kiểm quyền theo role. */
@Slf4j(topic = "USER-SERVICE")
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PermissionService permissionService;
    private final JWTService jwtService;
    private final JavaMailSender mailSender;
    private final RestService restService;
    private final Cache<String, Object> authCache;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;

    public UserService(UserRepository userRepository,
                       PermissionService permissionService,
                       JWTService jwtService,
                       JavaMailSender mailSender,
                       RestService restService,
                       @Qualifier("authCache") Cache<String, Object> authCache,
                       OtpService otpService,
                       RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.permissionService = permissionService;
        this.jwtService = jwtService;
        this.mailSender = mailSender;
        this.restService = restService;
        this.authCache = authCache;
        this.otpService = otpService;
        this.refreshTokenService = refreshTokenService;
    }

    public User getUserById(Integer userId) {
        if (CommonUtils.NVL(userId) <= 0) throw new AppException(ErrorCode.LOGIN);
        User cached = (User) authCache.get(CacheKeyFactory.authUser(userId),
                key -> userRepository.getUserById(userId));
        return copyUser(cached);
    }

    public User getUserByPhone(String phone) {
        return userRepository.getUserByPhone(phone);
    }

    public User getUserByEmail(String email) {
        return userRepository.getUserByEmail(email);
    }

    /**
     * @return user đăng nhập nếu có quyền {@code action} trên {@code URI}; không có quyền => User rỗng (id null).
     */
    public User checkPermission(Integer userId, String URI, String action) {
        User user = getUserById(userId);
        // Bị khoá => chặn ngay, không chờ access token hết hạn
        if (CommonUtils.NVL(user.getId()) > 0 && CommonUtils.NVL(user.getActive()) != 1) {
            throw new AppException(ErrorCode.LOCK_ACCOUNT);
        }

        Role role = permissionService.getRole(user.getRoleId());
        if (role == null) return new User();
        if (Integer.valueOf(1).equals(role.getIsOperator())) return user;

        if (permissionService.checkPermission(role.getId(), URI, action) <= 0) {
            log.warn("Không có quyền: roleId {}, URI {}, action {}", role.getId(), URI, action);
            return new User();
        }
        return user;
    }

    /** Sai mật khẩu => INVALID_AUTHENTICATION_INFO. */
    public void verifyPassword(User user, User userDb) {
        if (user == null || user.getPlainPassword() == null || userDb.getPassword() == null
                || !BCrypt.checkpw(user.getPlainPassword(), userDb.getPassword())) {
            throw new AppException(ErrorCode.INVALID_AUTHENTICATION_INFO);
        }
    }

    /** Cấp cặp access token (JWT ngắn hạn) + refresh token (Redis, dài hạn). */
    public TokenResponse issueTokens(User userDb) {
        return new TokenResponse(
                jwtService.generateJwt(toSimpleSecurityUser(userDb)),
                refreshTokenService.issue(userDb.getId()),
                userDb.getId());
    }

    /** Đổi refresh token cũ (dùng 1 lần) lấy cặp token mới; user bị khoá / xoá => thu hồi mọi phiên. */
    public TokenResponse refresh(String refreshToken) {
        Integer userId = refreshTokenService.consume(refreshToken);
        User user = getUserById(userId);
        if (user == null || CommonUtils.NVL(user.getId()) <= 0 || CommonUtils.NVL(user.getActive()) != 1) {
            refreshTokenService.revokeAll(userId);
            throw new AppException(ErrorCode.REFRESH_TOKEN_INVALID);
        }
        return issueTokens(user);
    }

    public void logout(String refreshToken) {
        refreshTokenService.revoke(refreshToken);
    }

    public User updateUserPassword(Integer id, String oldPassword, String newPassword) {
        if (CommonUtils.NVL(id) <= 0) {
            throw new AppException("Người dùng không hợp lệ", BAD_REQUEST.value());
        }
        if (StringUtils.isAnyBlank(oldPassword, newPassword)) {
            throw new AppException("Mật khẩu cũ và mật khẩu mới không được để trống", BAD_REQUEST.value());
        }
        PasswordPolicy.validate(newPassword);
        if (oldPassword.equals(newPassword)) {
            throw new AppException("Mật khẩu mới phải khác mật khẩu cũ", BAD_REQUEST.value());
        }

        String currentPassword = userRepository.getUserPasswordById(id);
        if (StringUtils.isBlank(currentPassword)) {
            throw new AppException("Không tìm thấy người dùng", BAD_REQUEST.value());
        }
        if (!BCrypt.checkpw(oldPassword, currentPassword)) {
            throw new AppException("Mật khẩu cũ không chính xác", BAD_REQUEST.value());
        }

        userRepository.updatePass(id, BCrypt.hashpw(newPassword, BCrypt.gensalt()));
        evictAuthUser(id);
        // Đổi mật khẩu => đăng xuất mọi thiết bị (access token còn lại tự hết hạn)
        refreshTokenService.revokeAll(id);
        return getUserById(id);
    }

    /**
     * Gửi OTP khôi phục mật khẩu. Không báo email có tồn tại / bị khoá hay không
     * (tránh dò danh sách tài khoản): controller luôn trả cùng 1 thông báo.
     */
    public void forgotPassword(String email) {
        if (StringUtils.isBlank(email)) {
            throw new AppException("Email không được để trống", BAD_REQUEST.value());
        }

        User user = userRepository.getUserByEmail(email);
        if (CommonUtils.NVL(user.getId()) <= 0 || CommonUtils.NVL(user.getActive()) != 1) {
            log.info("Bỏ qua yêu cầu OTP: email không tồn tại hoặc tài khoản bị khoá");
            return;
        }

        otpService.issue(email).ifPresentOrElse(
                otp -> sendEmail(email, EmailContent.buildForgotPasswordEmail(user.getName(), otp)),
                () -> log.info("Bỏ qua yêu cầu OTP cho userId {}: vừa gửi mã gần đây", user.getId()));
    }

    public void resetPassword(String email, String otp, String newPassword) {
        if (StringUtils.isAnyBlank(email, otp, newPassword)) {
            throw new AppException("Thông tin không hợp lệ", BAD_REQUEST.value());
        }
        // Kiểm tra mật khẩu trước để mật khẩu yếu không làm tốn lượt nhập OTP
        PasswordPolicy.validate(newPassword);
        otpService.verify(email, otp);

        User user = userRepository.getUserByEmail(email);
        if (CommonUtils.NVL(user.getId()) <= 0) {
            throw new AppException(ErrorCode.OTP_INVALID);
        }

        userRepository.updatePass(user.getId(), BCrypt.hashpw(newPassword, BCrypt.gensalt()));
        evictAuthUser(user.getId());
        refreshTokenService.revokeAll(user.getId());
    }

    /** Lấy thông tin user từ access token Google (chỉ dùng khi bật system.enabled-google-login). */
    public User authByGoogle(String token) {
        String httpHeaders = String.format("""
                [{"key": "Authorization", "value": "Bearer %s"}]
                """, token);
        try {
            String response = restService.callApiFromPartner(
                    "https://www.googleapis.com/oauth2/v3/userinfo", "GET", null, null, httpHeaders, null);
            return new Gson().fromJson(response, User.class);
        } catch (Exception e) {
            log.error("Lỗi khi gọi Google UserInfo API: {}", e.getMessage(), e);
            throw new AppException(ErrorCode.BAD_REQUEST, "Không thể xác thực với Google");
        }
    }

    private void sendEmail(String email, String content) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(email);
            helper.setSubject("DownBeat - Khôi phục mật khẩu");
            helper.setText(content, true);
            mailSender.send(message);
            // Không log nội dung: email chứa OTP
            log.info("Đã gửi email khôi phục mật khẩu");
        } catch (Exception e) {
            log.error("Gửi email thất bại: {}", e.getMessage());
            throw new AppException("Gửi email thất bại", BAD_REQUEST.value());
        }
    }

    private void evictAuthUser(Integer userId) {
        if (userId != null) authCache.invalidate(CacheKeyFactory.authUser(userId));
    }

    /** Bản sao để caller sửa thoải mái mà không đụng object trong cache. */
    private static User copyUser(User source) {
        if (source == null) return new User();
        User copy = new User();
        copy.setId(source.getId());
        copy.setIsOperator(source.getIsOperator());
        copy.setRoleId(source.getRoleId());
        copy.setRoleName(source.getRoleName());
        copy.setName(source.getName());
        copy.setAlias(source.getAlias());
        copy.setAvatar(source.getAvatar());
        copy.setPhone(source.getPhone());
        copy.setPhoneVerified(source.getPhoneVerified());
        copy.setEmail(source.getEmail());
        copy.setRegisDate(source.getRegisDate() == null ? null : new java.sql.Timestamp(source.getRegisDate().getTime()));
        copy.setActive(source.getActive());
        copy.setFirstTime(source.getFirstTime());
        copy.setGender(source.getGender());
        return copy;
    }
}
