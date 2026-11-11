package vn.aeoc.entity.data.mysql.account;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserPreference {
    private Integer id;
    private Integer userId;
    private Integer categoryId;
    private LocalDateTime createdTime;

    private List<String> categorySlugs;

    public UserPreference(List<String> categorySlugs) {
        this.categorySlugs = categorySlugs;
    }
}
