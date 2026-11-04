package vn.aeoc.entity.data.mysql.auth;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.sql.Timestamp;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class User {
    private Integer id;

    // Lấy từ role khi join (role.is_operator, role.name)
    private Integer isOperator;
    private Integer roleId;
    private String roleName;

    private String name;
    private String alias;
    private String avatar;

    private String phone;
    private Integer phoneVerified;
    private String email;

    // Mật khẩu đã băm: chỉ dùng nội bộ, không nhận từ client và không trả ra API
    @JsonIgnore
    private String password;

    // Mật khẩu chưa băm: chỉ nhận vào (đăng nhập), không bao giờ trả ra
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String plainPassword;
    private Integer hasPassword;

    private Timestamp regisDate;

    // Đặt lại mật khẩu bằng OTP (chỉ nhận vào; OTP lưu ở Redis, không lưu DB)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String newPassword;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String otp;

    private Integer active;
    // Là lần đầu đăng nhập
    private Integer firstTime;
    private Integer gender;

    // Access token Google khi đăng nhập bằng Google (chỉ nhận vào)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String token;
}
