package vn.aeoc.entity.data.mysql.lut;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class Lut {
    private Integer id;
    private String slug;
    private String title;
    private String description;
    private Integer creatorId;
    private String creatorName;
    private String style;
    private Integer isPremium;
    private String status;
    private String coverUrl;
    private String previewType;
    private String beforeUrl;
    private String afterUrl;
    private String previewVideoUrl;
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String fileKey;
    private Integer fileSizeKb;
    private Integer lutSize;
    private Integer downloadCount;
    private LocalDateTime publishedTime;
    private Integer createdBy;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;
    private List<String> categories;
    private List<String> tags;
    // Chỉ trả ở /lut/feature/**
    private LutColorFeature colorFeature;
    private String featureError;
}
