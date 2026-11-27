package vn.aeoc.entity.data.mysql.account;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserDownloadItem {
    private Integer lutId;
    private String lutSlug;
    private String lutTitle;
    private String coverUrl;
    /** Gói của khách lúc tải */
    private String planCode;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime createdTime;
}
