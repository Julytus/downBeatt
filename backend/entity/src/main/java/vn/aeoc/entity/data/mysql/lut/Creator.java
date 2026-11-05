package vn.aeoc.entity.data.mysql.lut;

import lombok.Data;
import java.time.LocalDateTime;

@Data
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
