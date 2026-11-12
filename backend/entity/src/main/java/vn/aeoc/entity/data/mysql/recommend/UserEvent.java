package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserEvent {
    private Long id;
    private Integer userId;
    private String anonId;

    @JsonProperty("type")
    private String eventType;

    private Integer lutId;
    private String value;
    private Long impressionId;
    private LocalDateTime createdTime;
}
