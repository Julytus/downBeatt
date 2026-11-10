package vn.aeoc.entity.data.mysql.collection;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CollectionItem {
    private Integer collectionId;
    private Integer lutId;
    private LocalDateTime createdTime;
}
