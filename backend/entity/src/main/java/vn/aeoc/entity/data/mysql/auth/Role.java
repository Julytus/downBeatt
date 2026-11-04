package vn.aeoc.entity.data.mysql.auth;

import lombok.Data;

@Data
public class Role {
    private Integer id;
    private String name;

    // Role mặc định gán cho tài khoản mới
    private Integer isDefault;

    // 1 = toàn quyền (bỏ qua kiểm tra permission)
    private Integer isOperator;
}
