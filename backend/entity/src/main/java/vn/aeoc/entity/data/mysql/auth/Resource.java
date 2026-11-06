package vn.aeoc.entity.data.mysql.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

@Data
public class Resource {
    private Integer id;

    private String name;
    private String description;

    private String code;

    private String uri;
    private String actions;

    private Integer active;
    private Integer moduleId;

    /** Chỉ dùng ở GET /permission/role: mảng JSON action đã cấp cho chức vụ (không phải cột của bảng resource). */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String grantedActions;

    public Resource() {

    }

    public Resource(Resource p) {
        this.id = p.id;
        this.name = p.name;
        this.description = p.description;
        this.code = p.code;
        this.uri = p.uri;
        this.actions = p.actions;
        this.active = p.active;
        this.moduleId = p.moduleId;
        this.grantedActions = p.grantedActions;
    }
}
