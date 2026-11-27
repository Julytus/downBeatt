package vn.aeoc.entity.data.mysql.account;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** Một dòng tài khoản ở trang quản trị /admin/tai-khoan (không bao giờ chứa mật khẩu / token). */
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserAdminItem {
    private Integer id;
    private String name;
    private String email;
    private String phone;
    private String avatar;
    private Integer roleId;
    private String roleName;
    private Integer isOperator;
    /** ACTIVE | LOCKED, suy ra từ user_app.active */
    private String status;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime regisDate;
    private String planCode;
    private String planName;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate planExpiresAt;
}
