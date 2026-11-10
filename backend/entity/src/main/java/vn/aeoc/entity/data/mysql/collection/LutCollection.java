package vn.aeoc.entity.data.mysql.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import vn.aeoc.entity.data.mysql.lut.Lut;

import java.time.LocalDateTime;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LutCollection {
    private Integer id;
    private Integer userId;
    private String name;
    private LocalDateTime createdTime;
    private LocalDateTime updatedTime;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private Integer lutId;

    private Integer itemCount;
    private List<String> coverUrls;
    private Boolean containsLut;
    private List<Lut> luts;
}
