package vn.aeoc.entity.data.mysql.account;

import lombok.Data;

@Data
public class ChangeRoleRequest {
    private Integer id;
    private Integer roleId;
}
