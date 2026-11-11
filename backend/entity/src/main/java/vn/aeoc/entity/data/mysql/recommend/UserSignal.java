package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSignal {
    private String type;
    private Integer lutId;
    private String slug;
    private String value;
    private Integer count;

    @JsonIgnore
    private LocalDateTime lastTime;

    private Double days;
    private Double weight;

    public UserSignal(String type, Integer lutId, String slug, String value, Integer count, LocalDateTime lastTime) {
        this.type = type;
        this.lutId = lutId;
        this.slug = slug;
        this.value = value;
        this.count = count;
        this.lastTime = lastTime;
    }
}
