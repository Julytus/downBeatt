package vn.aeoc.entity.data.mysql.recommend;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LutSimilarity {
    private Integer id;
    private Integer lutId;
    private Integer similarLutId;
    private Double score;

    public LutSimilarity(Integer lutId, Integer similarLutId, Double score) {
        this.lutId = lutId;
        this.similarLutId = similarLutId;
        this.score = score;
    }
}
