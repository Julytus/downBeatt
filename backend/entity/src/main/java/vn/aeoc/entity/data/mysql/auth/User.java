package vn.aeoc.entity.data.mysql.auth;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.sql.Timestamp;
import java.time.LocalDate;

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
    @JsonIgnore
    private String password;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String plainPassword;
    private Integer hasPassword;
    private Timestamp regisDate;
    private Integer active;
    private Integer firstTime;
    private Integer gender;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String token;
    // Gói khách hàng, chỉ trả ở /account/me
    private String plan;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate planExpiresAt;
}
