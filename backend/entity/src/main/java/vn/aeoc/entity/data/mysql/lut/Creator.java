package vn.aeoc.entity.data.mysql.lut;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Creator {
    private Integer id;
    private String name;
    private String slug;
    private String bio;
    private String avatarUrl;
    private Integer status;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
}
