package vn.aeoc.entity.data.mysql.lut;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;

@Data
public class LutCategory {
    private Integer id;
    private String slug;
    private String name;
    private String groupCode;
    private String description;
    private Integer isPopular;
    private Integer sortOrder;
    @JsonIgnore
    private Integer status;
}
