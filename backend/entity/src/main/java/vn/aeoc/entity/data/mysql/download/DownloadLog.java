package vn.aeoc.entity.data.mysql.download;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DownloadLog {
    private Integer id;
    private Integer userId;
    private Integer lutId;
    private String planCode;
    private String ip;
    private LocalDateTime createdTime;

    // Field không thuộc bảng (chỉ dùng cho response tải LUT)
    private String fileName;
    private String url;
}
