package vn.aeoc.entity.data.mysql.lut;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LutColorFeature {
    @JsonIgnore
    private Integer id;
    private Integer lutId;
    private Double brightness;
    private Double contrast;
    private Double saturation;
    private Double warmth;
    private Double tint;
    private Double shadowA;
    private Double shadowB;
    private Double highlightA;
    private Double highlightB;
    private Integer isMono;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime computedTime;
}
